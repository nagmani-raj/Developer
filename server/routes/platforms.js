const express = require("express");
const router = express.Router();
const { platformsData } = require("../data/mockData");
const codeforces = require("../services/codeforces");
const leetcode = require("../services/leetcode");
const geeksforgeeks = require("../services/geeksforgeeks");
require("dotenv").config();

// Get all platforms
router.get("/", (req, res) => {
  try {
    res.json({
      success: true,
      data: platformsData,
      count: platformsData.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch platforms",
      error: error.message,
    });
  }
});

// Live data endpoint - fetches real platform data where supported
router.get("/live", async (req, res) => {
  try {
    const getGfgInfo =
      geeksforgeeks.getUserInfo || geeksforgeeks.getGeeksforGeeksData;

    const cfHandle = req.query.codeforces || process.env.CODEFORCES_HANDLE;
    const lcHandle = req.query.leetcode || process.env.LEETCODE_USERNAME;
    const gfgHandle =
      req.query.geeksforgeeks || process.env.GEEKSFORGEEKS_USERNAME;

    const tasks = [
      (async () => {
        if (!cfHandle) {
          return { platform: "Codeforces", data: null, error: "Handle not provided" };
        }
        try {
          const info = await codeforces.getUserInfo(cfHandle);
          return { platform: "Codeforces", data: info };
        } catch (e) {
          return { platform: "Codeforces", data: null, error: e.message };
        }
      })(),
      (async () => {
        if (!lcHandle) {
          return { platform: "LeetCode", data: null, error: "Username not provided" };
        }
        try {
          const info = await leetcode.getLeetCodeProfile(lcHandle);
          return { platform: "LeetCode", data: info };
        } catch (e) {
          return { platform: "LeetCode", data: null, error: e.message };
        }
      })(),
      (async () => {
        if (!gfgHandle) {
          return { platform: "GeeksforGeeks", data: null, error: "Username not provided" };
        }
        try {
          if (!getGfgInfo) throw new Error("GeeksforGeeks service unavailable");
          const info = await getGfgInfo(gfgHandle);
          return { platform: "GeeksforGeeks", data: info };
        } catch (e) {
          return { platform: "GeeksforGeeks", data: null, error: e.message };
        }
      })(),
    ];

    const results = await Promise.all(tasks);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch live platforms", error: error.message });
  }
});

// Get specific platform by ID
router.get("/:id", (req, res) => {
  try {
    const platform = platformsData.find((p) => p.id === parseInt(req.params.id));

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found",
      });
    }

    res.json({
      success: true,
      data: platform,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform",
      error: error.message,
    });
  }
});

// Get platform statistics summary
router.get("/stats/summary", (req, res) => {
  try {
    const summary = platformsData.map((platform) => ({
      name: platform.name,
      total: platform.total,
      easy: platform.easy,
      medium: platform.medium,
      hard: platform.hard,
    }));

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform summary",
      error: error.message,
    });
  }
});

module.exports = router;
