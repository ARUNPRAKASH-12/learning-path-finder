const mongoose = require("mongoose");
const QuizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: { type: Object, required: true }
});
module.exports = mongoose.model("Quiz", QuizSchema);
