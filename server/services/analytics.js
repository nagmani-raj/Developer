const { getLeetCodeProfile, getLeetCodeAnalytics } = require("./leetcode");
const { getUserInfo, getGeeksforGeeksAnalytics } = require("./geeksforgeeks");

const CACHE_TTL_MS = 10 * 60 * 1000;
const analyticsCache = new Map();

const ALGORITHM_ORDER = [
  "Array",
  "String",
  "Dynamic Programming",
  "Graph",
  "Tree",
  "Hash Table",
  "Others",
];

function toSafeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeLanguageName(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase();

  if (key.includes("c++")) return "C++";
  if (key === "cpp") return "C++";
  if (key.includes("java")) return "Java";
  if (key.includes("python")) return "Python";
  if (key.includes("javascript")) return "JavaScript";
  if (key === "js") return "JavaScript";
  if (key === "typescript") return "TypeScript";
  if (key === "go" || key === "golang") return "Go";
  if (key.includes("c#")) return "C#";

  return raw;
}

function normalizeAlgorithmCategory(name) {
  const key = String(name || "").toLowerCase().trim();
  if (!key) return "Others";

  if (key.includes("array")) return "Array";
  if (key.includes("string")) return "String";
  if (key.includes("dynamic programming") || key === "dp") {
    return "Dynamic Programming";
  }
  if (
    key.includes("graph") ||
    key.includes("shortest path") ||
    key.includes("union find") ||
    key.includes("topological")
  ) {
    return "Graph";
  }
  if (
    key.includes("tree") ||
    key.includes("trie") ||
    key.includes("segment tree") ||
    key.includes("binary indexed tree")
  ) {
    return "Tree";
  }
  if (key.includes("hash")) return "Hash Table";

  return "Others";
}

function sortByProblemsDesc(items, key) {
  return [...items].sort((a, b) => toSafeNumber(b[key]) - toSafeNumber(a[key]));
}

function withPercentages(items, valueKey) {
  const total = items.reduce((sum, item) => sum + toSafeNumber(item[valueKey]), 0);
  if (total <= 0) {
    return items.map((item) => ({ ...item, percentage: 0 }));
  }

  return items.map((item) => {
    const count = toSafeNumber(item[valueKey]);
    return {
      ...item,
      percentage: Number(((count / total) * 100).toFixed(2)),
    };
  });
}

function mergeCountMap(target, sourceMap, normalizeName, fallbackName = "Others") {
  if (!sourceMap || typeof sourceMap !== "object") return;

  Object.entries(sourceMap).forEach(([name, rawCount]) => {
    const normalized = normalizeName(name) || fallbackName;
    const safeCount = toSafeNumber(rawCount);
    if (!safeCount) return;
    target[normalized] = toSafeNumber(target[normalized]) + safeCount;
  });
}

async function getCombinedAnalytics({ leetcode, geeksforgeeks } = {}) {
  const lcHandle = String(leetcode || "").trim();
  const gfgHandle = String(geeksforgeeks || "").trim();
  const cacheKey = `${lcHandle.toLowerCase()}|${gfgHandle.toLowerCase()}`;
  const cached = analyticsCache.get(cacheKey);

  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const languageCounts = {};
  const categoryCounts = Object.fromEntries(ALGORITHM_ORDER.map((name) => [name, 0]));
  const sourceStatus = {
    leetcode: { ok: false, error: null },
    geeksforgeeks: { ok: false, error: null },
  };

  const tasks = [];

  if (lcHandle) {
    tasks.push(
      (async () => {
        try {
          const [profile, analytics] = await Promise.all([
            getLeetCodeProfile(lcHandle),
            getLeetCodeAnalytics(lcHandle),
          ]);

          mergeCountMap(languageCounts, analytics.languages, normalizeLanguageName);
          mergeCountMap(categoryCounts, analytics.categories, normalizeAlgorithmCategory, "Others");

          const fromCategories = Object.values(analytics.categories || {}).reduce(
            (sum, value) => sum + toSafeNumber(value),
            0
          );
          const totalSolved = toSafeNumber(profile?.totalSolved);
          const uncategorized = Math.max(0, totalSolved - fromCategories);
          if (uncategorized > 0) {
            categoryCounts.Others = toSafeNumber(categoryCounts.Others) + uncategorized;
          }

          sourceStatus.leetcode = { ok: true, error: null };
        } catch (error) {
          sourceStatus.leetcode = { ok: false, error: error.message || "Unable to fetch LeetCode data" };
        }
      })()
    );
  } else {
    sourceStatus.leetcode = { ok: false, error: "Username not provided" };
  }

  if (gfgHandle) {
    tasks.push(
      (async () => {
        try {
          const [profile, analytics] = await Promise.all([
            getUserInfo(gfgHandle),
            getGeeksforGeeksAnalytics(gfgHandle),
          ]);

          mergeCountMap(languageCounts, analytics.languages, normalizeLanguageName);

          const knownGfgCategories =
            toSafeNumber(analytics?.categoryTotal) ||
            Object.values(analytics?.categories || {}).reduce(
              (sum, value) => sum + toSafeNumber(value),
              0
            );
          const gfgTotalSolved =
            toSafeNumber(profile?.totalSolved) || toSafeNumber(profile?.total) || 0;
          const unresolved = Math.max(0, gfgTotalSolved - knownGfgCategories);
          if (unresolved > 0) {
            categoryCounts.Others = toSafeNumber(categoryCounts.Others) + unresolved;
          }

          mergeCountMap(categoryCounts, analytics.categories, normalizeAlgorithmCategory, "Others");
          sourceStatus.geeksforgeeks = { ok: true, error: null };
        } catch (error) {
          sourceStatus.geeksforgeeks = {
            ok: false,
            error: error.message || "Unable to fetch GeeksforGeeks data",
          };
        }
      })()
    );
  } else {
    sourceStatus.geeksforgeeks = { ok: false, error: "Username not provided" };
  }

  await Promise.all(tasks);

  if (Object.keys(languageCounts).length === 0) {
    languageCounts.Others = 0;
  }

  const languageRows = withPercentages(
    sortByProblemsDesc(
      Object.entries(languageCounts).map(([language, problems]) => ({
        language,
        problems: toSafeNumber(problems),
      })),
      "problems"
    ),
    "problems"
  );

  const algorithmRows = withPercentages(
    sortByProblemsDesc(
      ALGORITHM_ORDER.map((category) => ({
        category,
        count: toSafeNumber(categoryCounts[category]),
      })),
      "count"
    ),
    "count"
  );

  const payload = {
    languages: languageRows,
    algorithms: algorithmRows,
    sourceStatus,
  };

  analyticsCache.set(cacheKey, { data: payload, ts: Date.now() });
  return payload;
}

module.exports = {
  getCombinedAnalytics,
};
