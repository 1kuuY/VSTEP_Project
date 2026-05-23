const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  skill: { type: String, required: true }, // 'reading' hoặc 'listening'
  level: { type: String, required: true }, // 'B1' hoặc 'B2'
  duration: Number,
  questionsCount: Number,
  description: String,
  link: String,
  passage: String, // Nội dung bài đọc hoặc Transcript
  audioUrl: { type: String },
  questions: [
    {
      questionNumber: Number,
      content: String,
      options: {
        A: String,
        B: String,
        C: String,
        D: String,
      },
      correctAnswer: String,
    },
  ],
});

module.exports = mongoose.model("Exam", ExamSchema);
