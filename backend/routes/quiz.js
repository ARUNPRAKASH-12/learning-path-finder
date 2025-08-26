const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz"); // Mongoose model
const { ensureAuth } = require("../middleware/auth"); // Import auth middleware properly

// POST /api/quiz/submit
router.post("/submit", ensureAuth, async (req, res) => {
  try {
    const quiz = await Quiz.create({
      userId: req.user.id,
      answers: req.body,
    });
    res.json({ message: "Quiz saved", quizId: quiz._id });
  } catch (err) {
    console.error("Error saving quiz:", err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
