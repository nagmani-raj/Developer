const express = require("express");
const { getWeeklyAiPlan } = require("../services/weeklyAiPlanner");

const router = express.Router();

router.get("/weekly-plan", async (req, res) => {
  try {
    const { leetcode, geeksforgeeks, timezone } = req.query;
    const data = await getWeeklyAiPlan({
      leetcode,
      geeksforgeeks,
      timezone,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate AI weekly plan",
      error: error.message,
    });
  }
});

module.exports = router;
