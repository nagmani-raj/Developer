const DEFAULT_REMOTE_API_BASE = "https://developer-phcu.onrender.com";

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured && String(configured).trim()) {
    return String(configured).trim();
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    if (host === "localhost" || host === "127.0.0.1") {
      return `${protocol}//${host}:5000`;
    }
  }

  return DEFAULT_REMOTE_API_BASE;
}

const API_BASE_URL = resolveApiBaseUrl();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortLikeError(error) {
  if (!error) return false;
  const name = String(error.name || "");
  const message = String(error.message || "").toLowerCase();
  return (
    name === "AbortError" ||
    name === "TimeoutError" ||
    message.includes("aborted") ||
    message.includes("timed out")
  );
}

function logApiError(scope, error) {
  if (isAbortLikeError(error)) {
    console.warn(`${scope}: request timeout`);
    return;
  }
  console.error(`${scope}:`, error);
}

async function fetchApi(path, { retries = 2, timeoutMs = 90000 } = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${path} (${response.status})`);
      }

      const payload = await response.json();
      if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
      }

      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await wait(500 * attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error(`API request failed: ${path}`);
}

function toQueryString(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function getLivePlatforms({
  codeforces,
  leetcode,
  geeksforgeeks,
} = {}) {
  const debug = await getLivePlatformsDebug({
    codeforces,
    leetcode,
    geeksforgeeks,
  });
  return debug.normalized;
}

export async function getLivePlatformsDebug({
  codeforces,
  leetcode,
  geeksforgeeks,
} = {}) {
  const cacheKey = "LIVE_PLATFORMS_CACHE_V1";

  try {
    const query = toQueryString({
      codeforces,
      leetcode,
      geeksforgeeks,
    });
    const payload = await fetchApi(`/api/platforms/live${query}`, {
      retries: 3,
      timeoutMs: 90000,
    });

    const normalized = {};
    const statuses = {};

    if (Array.isArray(payload)) {
      payload.forEach((item) => {
        const key = (item.platform || "").toLowerCase();
        if (!key) return;

        if (item.data && !item.error) {
          normalized[key] = item.data;
          statuses[key] = { ok: true, error: null, data: item.data };
        } else {
          statuses[key] = { ok: false, error: item.error || "Unknown error", data: null };
        }
      });
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            normalized,
            statuses,
            ts: Date.now(),
          })
        );
      }
    } catch (_) {
      // ignore cache write issues
    }

    return { normalized, statuses, raw: payload };
  } catch (error) {
    if (!isAbortLikeError(error)) {
      console.error("getLivePlatforms error:", error);
    }

    try {
      if (typeof window !== "undefined") {
        const rawCache = localStorage.getItem(cacheKey);
        if (rawCache) {
          const cached = JSON.parse(rawCache);
          if (cached && typeof cached === "object" && cached.normalized) {
            return {
              normalized: cached.normalized || {},
              statuses: {
                ...(cached.statuses || {}),
                request: {
                  ok: false,
                  error: `Live request failed, showing cached data: ${
                    error.message || "Unknown error"
                  }`,
                  data: null,
                },
              },
              raw: [],
            };
          }
        }
      }
    } catch (_) {
      // ignore cache read issues
    }

    return {
      normalized: {},
      statuses: {
        request: { ok: false, error: error.message || "Live request failed", data: null },
      },
      raw: [],
    };
  }
}

export async function getPlatforms() {
  try {
    return await fetchApi("/api/platforms", { retries: 2, timeoutMs: 90000 });
  } catch (error) {
    logApiError("getPlatforms error", error);
    return [];
  }
}

export async function getProfile() {
  try {
    return await fetchApi("/api/profile", { retries: 2, timeoutMs: 90000 });
  } catch (error) {
    logApiError("getProfile error", error);
    return null;
  }
}

export async function getStats() {
  try {
    return await fetchApi("/api/stats", { retries: 2, timeoutMs: 90000 });
  } catch (error) {
    logApiError("getStats error", error);
    return null;
  }
}

export async function getWeeklyProgress() {
  try {
    return await fetchApi("/api/progress/weekly", { retries: 2, timeoutMs: 90000 });
  } catch (error) {
    logApiError("getWeeklyProgress error", error);
    return { days: [] };
  }
}

// fetch combined analytics (language + algorithm breakdown) for handles
export async function getAnalytics({ leetcode, geeksforgeeks } = {}) {
  try {
    const query = toQueryString({ leetcode, geeksforgeeks });
    return await fetchApi(`/api/stats/analytics${query}`, { retries: 2, timeoutMs: 90000 });
  } catch (error) {
    logApiError("getAnalytics error", error);
    return { languages: [], algorithms: [] };
  }
}

export async function getLanguages({ leetcode, geeksforgeeks } = {}) {
  try {
    const query = toQueryString({ leetcode, geeksforgeeks });
    return await fetchApi(`/api/languages${query}`, { retries: 2, timeoutMs: 90000 });
  } catch (error) {
    logApiError("getLanguages error", error);
    return [];
  }
}

export async function getAlgorithms({ leetcode, geeksforgeeks } = {}) {
  try {
    const query = toQueryString({ leetcode, geeksforgeeks });
    return await fetchApi(`/api/algorithms${query}`, { retries: 2, timeoutMs: 90000 });
  } catch (error) {
    logApiError("getAlgorithms error", error);
    return [];
  }
}
