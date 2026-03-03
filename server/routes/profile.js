const express = require("express");
const router = express.Router();
const { profileData } = require("../data/mockData");

// Get user profile
router.get("/", (req, res) => {
  try {
    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

// Update user profile (mock endpoint)
router.put("/", (req, res) => {
  try {
    const { name, bio, email } = req.body;

    // Update mock data
    if (name) profileData.name = name;
    if (bio) profileData.bio = bio;
    if (email) profileData.email = email;

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: profileData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

module.exports = router;
