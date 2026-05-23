// === FILE CẤU HÌNH TẬP TRUNG ===
const WEB_CONFIG = {
  shortName: "VPrep",
  fullName: "VSTEP Preparation",
  slogan: "Hệ thống ôn luyện trắc nghiệm tiếng Anh",
};

// Hàm tự động quét và thay tên trên toàn bộ web
document.addEventListener("DOMContentLoaded", () => {
  // 1. Quét và điền Tên ngắn (VPrep) vào những chỗ có class 'web-short-name'
  document.querySelectorAll(".web-short-name").forEach((el) => {
    el.textContent = WEB_CONFIG.shortName;
  });

  // 2. Quét và điền Tên đầy đủ vào những chỗ có class 'web-full-name'
  document.querySelectorAll(".web-full-name").forEach((el) => {
    el.textContent = WEB_CONFIG.fullName;
  });

  // 3. Tự động cập nhật tiêu đề Tab trình duyệt (Thẻ <title>)
  if (document.title.includes("VSTEP Prep")) {
    document.title = document.title.replace("VSTEP Prep", WEB_CONFIG.shortName);
  }
});
