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

async function fetchDifficultyStats(username) {
  const response = await fetch(
    "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      body: JSON.stringify({ handle: username }),
    }
  );

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
  // at the moment we don't have fine-grained tag data for GFG,
  // so just return empty maps; analytics service will count
  // unresolved problems into Others.
  if (!username || !String(username).trim()) {
    throw new Error("GeeksforGeeks username is required");
  }

  // we could extend this in future by scraping submissions or
  // using other internal APIs.
  const info = await getUserInfo(username).catch(() => null);
  const total = (info && (info.totalSolved || info.total)) || 0;
  return {
    languages: {},
    categories: {},
    categoryTotal: total,
  };
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
