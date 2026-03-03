const BASE = "https://codeforces.com/api";
const CACHE_TTL_MS = 10 * 60 * 1000;
const infoCache = new Map();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, retries = 5) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`Codeforces API error: ${res.status}`);
      return res.json();
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

  throw new Error(`Codeforces fetch failed after ${retries} attempts: ${lastError?.message || "Unknown error"}`);
}

async function getSolvedCount(handle) {
  // Smaller payload is more stable than requesting 10k submissions at once.
  const url = `${BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=3000`;
  const json = await fetchJson(url);
  if (json.status !== "OK") throw new Error("Codeforces response not OK");

  const solvedSet = new Set();
  for (const submission of json.result || []) {
    if (submission?.verdict !== "OK") continue;
    const problem = submission.problem || {};
    const contestId = problem.contestId ?? "";
    const index = problem.index ?? "";
    if (contestId !== "" && index !== "") {
      solvedSet.add(`${contestId}-${index}`);
    }
  }

  return solvedSet.size;
}

/**
 * Get basic user info for a handle
 * Returns { handle, rating, maxRating, rank, maxRank }
 */
async function getUserInfo(handle) {
  const normalizedHandle = String(handle || "").trim();
  if (!normalizedHandle) {
    throw new Error("Codeforces handle is required");
  }

  const cacheKey = normalizedHandle.toLowerCase();
  const cached = infoCache.get(cacheKey);

  const url = `${BASE}/user.info?handles=${encodeURIComponent(normalizedHandle)}`;
  let user;

  try {
    const json = await fetchJson(url);
    if (json.status !== "OK") throw new Error("Codeforces response not OK");
    user = json.result[0];
  } catch (error) {
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }
    throw error;
  }

  let totalSolved = null;
  try {
    totalSolved = await getSolvedCount(normalizedHandle);
  } catch (_) {
    if (cached?.data?.totalSolved !== undefined) {
      totalSolved = cached.data.totalSolved;
    }
  }

  const result = {
    handle: user.handle,
    rating: user.rating || null,
    maxRating: user.maxRating || null,
    rank: user.rank || null,
    maxRank: user.maxRank || null,
    totalSolved,
    total: totalSolved,
  };

  infoCache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}

/**
 * Get recent rating changes (optional)
 */
async function getRatingChanges(handle) {
  const url = `${BASE}/user.rating?handle=${encodeURIComponent(handle)}`;
  const json = await fetchJson(url);
  if (json.status !== "OK") throw new Error("Codeforces response not OK");
  return json.result || [];
}

module.exports = {
  getUserInfo,
  getRatingChanges,
};
