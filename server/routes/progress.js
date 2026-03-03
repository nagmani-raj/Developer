const express = require("express");
const router = express.Router();
const { progressData } = require("../data/mockData");

// Get weekly progress
router.get("/weekly", (req, res) => {
  try {
    const totalSolved = progressData.reduce((sum, day) => sum + day.solved, 0);
    const averageSolved = (totalSolved / progressData.length).toFixed(2);

    res.json({
      success: true,
      data: {
        days: progressData,
        totalSolved,
        averageSolved,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress data",
      error: error.message,
    });
  }
});

// Get daily progress
router.get("/daily/:day", (req, res) => {
  try {
    const day = req.params.day;
    const dayData = progressData.find((d) => d.day.toLowerCase() === day.toLowerCase());

    if (!dayData) {
      return res.status(404).json({
        success: false,
        message: `No data found for ${day}`,
      });
    }

    res.json({
      success: true,
      data: dayData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily progress",
      error: error.message,
    });
  }
});

module.exports = router;
