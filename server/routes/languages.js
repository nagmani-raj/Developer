const express = require("express");
const router = express.Router();
const { languagesData } = require("../data/mockData");

// Get all languages used (optionally aggregated from live platforms)
router.get("/", async (req, res) => {
  const { leetcode, geeksforgeeks } = req.query;

  // if either handle is provided, use the analytics service to compute
  if (leetcode || geeksforgeeks) {
    try {
      const { getCombinedAnalytics } = require("../services/analytics");
      const analytics = await getCombinedAnalytics({ leetcode, geeksforgeeks });
      const langs = Array.isArray(analytics.languages) ? analytics.languages : [];

      return res.json({
        success: true,
        data: langs,
        count: langs.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch languages",
        error: error.message,
      });
    }
  }

  // fallback to static mock data
  try {
    res.json({
      success: true,
      data: languagesData,
      count: languagesData.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch languages",
      error: error.message,
    });
  }
});

// Get language statistics
router.get("/stats", (req, res) => {
  try {
    const totalProblems = languagesData.reduce((sum, lang) => sum + lang.problems, 0);

    const stats = languagesData.map((lang) => ({
      language: lang.language,
      problems: lang.problems,
      percentage: lang.percentage,
    }));

    res.json({
      success: true,
      data: {
        languages: stats,
        totalProblems,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch language statistics",
      error: error.message,
    });
  }
});

// Get top languages
router.get("/top/:limit", (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const topLanguages = languagesData.slice(0, limit);

    res.json({
      success: true,
      data: topLanguages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch top languages",
      error: error.message,
    });
  }
});

module.exports = router;
