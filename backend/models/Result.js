const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema({
  examId: { type: String, required: true },
  examTitle: { type: String, required: true },
  skill: { type: String, required: true },
  studentName: { type: String, default: "Tiến Danh" },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeTaken: { type: String, required: true },

  // === THÊM DÒNG NÀY VÀO ĐỂ LƯU CHI TIẾT ĐÁP ÁN ===
  studentAnswers: { type: Object, default: {} },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Result", ResultSchema);
