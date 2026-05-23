require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Exam = require("./models/Exam"); // Khuôn bro vừa tạo

// Dữ liệu mẫu cần đẩy vào
const dataFiles = ["exam-data.json", "listening-data.json"];

async function seedData() {
  try {
    // Kết nối DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Đã kết nối DB, bắt đầu đổ dữ liệu...");

    // Xóa sạch dữ liệu cũ để tránh trùng lặp khi chạy lại
    await Exam.deleteMany({});
    console.log("Đã dọn sạch database cũ.");

    for (const file of dataFiles) {
      const filePath = path.join(__dirname, "..", "frontend", file); // Trỏ ra folder frontend nơi chứa file JSON
      const rawData = fs.readFileSync(filePath);
      const jsonData = JSON.parse(rawData);

      // Đẩy vào DB
      await Exam.create(jsonData);
      console.log(`Đã đổ xong: ${file}`);
    }

    console.log("Đã tải dữ liệu thành công!");
    process.exit();
  } catch (err) {
    console.error("Lỗi đổ dữ liệu:", err);
    process.exit(1);
  }
}

seedData();
