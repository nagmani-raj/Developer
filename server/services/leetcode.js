
const LEETCODE_URL = "https://leetcode.com/graphql";
const CACHE_TTL_MS = 10 * 60 * 1000;
const profileCache = new Map();
let fetchImpl = globalThis.fetch;

const query = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      languageProblemCount {
        languageName
        problemsSolved
      }
      tagProblemCounts {
        advanced {
          tagName
          problemsSolved
        }
        intermediate {
          tagName
          problemsSolved
        }
        fundamental {
          tagName
          problemsSolved
        }
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      attendedContestsCount
    }
  }
`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFetch() {
  if (fetchImpl) return fetchImpl;

  try {
    const module = await import("node-fetch");
    fetchImpl = module.default;
    return fetchImpl;
  } catch {
    throw new Error(
      "Fetch API not available. Use Node.js 18+ or install node-fetch correctly."
    );
  }
}

async function parseLeetCodeResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = await response.text();

  if (!response.ok) {
    const snippet = payload.slice(0, 180).replace(/\s+/g, " ").trim();
    throw new Error(
      `LeetCode request failed: ${response.status}${snippet ? ` - ${snippet}` : ""}`
    );
  }

  if (!contentType.includes("application/json")) {
    const snippet = payload.slice(0, 180).replace(/\s+/g, " ").trim();
    throw new Error(`Unexpected LeetCode response format${snippet ? `: ${snippet}` : ""}`);
  }

  try {
    return JSON.parse(payload);
  } catch {
    throw new Error("Invalid JSON received from LeetCode");
  }
}

async function fetchLeetCode(username, retries = 5) {
  let lastError = null;
  const fetchFn = await getFetch();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetchFn(LEETCODE_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://leetcode.com",
          Referer: `https://leetcode.com/u/${encodeURIComponent(username)}/`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
        },
        body: JSON.stringify({
          query,
          variables: { username },
        }),
      });

      const data = await parseLeetCodeResponse(response);

      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        throw new Error(data.errors[0]?.message || "LeetCode GraphQL error");
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const jitter = Math.floor(Math.random() * 250);
        await wait(600 * attempt + jitter);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(
    `Failed to fetch from LeetCode after ${retries} attempts: ${
      lastError?.message || "Unknown error"
    }`
  );
}

async function getLeetCodeProfile(username) {
  if (!username || !String(username).trim()) {
    throw new Error("LeetCode username is required");
  }

  const normalizedUsername = String(username).trim();
  const cacheKey = normalizedUsername.toLowerCase();
  const cached = profileCache.get(cacheKey);
  let data;

  try {
    data = await fetchLeetCode(normalizedUsername);
  } catch (error) {
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }
    throw error;
  }

  if (!data?.data?.matchedUser) {
    throw new Error("User not found");
  }

  const matchedUser = data.data.matchedUser;
  const stats = matchedUser.submitStats.acSubmissionNum || [];
  const contest = data.data.userContestRanking || null;

  const parsedContestRating =
    contest && Number.isFinite(Number(contest.rating))
      ? Math.round(Number(contest.rating))
      : null;
  const parsedContestGlobalRanking =
    contest && Number.isFinite(Number(contest.globalRanking))
      ? Math.trunc(Number(contest.globalRanking))
      : null;
  const parsedAttendedContests =
    contest && Number.isFinite(Number(contest.attendedContestsCount))
      ? Math.trunc(Number(contest.attendedContestsCount))
      : 0;

  const result = {
    totalSolved: stats.find((s) => s.difficulty === "All")?.count || 0,
    easy: stats.find((s) => s.difficulty === "Easy")?.count || 0,
    medium: stats.find((s) => s.difficulty === "Medium")?.count || 0,
    hard: stats.find((s) => s.difficulty === "Hard")?.count || 0,
    contestRating: parsedContestRating,
    contestGlobalRanking: parsedContestGlobalRanking,
    attendedContestsCount: parsedAttendedContests,
  };

  profileCache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}


async function getLeetCodeAnalytics(username) {
  if (!username || !String(username).trim()) {
    throw new Error("LeetCode username is required");
  }

  const normalizedUsername = String(username).trim();
  const data = await fetchLeetCode(normalizedUsername);
  const user = data?.data?.matchedUser;
  if (!user) {
    throw new Error("LeetCode user not found");
  }

  const languages = {};
  (user.languageProblemCount || []).forEach((row) => {
    const name = String(row?.languageName || "").trim();
    const solved = Number(row?.problemsSolved);
    if (!name || !Number.isFinite(solved) || solved <= 0) return;
    languages[name] = (languages[name] || 0) + solved;
  });

  const categories = {};
  const buckets = user.tagProblemCounts || {};
  ["advanced", "intermediate", "fundamental"].forEach((level) => {
    const tags = Array.isArray(buckets[level]) ? buckets[level] : [];
    tags.forEach((tag) => {
      const name = String(tag?.tagName || "").trim();
      const solved = Number(tag?.problemsSolved);
      if (!name || !Number.isFinite(solved) || solved <= 0) return;
      categories[name] = (categories[name] || 0) + solved;
    });
  });

  const stats = user.submitStats?.acSubmissionNum || [];
  const totalRow = stats.find((row) => row?.difficulty === "All");
  const total = Number(totalRow?.count);

  return {
    categories,
    languages,
    categoryTotal: Number.isFinite(total) && total > 0 ? total : 0,
  };
}

module.exports = { getLeetCodeProfile, getLeetCodeAnalytics };
