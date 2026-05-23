// === CÁC BIẾN TOÀN CỤC ===
const EXAM_DURATION_SEC = 60 * 60;
let timeRemaining = EXAM_DURATION_SEC;
let timerInterval = null;
let totalExamQuestions = 0;
let targetEndTime = null;

// Nhận diện đang ở trang nào TRƯỚC
const IS_LISTENING_PAGE = window.location.pathname.includes("listening");

// Lấy ID từ URL. Nếu không có (người dùng vào thẳng link), tự động phân luồng mặc định cho đúng trang
const urlParams = new URLSearchParams(window.location.search);
const EXAM_ID_FROM_URL =
  urlParams.get("id") || (IS_LISTENING_PAGE ? "list_01" : "read_01");
const REVIEW_ID_FROM_URL = urlParams.get("reviewId"); // Lấy chìa khóa xem lại
const CURRENT_EXAM_ID = `vstep_progress_${EXAM_ID_FROM_URL}`;
const DATA_FILE_URL = `http://localhost:5000/api/exams/${EXAM_ID_FROM_URL}`;

let currentExamType = IS_LISTENING_PAGE ? "listening" : "reading";
let transcriptData = "";

// === CHUYỂN TAB MOBILE ===
function switchTab(tabName) {
  const passageCol = document.getElementById("reading-container");
  const questionsCol = document.getElementById("questions-container");
  const btnPassage = document.getElementById("btn-tab-passage");
  const btnQuestions = document.getElementById("btn-tab-questions");

  const colorClass = IS_LISTENING_PAGE ? "danger" : "primary";

  if (tabName === "passage") {
    passageCol.classList.remove("d-none");
    questionsCol.classList.add("d-none");
    btnPassage.className = `btn btn-${colorClass} flex-fill me-1 fw-bold`;
    btnQuestions.className = `btn btn-outline-${colorClass} flex-fill ms-1 fw-bold`;
  } else if (tabName === "questions") {
    questionsCol.classList.remove("d-none");
    passageCol.classList.add("d-none");
    btnQuestions.className = `btn btn-${colorClass} flex-fill ms-1 fw-bold`;
    btnPassage.className = `btn btn-outline-${colorClass} flex-fill me-1 fw-bold`;
  }
}

// === KHỞI TẠO TRANG ===
document.addEventListener("DOMContentLoaded", () => {
  loadExamData();
  document
    .getElementById("btn-submit-intent")
    .addEventListener("click", showConfirmModal);
  document
    .getElementById("btn-confirm-submit")
    .addEventListener("click", gradeExam);
});

// === LOGIC ĐỒNG HỒ ĐẾM NGƯỢC ===
function startTimer() {
  const display = document.getElementById("timer-display");

  if (!targetEndTime) {
    targetEndTime = Date.now() + EXAM_DURATION_SEC * 1000;
    const progress = JSON.parse(localStorage.getItem(CURRENT_EXAM_ID)) || {
      answers: {},
    };
    progress.endTime = targetEndTime;
    localStorage.setItem(CURRENT_EXAM_ID, JSON.stringify(progress));
  }

  function updateDisplay() {
    const now = Date.now();
    timeRemaining = Math.floor((targetEndTime - now) / 1000);

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      display.textContent = "00:00";
      alert("Đã hết thời gian làm bài! Hệ thống sẽ tự động nộp bài.");
      const confirmModalEl = document.getElementById("confirmModal");
      const confirmModal = bootstrap.Modal.getInstance(confirmModalEl);
      if (confirmModal) confirmModal.hide();
      gradeExam();
      return;
    }

    let minutes = Math.floor(timeRemaining / 60);
    let seconds = timeRemaining % 60;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    display.textContent = `${minutes}:${seconds}`;
  }

  updateDisplay();
  timerInterval = setInterval(updateDisplay, 1000);
}

function getTimeTaken() {
  const usedSecs = EXAM_DURATION_SEC - (timeRemaining > 0 ? timeRemaining : 0);
  let minutes = Math.floor(usedSecs / 60);
  let seconds = usedSecs % 60;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  return `${minutes} phút ${seconds} giây`;
}

// === TẢI DỮ LIỆU TỪ API SERVER & RENDER ===
async function loadExamData() {
  try {
    const response = await fetch(DATA_FILE_URL);
    if (!response.ok) throw new Error("Không thể lấy dữ liệu từ Server");
    const data = await response.json();

    currentExamType = data.skill || "reading";
    transcriptData = data.passage || "";

    const audioEl = document.getElementById("exam-audio");

    if (audioEl) {
      if (currentExamType === "listening") {
        audioEl.style.display = "block"; // Hiển thị trình phát nhạc
        if (data.audioUrl) {
          audioEl.querySelector("source").src = data.audioUrl;
          audioEl.load(); // Ép trình duyệt load lại file audio mới
        }
      } else {
        audioEl.style.display = "none"; // Ẩn trình phát nhạc nếu là bài Reading
      }
    }

    totalExamQuestions = data.questions.length;

    const passageDiv = document.getElementById("passage-content");
    if (currentExamType === "reading") {
      passageDiv.innerHTML = transcriptData.replace(/\n/g, "<br><br>");
    } else {
      passageDiv.innerHTML = `
            <div class="text-center mt-5 text-secondary opacity-75">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-mic-mute mb-3" viewBox="0 0 16 16">
                  <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879l-1-1V3a2 2 0 0 0-3.997-.118l-.845-.845A3.001 3.001 0 0 1 11 3z"/>
                  <path d="m9.486 10.607-.748-.748A2 2 0 0 1 6 8v-.878l-1-1V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
                </svg>
                <p class="fs-5 fw-bold mb-1">Audio Transcript đang ẩn</p>
                <p class="small">Hệ thống sẽ tự động hiển thị nội dung bài nghe tại đây sau khi bạn nộp bài.</p>
            </div>
        `;
    }

    const questionListDiv = document.getElementById("question-list");
    let htmlContent = "";

    data.questions.forEach((q) => {
      htmlContent += `
        <div class="card mb-3 border-0 shadow-sm question-card">
            <div class="card-body">
                <h6 class="card-title fw-bold">Question ${q.questionNumber}: ${q.content}</h6>
                <div class="form-check mt-3">
                    <input class="form-check-input student-radio" type="radio" name="q${q.questionNumber}" id="q${q.questionNumber}A" value="A">
                    <label class="form-check-label" for="q${q.questionNumber}A">A. ${q.options.A}</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input student-radio" type="radio" name="q${q.questionNumber}" id="q${q.questionNumber}B" value="B">
                    <label class="form-check-label" for="q${q.questionNumber}B">B. ${q.options.B}</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input student-radio" type="radio" name="q${q.questionNumber}" id="q${q.questionNumber}C" value="C">
                    <label class="form-check-label" for="q${q.questionNumber}C">C. ${q.options.C}</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input student-radio" type="radio" name="q${q.questionNumber}" id="q${q.questionNumber}D" value="D">
                    <label class="form-check-label" for="q${q.questionNumber}D">D. ${q.options.D}</label>
                </div>
            </div>
        </div>`;
    });

    questionListDiv.innerHTML = htmlContent;

    const allRadios = document.querySelectorAll(".student-radio");
    allRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const questionNum = e.target.name.replace("q", "");
        saveProgress(questionNum, e.target.value);
      });
    });

    if (REVIEW_ID_FROM_URL) {
      // NẾU CÓ CHÌA KHÓA: Bật chế độ XEM LẠI
      await loadReviewMode(data);
    } else {
      // NẾU KHÔNG CÓ: Bật chế độ THI BÌNH THƯỜNG
      restoreProgress();
      startTimer();
    }
  } catch (error) {
    console.error("Lỗi khi kéo dữ liệu từ Server:", error);
    document.getElementById("question-list").innerHTML =
      "<p class='text-danger'>Không thể tải đề thi từ Server. Kiểm tra lại kết nối Backend.</p>";
  }
}

// === LOGIC LƯU VÀ KHÔI PHỤC ===
function saveProgress(qNum, value) {
  const progress = JSON.parse(localStorage.getItem(CURRENT_EXAM_ID)) || {
    answers: {},
  };
  if (targetEndTime) progress.endTime = targetEndTime;
  progress.answers[qNum] = value;
  localStorage.setItem(CURRENT_EXAM_ID, JSON.stringify(progress));
}

function restoreProgress() {
  const savedData = JSON.parse(localStorage.getItem(CURRENT_EXAM_ID));
  if (savedData) {
    if (savedData.endTime) {
      targetEndTime = savedData.endTime;
    }
    if (savedData.answers) {
      Object.keys(savedData.answers).forEach((qNum) => {
        const radio = document.getElementById(
          `q${qNum}${savedData.answers[qNum]}`,
        );
        if (radio) radio.checked = true;
      });
    }
  }
}

// === HIỂN THỊ POPUP XÁC NHẬN ===
function showConfirmModal() {
  const answeredCount = document.querySelectorAll(
    'input[type="radio"]:checked',
  ).length;
  document.getElementById("confirm-msg").innerHTML =
    `Bạn đã làm <strong class="text-primary">${answeredCount} / ${totalExamQuestions}</strong> câu hỏi.`;
  const confirmModal = new bootstrap.Modal(
    document.getElementById("confirmModal"),
  );
  confirmModal.show();
}

// === CHẤM ĐIỂM VÀ LƯU KẾT QUẢ VÀO DATABASE ===
async function gradeExam() {
  try {
    const confirmModalEl = document.getElementById("confirmModal");
    const confirmModal = bootstrap.Modal.getInstance(confirmModalEl);
    if (confirmModal) confirmModal.hide();

    clearInterval(timerInterval);
    document
      .querySelectorAll(".student-radio")
      .forEach((radio) => (radio.disabled = true));

    // Lấy dữ liệu đáp án gốc từ Server để đối chiếu
    const response = await fetch(DATA_FILE_URL);
    const data = await response.json();
    let score = 0;

    // BIẾN MỚI: TẠO CÁI GIỎ ĐỂ ĐỰNG ĐÁP ÁN CỦA HỌC VIÊN
    let currentStudentAnswers = {};

    data.questions.forEach((q) => {
      const qNum = q.questionNumber;
      const correctAns = q.correctAnswer;
      const selectedInput = document.querySelector(
        `input[name="q${qNum}"]:checked`,
      );
      const questionCard = document
        .querySelector(`input[name="q${qNum}"]`)
        .closest(".card");

      questionCard.classList.remove(
        "border-success",
        "border-danger",
        "border-warning",
        "border-0",
      );
      const correctLabel = document.querySelector(
        `label[for="q${qNum}${correctAns}"]`,
      );
      if (correctLabel) correctLabel.classList.add("text-success", "fw-bold");

      if (selectedInput) {
        // NẾU CÓ CHỌN THÌ BỎ VÀO GIỎ
        currentStudentAnswers[qNum] = selectedInput.value;

        if (selectedInput.value === correctAns) {
          score++;
          questionCard.classList.add("border-success", "border", "border-2");
        } else {
          questionCard.classList.add("border-danger", "border", "border-2");
        }
      } else {
        // NẾU KHÔNG CHỌN GÌ THÌ ĐÁNH DẤU LÀ null
        currentStudentAnswers[qNum] = null;
        questionCard.classList.add("border-warning", "border", "border-2");
      }
    });

    localStorage.removeItem(CURRENT_EXAM_ID);

    // === SỬA LỖI UX: BIẾN NÚT NỘP BÀI THÀNH NÚT VỀ TRANG CHỦ ===
    const btnSubmitIntent = document.getElementById("btn-submit-intent");
    btnSubmitIntent.textContent = "Về trang chủ";
    btnSubmitIntent.classList.remove("btn-warning");
    btnSubmitIntent.classList.add("btn-info", "text-white"); // Đổi sang màu xanh dương cho nổi bật
    btnSubmitIntent.disabled = false; // Mở khóa nút

    // Gỡ lệnh nộp bài và gắn lệnh chuyển trang vào
    btnSubmitIntent.removeEventListener("click", showConfirmModal);
    btnSubmitIntent.addEventListener(
      "click",
      () => (window.location.href = "dashboard.html"),
    );

    document.getElementById("result-score").textContent =
      `${score}/${totalExamQuestions}`;
    document.getElementById("result-time").textContent = getTimeTaken();

    // Hiển thị lại Transcript nếu là bài thi Nghe
    if (currentExamType === "listening" && transcriptData) {
      const passageDiv = document.getElementById("passage-content");
      const leftTitle = document.querySelector("#reading-container h4");

      if (leftTitle)
        leftTitle.innerHTML =
          "Audio Transcript <span class='badge bg-success fs-6 ms-2'>Unlocked</span>";
      if (passageDiv) {
        passageDiv.innerHTML = `
                <div class="alert alert-success border-0 mb-3"><small>Dưới đây là nội dung bài nghe để bạn đối chiếu với đáp án bên phải.</small></div>
                <div class="text-dark fw-medium">
                    ${transcriptData.replace(/\n/g, "<br><br>")}
                </div>
            `;
      }
    }

    // TỰ ĐỘNG GỬI KẾT QUẢ VÀ ĐÁP ÁN LÊN SERVER
    const resultData = {
      examId: data.id,
      examTitle: data.title,
      skill: data.skill,
      score: score,
      totalQuestions: totalExamQuestions,
      timeTaken: getTimeTaken(),
      studentName: localStorage.getItem("vstep_name") || "Học viên ẩn danh", // ĐÃ ĐỔI THÀNH TÊN ĐỘNG
      studentAnswers: currentStudentAnswers,
    };

    fetch("http://localhost:5000/api/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resultData),
    })
      .then((res) => res.json())
      .then((resData) => console.log("Mạng báo:", resData.message))
      .catch((err) => console.error("Lỗi gửi điểm:", err));

    // Hiển thị Popup báo điểm
    const resultModal = new bootstrap.Modal(
      document.getElementById("resultModal"),
    );
    resultModal.show();
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Có lỗi xảy ra trong quá trình chấm bài!");
  }
}

// === CẢNH BÁO KHI THOÁT TRANG ===
window.addEventListener("beforeunload", function (e) {
  const btnSubmit = document.getElementById("btn-submit-intent");
  if (btnSubmit && !btnSubmit.disabled) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// === HÀM LOAD REVIEW MODE (BẢN BẤT TỬ) ===
async function loadReviewMode(examData) {
  try {
    // 1. Setup giao diện (giữ nguyên logic cũ)
    document.getElementById("timer-display").textContent = "Chế độ xem lại";
    const btnSubmit = document.getElementById("btn-submit-intent");
    if (btnSubmit) {
      btnSubmit.textContent = "Về trang chủ";
      btnSubmit.classList.replace("btn-warning", "btn-secondary");
      btnSubmit.onclick = () => (window.location.href = "dashboard.html");
    }

    const response = await fetch(
      `http://localhost:5000/api/results/${REVIEW_ID_FROM_URL}`,
    );
    const historyData = await response.json();
    const studentAnswers = historyData.studentAnswers || {};

    document
      .querySelectorAll(".student-radio")
      .forEach((radio) => (radio.disabled = true));

    // 2. Chấm điểm lại
    examData.questions.forEach((q) => {
      const qNum = q.questionNumber;
      const correctAns = q.correctAnswer;
      const studentAns = studentAnswers[qNum];

      const questionCard = document
        .querySelector(`input[name="q${qNum}"]`)
        ?.closest(".card");
      if (!questionCard) return;

      // Xóa viền cũ và thêm viền mới an toàn
      questionCard.classList.remove("border-0");
      questionCard.classList.add("border");

      // --- SỬA CHỖ NÀY: Dùng if(element) trước khi gọi .classList ---

      // Tô màu đáp án đúng
      const correctLabel = document.querySelector(
        `label[for="q${qNum}${correctAns}"]`,
      );
      if (correctLabel) correctLabel.classList.add("text-success", "fw-bold");

      if (studentAns) {
        const radioID = `q${qNum}${studentAns}`;
        const studentRadio = document.getElementById(radioID);
        if (studentRadio) studentRadio.checked = true;

        if (studentAns === correctAns) {
          questionCard.classList.add("border-success", "border-2");
        } else {
          questionCard.classList.add("border-danger", "border-2");
          // Tô đỏ đáp án sai học viên chọn (check trước khi tô)
          const wrongLabel = document.querySelector(`label[for="${radioID}"]`);
          if (wrongLabel) wrongLabel.classList.add("text-danger", "fw-bold");
        }
      } else {
        questionCard.classList.add("border-warning", "border-2");
      }
    });

    // ... (Phần hiện Transcript giữ nguyên như cũ) ...
  } catch (error) {
    console.error("Lỗi khi tải chế độ xem lại:", error);
  }
}
