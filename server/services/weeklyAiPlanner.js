const fs = require("fs");
const path = require("path");
const { getCombinedAnalytics } = require("./analytics");
const { getLeetCodeProfile } = require("./leetcode");
const { getUserInfo } = require("./geeksforgeeks");

const STORE_PATH = path.join(__dirname, "..", "data", "ai-weekly-plans.json");
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getFetchImpl() {
  if (typeof fetch === "function") return fetch.bind(globalThis);
  return (...args) => import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args));
}

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ensureStoreFile() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ users: {} }, null, 2));
  }
}

function readStore() {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.users && typeof parsed.users === "object") {
      return parsed;
    }
  } catch (_) {}

  return { users: {} };
}

function writeStore(store) {
  ensureStoreFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function getUserKey({ leetcode, geeksforgeeks }) {
  const lc = String(leetcode || "").trim().toLowerCase();
  const gfg = String(geeksforgeeks || "").trim().toLowerCase();
  return `${lc || "no-lc"}|${gfg || "no-gfg"}`;
}

function getCurrentDayName(timezone) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: timezone || "UTC",
  }).format(new Date());

  return DAYS.includes(weekday) ? weekday : DAYS[new Date().getDay()];
}

function rotateDays(startDay) {
  const startIndex = DAYS.indexOf(startDay);
  if (startIndex < 0) return [...DAYS];
  return [...DAYS.slice(startIndex), ...DAYS.slice(0, startIndex)];
}

async function getDifficultyStats({ leetcode, geeksforgeeks }) {
  const stats = {
    totalSolved: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  };

  const tasks = [];

  if (leetcode) {
    tasks.push(
      getLeetCodeProfile(leetcode)
        .then((profile) => {
          stats.totalSolved += toSafeNumber(profile?.totalSolved);
          stats.easy += toSafeNumber(profile?.easy);
          stats.medium += toSafeNumber(profile?.medium);
          stats.hard += toSafeNumber(profile?.hard);
        })
        .catch(() => {})
    );
  }

  if (geeksforgeeks) {
    tasks.push(
      getUserInfo(geeksforgeeks)
        .then((profile) => {
          stats.totalSolved +=
            toSafeNumber(profile?.totalSolved) || toSafeNumber(profile?.total) || 0;
          stats.easy += toSafeNumber(profile?.easy);
          stats.medium += toSafeNumber(profile?.medium);
          stats.hard += toSafeNumber(profile?.hard);
        })
        .catch(() => {})
    );
  }

  await Promise.all(tasks);

  if (!stats.totalSolved) {
    stats.totalSolved = stats.easy + stats.medium + stats.hard;
  }

  return stats;
}

function buildAnalysisPayload({ analytics, stats, currentDay, timezone }) {
  const topCategories = Array.isArray(analytics?.algorithms) ? analytics.algorithms.slice(0, 8) : [];
  const topLanguages = Array.isArray(analytics?.languages) ? analytics.languages.slice(0, 8) : [];

  return {
    currentDay,
    timezone: timezone || "UTC",
    totalSolved: stats.totalSolved,
    difficulty: {
      easy: stats.easy,
      medium: stats.medium,
      hard: stats.hard,
    },
    topCategories,
    topLanguages,
    sourceStatus: analytics?.sourceStatus || {},
  };
}

function normalizePlan(payload, currentDay) {
  const orderedDays = rotateDays(currentDay);
  const weeklyPlan = Array.isArray(payload?.weeklyPlan) ? payload.weeklyPlan : [];
  const normalizedWeeklyPlan = orderedDays.map((day, index) => {
    const row = weeklyPlan[index] || {};
    const questions = Array.isArray(row.questions) ? row.questions.slice(0, 2) : [];

    return {
      day,
      questions: questions.map((question, questionIndex) => ({
        difficulty:
          String(question?.difficulty || (day === "Sunday" && questionIndex === 1 ? "Hard" : questionIndex === 0 ? day === "Sunday" ? "Medium" : "Easy" : "Medium")),
        title: String(question?.title || ""),
        platform: String(question?.platform || "LeetCode"),
      })),
    };
  });

  return {
    alert: String(payload?.alert || ""),
    startDay: currentDay,
    focusCategory: String(payload?.focusCategory || ""),
    weeklyPlan: normalizedWeeklyPlan,
  };
}

function validatePlan(plan) {
  if (!plan || typeof plan !== "object") return false;
  if (!plan.alert || !Array.isArray(plan.weeklyPlan) || plan.weeklyPlan.length !== 7) return false;

  return plan.weeklyPlan.every(
    (dayPlan) =>
      dayPlan &&
      typeof dayPlan === "object" &&
      typeof dayPlan.day === "string" &&
      Array.isArray(dayPlan.questions) &&
      dayPlan.questions.length === 2 &&
      dayPlan.questions.every(
        (question) =>
          question &&
          typeof question === "object" &&
          typeof question.difficulty === "string" &&
          typeof question.title === "string" &&
          question.title.trim() &&
          typeof question.platform === "string"
      )
  );
}

async function generateWeeklyPlanWithOpenAI({ analysis, previousQuestions }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const fetchImpl = getFetchImpl();
  const currentDay = analysis.currentDay;
  const orderedDays = rotateDays(currentDay);
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const prompt = {
    analysis,
    previousQuestions,
    formatRules: [
      "Return strict JSON only. No markdown.",
      "Use exactly 7 days starting from analysis.currentDay.",
      "For Sunday suggest exactly 1 Medium and 1 Hard question.",
      "For all other days suggest exactly 1 Easy and 1 Medium question.",
      "Do not repeat any question from previousQuestions.",
      "Do not repeat any question within the same weeklyPlan.",
      "Choose questions using analysis.topCategories as the main signal.",
      "Keep alert close to this style: Alert:- You have just completed 20 questions on arrays, so you need to do 40 more. I am creating a plan for you for this week",
      `The ordered days must be exactly: ${orderedDays.join(", ")}`,
    ],
    responseShape: {
      alert: "string",
      focusCategory: "string",
      weeklyPlan: [
        {
          day: "string",
          questions: [
            {
              difficulty: "Easy|Medium|Hard",
              title: "string",
              platform: "LeetCode|GFG|Codeforces",
            },
          ],
        },
      ],
    },
  };

  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You create personalized weekly DSA study plans. Output valid JSON only.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(prompt),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`.slice(0, 300));
  }

  const data = await response.json();
  const text = String(data?.output_text || "").trim();
  if (!text) {
    throw new Error("Empty response from OpenAI");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    throw new Error("Invalid JSON returned by OpenAI");
  }

  const normalized = normalizePlan(parsed, currentDay);
  if (!validatePlan(normalized)) {
    throw new Error("OpenAI plan shape is invalid");
  }

  return normalized;
}

function extractQuestionTitles(weeklyPlan) {
  return (Array.isArray(weeklyPlan) ? weeklyPlan : []).flatMap((dayPlan) =>
    (Array.isArray(dayPlan?.questions) ? dayPlan.questions : [])
      .map((question) => String(question?.title || "").trim())
      .filter(Boolean)
  );
}

async function getWeeklyAiPlan({ leetcode, geeksforgeeks, timezone }) {
  const userKey = getUserKey({ leetcode, geeksforgeeks });
  const store = readStore();
  const userState = store.users[userKey] || { history: [], activePlan: null };
  const now = new Date();

  if (
    userState.activePlan &&
    userState.activePlan.expiresAt &&
    new Date(userState.activePlan.expiresAt).getTime() > now.getTime()
  ) {
    return {
      ...userState.activePlan.payload,
      persisted: true,
      expiresAt: userState.activePlan.expiresAt,
      userKey,
    };
  }

  const currentDay = getCurrentDayName(timezone);
  const [analytics, stats] = await Promise.all([
    getCombinedAnalytics({ leetcode, geeksforgeeks }),
    getDifficultyStats({ leetcode, geeksforgeeks }),
  ]);
  const analysis = buildAnalysisPayload({ analytics, stats, currentDay, timezone });
  const previousQuestions = Array.isArray(userState.history) ? userState.history : [];
  const plan = await generateWeeklyPlanWithOpenAI({ analysis, previousQuestions });

  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const latestTitles = extractQuestionTitles(plan.weeklyPlan);
  const mergedHistory = Array.from(new Set([...previousQuestions, ...latestTitles])).slice(-500);

  store.users[userKey] = {
    history: mergedHistory,
    activePlan: {
      createdAt: now.toISOString(),
      expiresAt,
      payload: {
        ...plan,
        analysis,
      },
    },
  };
  writeStore(store);

  return {
    ...plan,
    analysis,
    persisted: true,
    expiresAt,
    userKey,
  };
}

module.exports = {
  getWeeklyAiPlan,
};
