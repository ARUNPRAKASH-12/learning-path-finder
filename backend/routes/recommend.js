const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Resource = require("../models/Resource"); // See below

// GET /api/recommend/path
router.get("/path", ensureAuth, async (req, res) => {
  // Get latest quiz answers
  const quiz = await Quiz.findOne({ userId: req.user.id }).sort({ _id: -1 });
  if (!quiz) return res.status(404).json({ message: "No quiz found" });

  // Simple matching: recommended resources by skills/goals
  const resources = await Resource.find({
    tags: { $in: quiz.answers.skills },
    media: quiz.answers.media,
    // Optionally filter by goal
  }).limit(10);

  res.json({ path: resources });
});

module.exports = router;
