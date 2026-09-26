// js/examPlayerView.js
const examPlayerView = {
    examData: null,
    currentQuestionIndex: 0,
    answers: {},       // { qNum: 'A' | 'B' | 'C' | 'D' }
    flagged: new Set(),// Set các qNum được đánh dấu
    audioElement: null,
    audioStopTimer: null,
    isPlayingAudio: false, // Trạng thái phát âm thanh
    timerSeconds: 120 * 60,
    timerInterval: null,
    timeSpentSeconds: 0,

    // Hàm ẩn/hiện Navbar tổng của trang web
    setGlobalNavVisible(visible) {
        const mainNav = document.querySelector('header') || document.querySelector('nav');
        if (mainNav) {
            mainNav.style.display = visible ? '' : 'none';
        }
    },

    render(params = {}) {
        const examId = params.examId || 'ets-2023-test-01';
        this.examData = window.ExamStore ? ExamStore.getById(examId) : null;

        if (!this.examData || !this.examData.questions || this.examData.questions.length === 0) {
            this.setGlobalNavVisible(true);
            return `
                <div class="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-pink-100 text-center space-y-4 shadow-sm shadow-pink-50">
                    <p class="text-slate-600 font-semibold">Không tìm thấy dữ liệu đề thi hoặc đề thi chưa có câu hỏi.</p>
                    <button onclick="examPlayerView.exitExam(true)" class="px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-2xl text-xs font-semibold hover:opacity-95 shadow-md shadow-pink-200 transition">Quay lại Kho Đề</button>
                </div>
            `;
        }

        const currentQ = this.examData.questions[this.currentQuestionIndex];
        const isPart1 = Number(currentQ.part) === 1;
        const isPart2 = Number(currentQ.part) === 2;
        const isPart1Or2 = isPart1 || isPart2;

        const questionImage = currentQ.image || (typeof currentQ.passage === 'string' && (currentQ.passage.startsWith('http') || currentQ.passage.startsWith('data:image')) ? currentQ.passage : null);

        return `
            <!-- Khung giao diện toàn màn hình: Sát tuyệt đối 2 bên mép, nền hồng phấn nhẹ tương đồng file ngữ pháp -->
            <div class="fixed inset-0 z-40 bg-[#fff6f8] overflow-y-auto flex flex-col selection:bg-pink-200 selection:text-pink-900">
                <!-- 1 File Audio duy nhất được tải ngầm -->
                <audio id="global-toeic-audio" src="${this.examData.audioUrl || ''}" preload="auto"></audio>

                <!-- Thanh Header Làm Bài: Nằm sát đỉnh và ghim CỐ ĐỊNH (Sticky Top) -->
                <div class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 sm:px-6 py-2.5 shadow-sm shadow-pink-50/50 flex items-center justify-between gap-3 w-full">
                    <div class="flex items-center space-x-3">
                        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-400 via-rose-400 to-pink-300 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-pink-200 shrink-0">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-800 text-sm sm:text-base leading-tight">${this.examData.title}</h2>
                            <p class="text-[11px] text-slate-500">Đã làm: <span id="answered-count" class="font-bold text-pink-600">${Object.keys(this.answers).length}</span> / ${this.examData.questions.length} câu</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2 sm:space-x-3">
                        <div class="flex items-center space-x-1.5 bg-pink-50 px-3 py-1.5 rounded-xl font-mono font-bold text-pink-600 text-xs sm:text-sm border border-pink-200/70 shadow-2xs">
                            <i data-lucide="clock" class="w-4 h-4 text-pink-500"></i>
                            <span id="timer-countdown">--:--</span>
                        </div>
                        <button onclick="examPlayerView.openSubmitModal()" class="bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white font-bold px-3.5 sm:px-4 py-2 rounded-xl text-xs shadow-md shadow-pink-200 transition">
                            Nộp bài
                        </button>
                        <button onclick="examPlayerView.exitExam()" class="bg-slate-100 hover:bg-pink-50 hover:text-pink-600 text-slate-700 font-medium px-3 sm:px-3.5 py-2 rounded-xl text-xs transition">
                            Thoát
                        </button>
                    </div>
                </div>

                <!-- Khu vực làm bài chính: Trải rộng toàn màn hình, sát 2 bên -->
                <div class="p-3 sm:p-5 flex-1 flex flex-col">
                    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 items-start w-full">
                        
                        <!-- Khung Nội Dung Câu Hỏi (Cột 9-10 cột) -->
                        <div class="xl:col-span-9 2xl:col-span-10 space-y-3.5">
                            
                            <!-- Thanh Điều khiển Audio Listening -->
                            <div class="bg-white rounded-2xl p-3 border border-pink-100 shadow-sm shadow-pink-50 flex items-center space-x-3.5">
                                <button onclick="examPlayerView.toggleQuestionAudio()" id="btn-play-audio" class="w-10 h-10 ${this.isPlayingAudio ? 'bg-amber-500 hover:bg-amber-600' : 'bg-pink-500 hover:bg-pink-600'} text-white rounded-xl flex items-center justify-center shadow-sm shadow-pink-200 transition shrink-0" title="${this.isPlayingAudio ? 'Tạm dừng Audio' : 'Phát Audio'}">
                                    <i data-lucide="${this.isPlayingAudio ? 'pause' : 'volume-2'}" class="w-5 h-5"></i>
                                </button>
                                <div class="flex-1">
                                    <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                                        <span>Part ${currentQ.part || 1}: Audio câu số ${currentQ.qNum}</span>
                                        <span class="font-mono text-pink-600 font-bold">${currentQ.audioStartTime || 0}s ➔ ${currentQ.audioEndTime || 0}s</span>
                                    </div>
                                    <div class="w-full bg-pink-50 h-2 rounded-full overflow-hidden">
                                        <div id="audio-progress-bar" class="bg-gradient-to-r from-pink-400 to-rose-400 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Khung 2 Cột: Trái (Ảnh/Đoạn văn) - Phải (Lựa chọn) -->
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white rounded-2xl border border-pink-100 shadow-sm shadow-pink-50 p-4 sm:p-6 min-h-[580px]">
                                
                                <!-- Cột Trái: Ảnh hoặc Đoạn văn -->
                                <div class="border-b lg:border-b-0 lg:border-r border-pink-100 pb-4 lg:pb-0 lg:pr-5 flex flex-col justify-between overflow-y-auto max-h-[72vh]">
                                    <div>
                                        <div class="flex items-center justify-between pb-3">
                                            <span class="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center space-x-1.5">
                                                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                                                <span>${questionImage ? (isPart1 ? 'Hình Ảnh Minh Họa (Part 1)' : 'Tài Liệu / Hình Ảnh Đính Kèm') : (isPart2 ? 'Hướng Dẫn (Part 2)' : 'Tài Liệu / Ngữ Cảnh (Passage)')}</span>
                                            </span>
                                            ${questionImage ? `
                                                <button onclick="examPlayerView.zoomImage('${questionImage}')" class="text-xs text-slate-500 hover:text-pink-600 flex items-center space-x-1 transition">
                                                    <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i><span>Phóng to</span>
                                                </button>
                                            ` : ''}
                                        </div>

                                        ${questionImage ? `
                                            <div class="bg-pink-50/30 rounded-xl p-2.5 border border-pink-100 overflow-hidden cursor-pointer flex items-center justify-center min-h-[300px]" onclick="examPlayerView.zoomImage('${questionImage}')">
                                                <img src="${questionImage}" alt="Question Attachment" class="rounded-lg w-full max-h-[520px] object-contain mx-auto hover:scale-[1.02] transition duration-300">
                                            </div>
                                        ` : `
                                            <div class="bg-[#fffafb] p-5 rounded-xl border border-pink-100 text-sm text-slate-700 leading-relaxed font-serif min-h-[300px]">
                                                ${isPart2 
                                                    ? '<div class="text-slate-500 text-center py-12"><strong>Part 2: Question - Response</strong><br><br>Nghe câu hỏi và 3 phương án phản hồi trong audio.<br>Chọn câu trả lời phù hợp nhất (A, B hoặc C).</div>' 
                                                    : (currentQ.passage || '<div class="text-slate-400 italic text-center py-12">Không có đoạn văn hoặc hình ảnh đính kèm cho câu hỏi này.</div>')}
                                            </div>
                                        `}
                                    </div>
                                </div>

                                <!-- Cột Phải: Câu Hỏi & Đáp Án Trắc Nghiệm -->
                                <div class="flex flex-col justify-between overflow-y-auto max-h-[72vh] lg:pl-3 space-y-5">
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200 px-3 py-1 rounded-xl">
                                                Câu ${currentQ.qNum} (Part ${currentQ.part})
                                            </span>
                                            <button onclick="examPlayerView.toggleFlag(${currentQ.qNum})" class="${this.flagged.has(currentQ.qNum) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} hover:text-amber-500 transition flex items-center space-x-1 text-xs font-medium">
                                                <i data-lucide="flag" class="w-4 h-4"></i>
                                                <span>${this.flagged.has(currentQ.qNum) ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                                            </button>
                                        </div>

                                        ${!isPart1Or2 && currentQ.questionText ? `
                                            <p class="text-sm font-semibold text-slate-800 leading-relaxed">${currentQ.questionText}</p>
                                        ` : `
                                            <p class="text-xs italic text-slate-400">
                                                ${isPart2 ? 'Lắng nghe audio và chọn phương án phản hồi đúng nhất (A, B hoặc C)' : 'Lắng nghe audio và chọn phương án đúng nhất (A, B, C hoặc D)'}
                                            </p>
                                        `}

                                        <!-- Lựa chọn đáp án -->
                                        <div class="space-y-2.5 pt-1">
                                            ${currentQ.options.map((opt, optIndex) => {
                                                const letter = String.fromCharCode(65 + optIndex);
                                                const isChecked = this.answers[currentQ.qNum] === letter;
                                                const displayText = isPart1Or2 ? `(${letter})` : opt;

                                                return `
                                                    <label onclick="examPlayerView.selectAnswer(${currentQ.qNum}, '${letter}')" class="flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm font-medium transition duration-150 ${isChecked ? 'bg-pink-50/80 border-pink-400 text-pink-900 font-bold ring-1 ring-pink-300' : 'bg-white border-pink-100 hover:border-pink-300 text-slate-700 hover:bg-pink-50/40'}">
                                                        <span class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isChecked ? 'bg-pink-500 text-white' : 'bg-pink-100/60 text-pink-700'}">${letter}</span>
                                                        <input type="radio" name="q_${currentQ.qNum}" value="${letter}" ${isChecked ? 'checked' : ''} class="hidden">
                                                        <span class="flex-1">${displayText}</span>
                                                    </label>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>

                                    <!-- Điều hướng Câu trước / Câu sau -->
                                    <div class="flex items-center justify-between pt-4 border-t border-pink-50">
                                        <button onclick="examPlayerView.prevQuestion()" ${this.currentQuestionIndex === 0 ? 'disabled class="opacity-40 cursor-not-allowed px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-400"' : 'class="px-4 py-2 bg-slate-100 hover:bg-pink-50 hover:text-pink-600 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1"'}>
                                            <i data-lucide="chevron-left" class="w-4 h-4"></i>
                                            <span>Câu Trước</span>
                                        </button>
                                        <button onclick="examPlayerView.nextQuestion()" ${this.currentQuestionIndex === this.examData.questions.length - 1 ? 'disabled class="opacity-40 cursor-not-allowed px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-400"' : 'class="px-5 py-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-pink-200 flex items-center space-x-1"'}>
                                            <span>Câu Kế Tiếp</span>
                                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Bảng Câu Hỏi (Ghim cố định bên phải theo header) -->
                        <div class="xl:col-span-3 2xl:col-span-2 bg-white rounded-2xl p-4 border border-pink-100 shadow-sm shadow-pink-50 space-y-3.5 h-fit sticky top-16">
                            <div class="flex items-center justify-between border-b border-pink-50 pb-2.5">
                                <h3 class="font-bold text-slate-800 text-xs sm:text-sm">Bảng câu hỏi</h3>
                                <span class="text-xs text-pink-600 font-bold font-mono">${this.examData.questions.length} câu</span>
                            </div>
                            <div class="grid grid-cols-3 gap-1 text-[10px] text-slate-500 pb-1">
                                <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 bg-slate-100 rounded-xs border border-slate-300"></span><span>Chưa</span></div>
                                <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 bg-pink-500 rounded-xs"></span><span>Đã làm</span></div>
                                <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 bg-amber-500 rounded-xs"></span><span>Cần xem</span></div>
                            </div>
                            <div class="grid grid-cols-5 gap-1.5 max-h-[64vh] overflow-y-auto pr-1">
                                ${this.examData.questions.map((q, idx) => {
                                    let bgClass = "bg-slate-100 text-slate-700 border-slate-200 hover:bg-pink-50 hover:text-pink-600";
                                    if (this.flagged.has(q.qNum)) {
                                        bgClass = "bg-amber-500 text-white font-bold border-amber-600";
                                    } else if (this.answers[q.qNum]) {
                                        bgClass = "bg-pink-500 text-white font-bold border-pink-600 shadow-xs shadow-pink-200";
                                    }
                                    const isCurrent = idx === this.currentQuestionIndex;
                                    return `
                                        <button onclick="examPlayerView.jumpToQuestion(${idx})" class="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center border transition ${bgClass}${isCurrent ? ' ring-2 ring-pink-400 ring-offset-1' : ''}">
                                            ${q.qNum}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender() {
        this.setGlobalNavVisible(false);

        if (window.lucide) lucide.createIcons();
        this.audioElement = document.getElementById('global-toeic-audio');

        if (this.audioElement) {
            this.audioElement.ontimeupdate = () => {
                const q = this.examData.questions[this.currentQuestionIndex];
                const start = q.audioStartTime || 0;
                const end = q.audioEndTime || (start + 30);
                const current = this.audioElement.currentTime;
                
                const bar = document.getElementById('audio-progress-bar');
                if (bar && end > start) {
                    const percent = Math.min(Math.max(((current - start) / (end - start)) * 100, 0), 100);
                    bar.style.width = `${percent}%`;
                }
            };

            this.audioElement.onpause = () => {
                this.updateAudioButtonState(false);
            };

            this.audioElement.onended = () => {
                this.updateAudioButtonState(false);
            };
        }

        this.startTimer();
    },

    toggleQuestionAudio() {
        if (!this.audioElement) return;

        if (this.isPlayingAudio) {
            this.pauseQuestionAudio();
        } else {
            this.playQuestionAudio();
        }
    },

    playQuestionAudio() {
        if (!this.audioElement) return;
        const q = this.examData.questions[this.currentQuestionIndex];
        const start = q.audioStartTime || 0;
        const end = q.audioEndTime || (start + 30);

        if (!this.audioElement.src || this.audioElement.src === window.location.href) {
            if (typeof showToast === 'function') showToast("Chưa có nguồn audio hợp lệ cho bài thi này!");
            return;
        }

        if (this.audioElement.currentTime < start || this.audioElement.currentTime >= end) {
            this.audioElement.currentTime = start;
        }

        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.updateAudioButtonState(true);
                    if (typeof showToast === 'function') showToast(`Đang phát Audio câu ${q.qNum} (${start}s ➔ ${end}s)`);
                })
                .catch(e => {
                    console.warn("Lỗi phát audio:", e);
                    this.updateAudioButtonState(false);
                });
        }

        if (this.audioStopTimer) clearTimeout(this.audioStopTimer);
        const remainingMs = Math.max((end - this.audioElement.currentTime) * 1000, 500);
        this.audioStopTimer = setTimeout(() => {
            this.pauseQuestionAudio();
        }, remainingMs);
    },

    pauseQuestionAudio() {
        if (this.audioElement) this.audioElement.pause();
        if (this.audioStopTimer) clearTimeout(this.audioStopTimer);
        this.updateAudioButtonState(false);
    },

    updateAudioButtonState(isPlaying) {
        this.isPlayingAudio = isPlaying;
        const btn = document.getElementById('btn-play-audio');
        if (!btn) return;

        if (isPlaying) {
            btn.className = "w-10 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-xs transition shrink-0";
            btn.setAttribute('title', 'Tạm dừng Audio');
            btn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
        } else {
            btn.className = "w-10 h-10 bg-pink-500 hover:bg-pink-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-pink-200 transition shrink-0";
            btn.setAttribute('title', 'Phát Audio');
            btn.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
        }
        if (window.lucide) lucide.createIcons();
    },

    selectAnswer(qNum, letter) {
        this.answers[qNum] = letter;
        this.refreshUI();
    },

    toggleFlag(qNum) {
        if (this.flagged.has(qNum)) {
            this.flagged.delete(qNum);
        } else {
            this.flagged.add(qNum);
        }
        this.refreshUI();
    },

    jumpToQuestion(idx) {
        this.pauseQuestionAudio();
        this.currentQuestionIndex = idx;
        this.refreshUI();
    },

    prevQuestion() {
        if (this.currentQuestionIndex > 0) this.jumpToQuestion(this.currentQuestionIndex - 1);
    },

    nextQuestion() {
        if (this.currentQuestionIndex < this.examData.questions.length - 1) {
            this.jumpToQuestion(this.currentQuestionIndex + 1);
        }
    },

    zoomImage(imgUrl) {
        const html = `
            <div class="bg-white rounded-3xl max-w-4xl w-full p-4 space-y-3 shadow-2xl border border-pink-100">
                <div class="flex justify-between items-center px-2">
                    <span class="text-xs font-bold text-slate-700">Phóng To Hình Ảnh</span>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-pink-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <img src="${imgUrl}" class="w-full max-h-[80vh] object-contain rounded-2xl">
            </div>
        `;
        if (typeof openModal === 'function') openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerSeconds = (this.examData.duration || 120) * 60;
        const countdownEl = document.getElementById('timer-countdown');

        this.timerInterval = setInterval(() => {
            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.openSubmitModal(true);
                return;
            }
            this.timerSeconds--;
            this.timeSpentSeconds++;
            const m = Math.floor(this.timerSeconds / 60);
            const s = this.timerSeconds % 60;
            if (countdownEl) countdownEl.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }, 1000);
    },

    refreshUI() {
        const app = document.getElementById('app') || document.querySelector('main');
        if (app) {
            app.innerHTML = this.render({ examId: this.examData.examId });
            this.afterRender();
        }
    },

    exitExam(force = false) {
        if (force || confirm("Bạn có chắc muốn thoát bài thi không? Tiến trình hiện tại sẽ không được lưu lại.")) {
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.pauseQuestionAudio();
            this.setGlobalNavVisible(true);
            if (typeof navigateTo === 'function') navigateTo('exam');
        }
    },

    openSubmitModal(isAuto = false) {
        const total = this.examData.questions.length;
        const done = Object.keys(this.answers).length;
        const html = `
            <div class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-pink-100 text-center">
                <div class="w-14 h-14 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-pink-100">
                    <i data-lucide="award" class="w-8 h-8"></i>
                </div>
                <h3 class="font-bold text-slate-800 text-lg">${isAuto ? 'Hết giờ làm bài!' : 'Xác nhận nộp bài thi?'}</h3>
                <p class="text-xs text-slate-500">Bạn đã làm <strong class="text-pink-600">${done} / ${total}</strong> câu. Còn <strong class="text-amber-600">${total - done}</strong> câu chưa điền đáp án.</p>
                <div class="flex space-x-3 pt-3">
                    ${!isAuto ? `<button onclick="closeModal()" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-2xl text-xs transition">Tiếp tục làm</button>` : ''}
                    <button onclick="examPlayerView.finishExam()" class="flex-1 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-pink-200 transition">Nộp bài & Xem kết quả</button>
                </div>
            </div>
        `;
        if (typeof openModal === 'function') openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    finishExam() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.pauseQuestionAudio();
        if (typeof closeModal === 'function') closeModal();
        this.setGlobalNavVisible(true);

        window.lastExamResult = {
            examId: this.examData.examId,
            examTitle: this.examData.title,
            questions: this.examData.questions,
            userAnswers: this.answers,
            timeSpent: this.timeSpentSeconds,
            submittedAt: new Date().toLocaleString('vi-VN')
        };

        // LƯU CÂU HỎI THỰC TẾ ĐÃ LÀM VÀO BỘ NHỚ CHO DASHBOARD
        try {
            let answeredQuestions = JSON.parse(localStorage.getItem('bong_toeic_answered_questions') || '{}');
            this.examData.questions.forEach(q => {
                if (this.answers[q.qNum]) {
                    const key = `${this.examData.examId}_q${q.qNum}`;
                    answeredQuestions[key] = {
                        examId: this.examData.examId,
                        qNum: q.qNum,
                        part: Number(q.part) || 1,
                        userAnswer: this.answers[q.qNum],
                        isCorrect: this.answers[q.qNum] === q.correctAnswer,
                        date: new Date().toISOString()
                    };
                }
            });
            localStorage.setItem('bong_toeic_answered_questions', JSON.stringify(answeredQuestions));
        } catch (e) {
            console.error('Lỗi lưu tiến độ làm bài:', e);
        }
        if (window.syncUserDataToCloud) {
            window.syncUserDataToCloud();
        }
        if (typeof navigateTo === 'function') {
            navigateTo('examResult');
        }
    }
};