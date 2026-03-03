
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

  // fetch master problems list (includes status per user)
  const url = "https://leetcode.com/api/problems/all/";
  const fetchFn = await getFetch();
  const res = await fetchFn(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`LeetCode problems fetch failed: ${res.status}`);
  }

  const payload = await res.json();
  const pairs = payload.stat_status_pairs || [];
  const categories = {};
  let total = 0;

  pairs.forEach((item) => {
    // status 1 means accepted
    if (item.status === 1) {
      total += 1;
      const tags = (item.stat || {}).topicTags || [];
      if (Array.isArray(tags) && tags.length > 0) {
        tags.forEach((tag) => {
          const name = String(tag.name || "");
          if (!name) return;
          categories[name] = (categories[name] || 0) + 1;
        });
      } else {
        categories.Others = (categories.Others || 0) + 1;
      }
    }
  });

  return {
    categories,
    languages: {},
    categoryTotal: total,
  };
}

module.exports = { getLeetCodeProfile, getLeetCodeAnalytics };
