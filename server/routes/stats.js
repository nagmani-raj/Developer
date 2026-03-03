const express = require("express");
const router = express.Router();
const { aggregatedStats, platformsData } = require("../data/mockData");
const { getLeetCodeProfile } = require("../services/leetcode");
const { getCombinedAnalytics } = require("../services/analytics");


// ===============================
// ✅ 1. Get Aggregated Stats (Mock)
// ===============================
router.get("/", (req, res) => {
  try {
    res.json({
      success: true,
      data: aggregatedStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});


// ===============================
// ✅ 2. Get Difficulty Breakdown (Mock)
// ===============================
router.get("/difficulty", (req, res) => {
  try {
    const total = aggregatedStats.totalSolved || 1;

    const difficulty = {
      easy: aggregatedStats.easy,
      medium: aggregatedStats.medium,
      hard: aggregatedStats.hard,
      total: aggregatedStats.totalSolved,
      easyPercentage: ((aggregatedStats.easy / total) * 100).toFixed(2),
      mediumPercentage: ((aggregatedStats.medium / total) * 100).toFixed(2),
      hardPercentage: ((aggregatedStats.hard / total) * 100).toFixed(2),
    };

    res.json({
      success: true,
      data: difficulty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch difficulty stats",
      error: error.message,
    });
  }
});


// ===============================
// ✅ 3. Get Rating Statistics (Mock)
// ===============================
router.get("/rating", (req, res) => {
  try {
    const platformRatings = platformsData.map((p) => ({
      name: p.name,
      rating: p.rating,
    }));

    res.json({
      success: true,
      data: {
        averageRating: aggregatedStats.averageRating,
        platforms: platformRatings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch rating stats",
      error: error.message,
    });
  }
});


// ====================================================
// 🚀 4. REAL LeetCode Stats via GraphQL
// ====================================================
router.get("/leetcode/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const profileData = await getLeetCodeProfile(username);

    const total = profileData.totalSolved || 1;

    const response = {
      totalSolved: profileData.totalSolved,
      easy: profileData.easy,
      medium: profileData.medium,
      hard: profileData.hard,
      easyPercentage: ((profileData.easy / total) * 100).toFixed(2),
      mediumPercentage: ((profileData.medium / total) * 100).toFixed(2),
      hardPercentage: ((profileData.hard / total) * 100).toFixed(2),
    };

    res.json({
      success: true,
      data: response,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch LeetCode stats",
      error: error.message,
    });
  }
});


// ====================================================
// 🚀 5. Combined Analytics (LeetCode + GFG)
// ====================================================
router.get("/analytics", async (req, res) => {
  try {
    const { leetcode, geeksforgeeks } = req.query;
    const data = await getCombinedAnalytics({ leetcode, geeksforgeeks });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch combined analytics",
      error: error.message,
    });
  }
});

module.exports = router;
