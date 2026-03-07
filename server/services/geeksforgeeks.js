async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  if (!response.ok) {
    throw new Error(`GeeksforGeeks request failed: ${response.status}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  if (!response.ok) {
    throw new Error(`GeeksforGeeks JSON request failed: ${response.status}`);
  }

  return response.json();
}

const GFG_SUBMISSIONS_API =
  "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/";
const GFG_PROBLEM_URL = "https://www.geeksforgeeks.org/problems";
const ANALYTICS_CACHE_TTL_MS = 10 * 60 * 1000;
const GFG_SCAN_LIMIT = 120;
const GFG_TAG_FETCH_CONCURRENCY = 8;

const problemTagCache = new Map();
const analyticsCache = new Map();

async function fetchFirstAvailable(urls) {
  let lastError = null;

  for (const url of urls) {
    try {
      const html = await fetchText(url);
      if (html && typeof html === "string" && html.length > 200) {
        return html;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch GeeksforGeeks profile");
}

function toSafeNumber(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function extractUserData(html) {
  const key = '\\"userData\\":';
  const startIndex = html.indexOf(key);
  if (startIndex === -1) return null;

  let i = startIndex + key.length;
  while (i < html.length && html[i] !== "{") i++;
  if (i >= html.length) return null;

  const jsonStart = i;
  let braceCount = 0;
  let endIndex = -1;

  while (i < html.length) {
    if (html[i] === "{") braceCount++;
    else if (html[i] === "}") braceCount--;
    if (braceCount === 0) {
      endIndex = i + 1;
      break;
    }
    i++;
  }

  if (endIndex === -1) return null;

  try {
    const jsonText = html.slice(jsonStart, endIndex).replace(/\\"/g, '"');
    const parsed = JSON.parse(jsonText);
    return parsed?.data || parsed || null;
  } catch (_) {
    return null;
  }
}

function countProblemsByDifficulty(result, key) {
  const bucket = result?.[key];
  if (!bucket || typeof bucket !== "object") return null;
  return Object.keys(bucket).length;
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getJsonPayloadFromHtml(html) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i
  );
  if (!match || !match[1]) return null;

  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return null;
  }
}

function findTopicTags(value) {
  if (!value || typeof value !== "object") {
    return [];
  }

  const queue = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (Array.isArray(current)) {
      current.forEach((item) => queue.push(item));
      continue;
    }

    const obj = current;
    if (
      Array.isArray(obj.topic_tags) &&
      obj.topic_tags.every((item) => typeof item === "string")
    ) {
      return obj.topic_tags.map((tag) => normalizeText(tag)).filter(Boolean);
    }

    Object.values(obj).forEach((item) => queue.push(item));
  }

  return [];
}

async function mapWithConcurrency(items, limit, mapper) {
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function fetchSolvedProblems(username) {
  const response = await fetch(GFG_SUBMISSIONS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    body: JSON.stringify({
      handle: username,
      requestType: "",
      year: "",
      month: "",
    }),
  });

  if (!response.ok) {
    throw new Error(`GeeksforGeeks submissions request failed: ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.result;
  if (!result || typeof result !== "object") {
    throw new Error("No solved problems found for this GeeksforGeeks username");
  }

  const uniqueBySlug = new Map();
  const languageCounts = {};

  Object.values(result).forEach((bucket) => {
    if (!bucket || typeof bucket !== "object") return;

    Object.values(bucket).forEach((problem) => {
      const slug = normalizeText(problem?.slug);
      if (!slug) return;
      if (uniqueBySlug.has(slug)) return;

      uniqueBySlug.set(slug, {
        slug,
        lang: normalizeText(problem?.lang),
      });

      if (problem?.lang) {
        const language = normalizeText(problem.lang);
        if (language) {
          languageCounts[language] = (languageCounts[language] || 0) + 1;
        }
      }
    });
  });

  return {
    solvedProblems: Array.from(uniqueBySlug.values()),
    languageCounts,
  };
}

async function fetchTopicTagsForSlug(slug) {
  const cacheKey = String(slug || "").trim().toLowerCase();
  if (!cacheKey) return [];

  const cached = problemTagCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const html = await fetchText(`${GFG_PROBLEM_URL}/${encodeURIComponent(slug)}/1`);
    const jsonPayload = getJsonPayloadFromHtml(html);
    const tags = findTopicTags(jsonPayload).filter(Boolean);
    problemTagCache.set(cacheKey, tags);
    return tags;
  } catch (_) {
    problemTagCache.set(cacheKey, []);
    return [];
  }
}

async function fetchDifficultyStats(username) {
  const response = await fetch(GFG_SUBMISSIONS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    body: JSON.stringify({ handle: username }),
  });

  if (!response.ok) {
    throw new Error(`GeeksforGeeks submissions request failed: ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.result;
  if (!result || typeof result !== "object") {
    return {};
  }

  const school = countProblemsByDifficulty(result, "School");
  const basic = countProblemsByDifficulty(result, "Basic");
  const easy = countProblemsByDifficulty(result, "Easy");
  const medium = countProblemsByDifficulty(result, "Medium");
  const hard = countProblemsByDifficulty(result, "Hard");

  const values = {};
  if (school !== null) values.school = school;
  if (basic !== null) values.basic = basic;
  if (easy !== null) values.easy = easy;
  if (medium !== null) values.medium = medium;
  if (hard !== null) values.hard = hard;

  return values;
}

async function fetchViaStatsCard(username) {
  // normalize the username here just like other helpers
  const normalizedUsername = String(username).trim();
  const safeUsername = encodeURIComponent(normalizedUsername);
  const data = await fetchJson(
    `https://gfgstatscard.vercel.app/${safeUsername}?raw=true`
  );

  if (!data || typeof data !== "object") {
    throw new Error("Invalid gfgstatscard payload");
  }

  const score =
    toSafeNumber(data.total_score) ??
    toSafeNumber(data.score) ??
    toSafeNumber(data.coding_score);
  const totalSolved =
    toSafeNumber(data.total_problems_solved) ??
    toSafeNumber(data.totalSolved) ??
    toSafeNumber(data.total);
  const easy = toSafeNumber(data.Easy) ?? toSafeNumber(data.easy);
  const medium = toSafeNumber(data.Medium) ?? toSafeNumber(data.medium);
  const hard = toSafeNumber(data.Hard) ?? toSafeNumber(data.hard);
  const basic = toSafeNumber(data.Basic) ?? toSafeNumber(data.basic);
  const school = toSafeNumber(data.School) ?? toSafeNumber(data.school);

  if (
    score === null &&
    totalSolved === null &&
    easy === null &&
    medium === null &&
    hard === null
  ) {
    throw new Error("Unable to parse gfgstatscard data");
  }

  const result = {
    username,
    score,
    codingScore: score,
    totalSolved,
    total: totalSolved,
    rank: null,
  };

  if (easy !== null) result.easy = easy;
  if (medium !== null) result.medium = medium;
  if (hard !== null) result.hard = hard;
  if (basic !== null) result.basic = basic;
  if (school !== null) result.school = school;

  return result;
}

function pickNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] !== undefined) {
      const value = Number(String(match[1]).replace(/,/g, ""));
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

function pickString(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return String(match[1]).trim();
    }
  }
  return null;
}

async function getUserInfo(username) {
  if (!username || !String(username).trim()) {
    throw new Error("GeeksforGeeks username is required");
  }

  const normalizedUsername = String(username).trim();
  const safeUsername = encodeURIComponent(normalizedUsername);
  let html = null;
  try {
    html = await fetchFirstAvailable([
      `https://www.geeksforgeeks.org/profile/${safeUsername}?tab=activity`,
      `https://www.geeksforgeeks.org/profile/${safeUsername}/?tab=activity`,
      `https://www.geeksforgeeks.org/profile/${safeUsername}`,
      `https://www.geeksforgeeks.org/profile/${safeUsername}/`,
      `https://auth.geeksforgeeks.org/user/${safeUsername}/`,
      `https://www.geeksforgeeks.org/user/${safeUsername}/`,
    ]);
  } catch (_) {
    html = null;
  }

  if (!html) {
    return fetchViaStatsCard(normalizedUsername);
  }

  if (/page you are looking for|404/i.test(html)) {
    return fetchViaStatsCard(normalizedUsername);
  }

  const score = pickNumber(html, [
    /"coding_score"\s*:\s*"?([\d,]+)"?/i,
    /"codingScore"\s*:\s*"?([\d,]+)"?/i,
    /Coding Score[\s\S]{0,200}?>([\d,]+)</i,
  ]);

  const totalSolved = pickNumber(html, [
    /"total_problems_solved"\s*:\s*"?([\d,]+)"?/i,
    /"problems_solved"\s*:\s*"?([\d,]+)"?/i,
    /"problemsSolvedCount"\s*:\s*"?([\d,]+)"?/i,
    /"solvedProblems"\s*:\s*"?([\d,]+)"?/i,
    /"problemSolved"\s*:\s*"?([\d,]+)"?/i,
    /"problemsSolved"\s*:\s*"?([\d,]+)"?/i,
    /"totalProblemsSolved"\s*:\s*"?([\d,]+)"?/i,
    /problem solved[\s\S]{0,120}?([\d,]+)/i,
    /problems solved[\s\S]{0,120}?([\d,]+)/i,
    /Problems Solved[\s\S]{0,200}?>([\d,]+)</i,
  ]);

  const rank = pickString(html, [
    /"institute_rank"\s*:\s*"([^"]+)"/i,
    /Rank[\s\S]{0,120}?>([^<]+)</i,
  ]);

  const userData = extractUserData(html);
  const resolvedScore =
    toSafeNumber(userData?.score) ??
    toSafeNumber(userData?.coding_score) ??
    score;
  const resolvedTotalSolved =
    toSafeNumber(userData?.total_problems_solved) ??
    totalSolved;

  let difficulty = {};
  try {
    difficulty = await fetchDifficultyStats(normalizedUsername);
  } catch (_) {
    difficulty = {};
  }

  if (
    difficulty.easy == null &&
    difficulty.medium == null &&
    difficulty.hard == null
  ) {
    try {
      const fallback = await fetchViaStatsCard(normalizedUsername);
      difficulty = {
        ...difficulty,
        easy: difficulty.easy ?? fallback.easy,
        medium: difficulty.medium ?? fallback.medium,
        hard: difficulty.hard ?? fallback.hard,
        basic: difficulty.basic ?? fallback.basic,
        school: difficulty.school ?? fallback.school,
      };
    } catch (_) {
      // Keep profile data even if fallback source fails.
    }
  }

  if (resolvedScore === null && resolvedTotalSolved === null && !rank) {
    return fetchViaStatsCard(normalizedUsername);
  }

  return {
    username: normalizedUsername,
    score: resolvedScore,
    codingScore: resolvedScore,
    totalSolved: resolvedTotalSolved,
    total: resolvedTotalSolved,
    rank,
    ...difficulty,
  };
}

async function getGeeksforGeeksAnalytics(username) {
  if (!username || !String(username).trim()) {
    throw new Error("GeeksforGeeks username is required");
  }

  const normalizedUsername = String(username).trim();
  const cacheKey = normalizedUsername.toLowerCase();
  const cached = analyticsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < ANALYTICS_CACHE_TTL_MS) {
    return cached.data;
  }

  const { solvedProblems, languageCounts } = await fetchSolvedProblems(normalizedUsername);
  const totalSolved = solvedProblems.length;
  const scannedProblems = solvedProblems.slice(0, GFG_SCAN_LIMIT);

  const tagsPerProblem = await mapWithConcurrency(
    scannedProblems,
    GFG_TAG_FETCH_CONCURRENCY,
    (problem) => fetchTopicTagsForSlug(problem.slug)
  );

  const categories = {};
  let problemsWithNoTags = 0;

  tagsPerProblem.forEach((tags) => {
    if (!Array.isArray(tags) || tags.length === 0) {
      problemsWithNoTags += 1;
      return;
    }

    tags.forEach((tag) => {
      const topic = normalizeText(tag);
      if (!topic) return;
      categories[topic] = (categories[topic] || 0) + 1;
    });
  });

  const unscannedProblems = Math.max(0, totalSolved - scannedProblems.length);
  const unresolvedProblems = problemsWithNoTags + unscannedProblems;
  if (unresolvedProblems > 0) {
    categories.Others = (categories.Others || 0) + unresolvedProblems;
  }

  const result = {
    languages: languageCounts,
    categories,
    categoryTotal: totalSolved,
  };

  analyticsCache.set(cacheKey, {
    data: result,
    ts: Date.now(),
  });

  return result;
}

module.exports = {
  getUserInfo,
  getGeeksforGeeksAnalytics,
};









// // ===============================================
// // GeeksforGeeks Advanced Scraper (Difficulty Breakdown)
// // ===============================================

// const cheerio = require("cheerio");

// async function fetchHTML(url) {
//   const response = await fetch(url, {
//     headers: {
//       "User-Agent": "Mozilla/5.0",
//     },
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to fetch GFG profile: ${response.status}`);
//   }

//   return await response.text();
// }

// function extractJSONFromHTML(html) {
//   const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/s);
//   if (!match) return null;

//   try {
//     return JSON.parse(match[1]);
//   } catch (err) {
//     return null;
//   }
// }

// async function getGeeksforGeeksData(username) {
//   if (!username) throw new Error("Username required");

//   const url = `https://www.geeksforgeeks.org/user/${username}/`;
//   const html = await fetchHTML(url);

//   if (/404|page not found/i.test(html)) {
//     throw new Error("GeeksforGeeks user not found");
//   }

//   const data = extractJSONFromHTML(html);

//   if (!data) {
//     throw new Error("Unable to parse profile data");
//   }

//   // ⚠️ Structure may slightly vary depending on account
//   const profile = data?.userData || {};
//   const stats = profile?.problemStats || {};

//   const easy = stats?.easy || 0;
//   const medium = stats?.medium || 0;
//   const hard = stats?.hard || 0;

//   const total = easy + medium + hard;

//   const codingScore = profile?.codingScore || 0;

//   return {
//     platform: "GeeksforGeeks",
//     username,
//     total,
//     codingScore,
//     easy,
//     medium,
//     hard,
//   };
// }

// module.exports = {
//   getGeeksforGeeksData,
// };
