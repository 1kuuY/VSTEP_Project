const Result = require("./models/Result");
const Exam = require("./models/Exam");
const User = require("./models/User"); // Nhúng thêm khuôn User vừa tạo
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

const app = express();

// CẤU HÌNH CORS CHỈ CHO PHÉP FRONTEND CỦA BRO
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://127.0.0.1:5500", // Chỉ cho link này vào
  methods: ["GET", "POST", "PUT", "DELETE"], // Chỉ cho phép các hành động này
  credentials: true, // Cho phép gửi cookie/token nếu sau này bro cần
};

app.use(cors(corsOptions));
app.use(express.json());

// === CẤU HÌNH PASSPORT GOOGLE OAUTH2 ===
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://vstep-project.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra xem user này đã từng đăng nhập bằng Google vào hệ thống chưa
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Nếu là lần đầu tiên, tiến hành tạo tài khoản tự động trong MongoDB Atlas
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// Link kích hoạt đăng nhập bằng Google (Frontend sẽ gọi link này)
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Cửa ngõ đón nhận kết quả trả về từ Google xác thực thành công
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Đăng nhập thành công -> Tạo 1 cái Token JWT thời hạn 7 ngày bảo mật
    const token = jwt.sign(
      { id: req.user._id, name: req.user.name, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Bắn Token bảo mật cùng Tên và Avatar thật về trang Dashboard của Frontend thông qua URL thanh địa chỉ
    res.redirect(
      `https://vstep-project.vercel.app//dashboard.html?token=${token}&name=${encodeURIComponent(req.user.name)}&avatar=${encodeURIComponent(req.user.avatar)}`,
    );
  },
);

// API THÊM ĐỀ THI MỚI (DÀNH CHO ADMIN)
app.post("/api/exams", async (req, res) => {
  try {
    const data = req.body;

    // Kiểm tra xem Admin gửi lên 1 mảng (nhiều đề) hay 1 object (1 đề)
    if (Array.isArray(data)) {
      await Exam.insertMany(data); // Lưu một lúc nhiều đề
    } else {
      const newExam = new Exam(data);
      await newExam.save(); // Lưu 1 đề lẻ
    }

    res.status(201).json({
      success: true,
      message: "Đã bơm đề thi vào Database thành công!",
    });
  } catch (err) {
    console.error("Lỗi khi thêm đề thi:", err);
    res.status(500).json({ success: false, message: "Lỗi server!" });
  }
});

// === CÁC API HỆ THỐNG ĐỀ THI & KẾT QUẢ ===

// API lấy tất cả đề thi từ Database
app.get("/api/exams", async (req, res) => {
  try {
    const exams = await Exam.find();
    res.json(exams);
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu:", err);
    res
      .status(500)
      .json({ message: "Lỗi hệ thống máy chủ. Vui lòng thử lại sau!" });
  }
});

// API lấy CHI TIẾT 1 đề thi theo ID
app.get("/api/exams/:id", async (req, res) => {
  try {
    const exam = await Exam.findOne({ id: req.params.id });
    if (!exam) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đề thi này trên hệ thống!" });
    }
    res.json(exam);
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết đề thi:", err);
    res
      .status(500)
      .json({ message: "Lỗi hệ thống máy chủ. Vui lòng thử lại sau!" });
  }
});

// KẾT NỐI MONGODB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Đã kết nối thành công với MongoDB Atlas!"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

app.get("/", (req, res) => {
  res.send("Server VSTEP Prep đang chạy ngon lành và đã kết nối DB! 🚀");
});

const PORT = process.env.PORT || 5000;

// API nhận kết quả thi từ Frontend gửi lên và lưu vào MongoDB
app.post("/api/results", async (req, res) => {
  try {
    const newResult = new Result(req.body);
    await newResult.save();
    res.status(201).json({
      success: true,
      message: "Đã lưu kết quả bài thi thành công!",
    });
  } catch (err) {
    console.error("Lỗi khi lưu kết quả thi:", err);
    res.status(500).json({ message: "Không tải được lịch sử làm bài!" });
  }
});

// API lấy danh sách Lịch sử thi (ĐÃ THÊM TÍNH NĂNG LỌC THEO USER)
app.get("/api/results", async (req, res) => {
  try {
    // 1. Lấy tên người dùng từ URL do Frontend gửi lên
    const userName = req.query.studentName;

    // 2. Tạo bộ lọc: Nếu có tên thì lọc đúng tên đó, không thì lấy hết
    const filter = userName ? { studentName: userName } : {};

    // 3. Tìm trong DB dựa theo bộ lọc
    const results = await Result.find(filter).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error("Lỗi khi lấy lịch sử thi:", err);
    res.status(500).json({ message: "Không lấy được lịch sử thi!" });
  }
});

// API lấy CHI TIẾT 1 Lịch sử thi (để xem lại)
app.get("/api/results/:id", async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result)
      return res.status(404).json({ message: "Không tìm thấy lịch sử này!" });
    res.json(result);
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết lịch sử:", err);
    res
      .status(500)
      .json({ message: "Không thể tải chi tiết bài thi. Vui lòng thử lại!!" });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang lắng nghe tại http://localhost:${PORT}`);
});
