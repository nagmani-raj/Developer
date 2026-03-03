const express = require("express");
const router = express.Router();
const { algorithmData } = require("../data/mockData");

// Get all algorithm categories (optionally aggregated from live platforms)
router.get("/", async (req, res) => {
  const { leetcode, geeksforgeeks } = req.query;

  if (leetcode || geeksforgeeks) {
    try {
      const { getCombinedAnalytics } = require("../services/analytics");
      const analytics = await getCombinedAnalytics({ leetcode, geeksforgeeks });
      const algs = Array.isArray(analytics.algorithms) ? analytics.algorithms : [];

      return res.json({
        success: true,
        data: algs,
        count: algs.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch algorithms",
        error: error.message,
      });
    }
  }

  try {
    res.json({
      success: true,
      data: algorithmData,
      count: algorithmData.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch algorithms",
      error: error.message,
    });
  }
});

// Get algorithm statistics
router.get("/stats", (req, res) => {
  try {
    const totalProblems = algorithmData.reduce((sum, algo) => sum + algo.count, 0);

    const stats = algorithmData.map((algo) => ({
      category: algo.category,
      count: algo.count,
      percentage: ((algo.count / totalProblems) * 100).toFixed(2),
    }));

    res.json({
      success: true,
      data: {
        categories: stats,
        totalProblems,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch algorithm statistics",
      error: error.message,
    });
  }
});

// Get top categories
router.get("/top/:limit", (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const topCategories = algorithmData.sort((a, b) => b.count - a.count).slice(0, limit);

    res.json({
      success: true,
      data: topCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch top categories",
      error: error.message,
    });
  }
});

module.exports = router;
