// js/examResultView.js
const examResultView = {
    filterStatus: 'all', // 'all' | 'correct' | 'wrong' | 'skipped'

    render() {
        const result = window.lastExamResult;

        if (!result || !result.questions || result.questions.length === 0) {
            return `
                <div class="fixed inset-0 z-40 bg-[#fff6f8] flex items-center justify-center p-4 selection:bg-pink-200 selection:text-pink-900">
                    <div class="max-w-xl w-full bg-white rounded-3xl p-8 border border-pink-100 text-center space-y-4 shadow-sm shadow-pink-50">
                        <div class="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto border border-pink-100">
                            <i data-lucide="alert-circle" class="w-6 h-6"></i>
                        </div>
                        <h2 class="text-lg font-bold text-slate-800">Không có dữ liệu kết quả thi</h2>
                        <p class="text-xs text-slate-500">Vui lòng hoàn thành một đề thi để xem chi tiết bảng điểm.</p>
                        <button onclick="navigateTo('exam')" class="px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-2xl text-xs font-semibold hover:opacity-95 shadow-md shadow-pink-200 transition">Quay lại Kho Đề</button>
                    </div>
                </div>
            `;
        }

        const questions = result.questions;
        const answers = result.userAnswers || {};

        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;
        let listeningCorrect = 0;
        let listeningTotal = 0;
        let readingCorrect = 0;
        let readingTotal = 0;

        questions.forEach(q => {
            const userAns = answers[q.qNum];
            const isListening = Number(q.part) <= 4;

            if (isListening) listeningTotal++;
            else readingTotal++;

            if (!userAns) {
                skippedCount++;
            } else if (userAns === q.correctAnswer) {
                correctCount++;
                if (isListening) listeningCorrect++;
                else readingCorrect++;
            } else {
                wrongCount++;
            }
        });

        // Ước tính điểm TOEIC cơ bản (Thang 495 mỗi kỹ năng)
        const estListeningScore = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 495 / 5) * 5 : 0;
        const estReadingScore = readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 495 / 5) * 5 : 0;
        const estTotalScore = estListeningScore + estReadingScore;

        const timeMin = Math.floor(result.timeSpent / 60);
        const timeSec = result.timeSpent % 60;

        // Lọc câu hỏi hiển thị
        const filteredQuestions = questions.filter(q => {
            const userAns = answers[q.qNum];
            if (this.filterStatus === 'correct') return userAns === q.correctAnswer;
            if (this.filterStatus === 'wrong') return userAns && userAns !== q.correctAnswer;
            if (this.filterStatus === 'skipped') return !userAns;
            return true;
        });

        return `
            <!-- Khung bao phủ toàn màn hình sát 2 bên mép, cuộn mượt mà -->
            <div class="fixed inset-0 z-40 bg-[#fff6f8] overflow-y-auto flex flex-col selection:bg-pink-200 selection:text-pink-900">
                <div class="w-full px-3 sm:px-6 py-4 sm:py-6 space-y-5">
                    
                    <!-- Header Kết Quả Sát Biên -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50 w-full">
                        <div>
                            <div class="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
                                <i data-lucide="check-circle" class="w-4 h-4"></i>
                                <span>Hoàn thành bài thi</span>
                            </div>
                            <h1 class="text-xl sm:text-2xl font-bold text-slate-800">${result.examTitle}</h1>
                            <p class="text-xs text-slate-400 mt-1">Nộp bài lúc: ${result.submittedAt} • Thời gian làm: ${timeMin} phút ${timeSec} giây</p>
                        </div>
                        <div class="flex items-center space-x-3 shrink-0">
                            <button onclick="navigateTo('examPlayer', { examId: '${result.examId}' })" class="px-4 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5 border border-pink-200/60">
                                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                                <span>Luyện thi lại</span>
                            </button>
                            <button onclick="navigateTo('exam')" class="px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white font-semibold rounded-xl text-xs shadow-md shadow-pink-200 transition">
                                Về Kho Đề
                            </button>
                        </div>
                    </div>

                    <!-- Thống Kê Tổng Điểm -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
                        <!-- Điểm Ước Tính -->
                        <div class="bg-gradient-to-tr from-pink-400 via-rose-400 to-pink-300 text-white p-5 rounded-2xl shadow-md shadow-pink-200 flex flex-col justify-between">
                            <div>
                                <span class="text-xs text-pink-50 font-medium">Điểm TOEIC ước tính</span>
                                <div class="text-3xl sm:text-4xl font-extrabold mt-1 font-mono">${estTotalScore} <span class="text-base font-normal text-pink-100">/ 990</span></div>
                            </div>
                            <div class="pt-3 border-t border-white/20 text-xs flex justify-between text-pink-50 mt-2 font-medium">
                                <span>LC: ~${estListeningScore}</span>
                                <span>RC: ~${estReadingScore}</span>
                            </div>
                        </div>

                        <!-- Đúng -->
                        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50 flex items-center space-x-3.5">
                            <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
                                <i data-lucide="check" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <p class="text-xs text-slate-400 font-medium">Số câu đúng</p>
                                <p class="text-xl sm:text-2xl font-bold text-slate-800">${correctCount} <span class="text-xs font-normal text-slate-400">/ ${questions.length}</span></p>
                            </div>
                        </div>

                        <!-- Sai -->
                        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50 flex items-center space-x-3.5">
                            <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-100">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <p class="text-xs text-slate-400 font-medium">Số câu sai</p>
                                <p class="text-xl sm:text-2xl font-bold text-slate-800">${wrongCount} <span class="text-xs font-normal text-slate-400">câu</span></p>
                            </div>
                        </div>

                        <!-- Bỏ Qua -->
                        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50 flex items-center space-x-3.5">
                            <div class="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold shrink-0 border border-slate-200">
                                <i data-lucide="help-circle" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <p class="text-xs text-slate-400 font-medium">Chưa làm (Bỏ qua)</p>
                                <p class="text-xl sm:text-2xl font-bold text-slate-800">${skippedCount} <span class="text-xs font-normal text-slate-400">câu</span></p>
                            </div>
                        </div>
                    </div>

                    <!-- Bảng Lọc & Danh Sách Câu Hỏi Chi Tiết Sát 2 Bên -->
                    <div class="bg-white rounded-2xl border border-pink-100 shadow-sm shadow-pink-50 p-4 sm:p-6 space-y-5 w-full">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-4">
                            <div>
                                <h2 class="font-bold text-slate-800 text-base">Xem lại đáp án & Giải thích chi tiết</h2>
                                <p class="text-xs text-slate-400">Xem lại từng câu, đối chiếu phương án đã chọn với đáp án chuẩn.</p>
                            </div>

                            <!-- Bộ Lọc -->
                            <div class="flex items-center space-x-1 bg-pink-50/70 p-1 rounded-xl text-xs font-semibold shrink-0 border border-pink-100/60">
                                <button onclick="examResultView.setFilter('all')" class="px-3 py-1.5 rounded-lg transition ${this.filterStatus === 'all' ? 'bg-pink-500 text-white shadow-sm shadow-pink-200 font-bold' : 'text-slate-600 hover:text-pink-600'}">Tất cả (${questions.length})</button>
                                <button onclick="examResultView.setFilter('correct')" class="px-3 py-1.5 rounded-lg transition ${this.filterStatus === 'correct' ? 'bg-emerald-500 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-emerald-700'}">Đúng (${correctCount})</button>
                                <button onclick="examResultView.setFilter('wrong')" class="px-3 py-1.5 rounded-lg transition ${this.filterStatus === 'wrong' ? 'bg-rose-500 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-rose-700'}">Sai (${wrongCount})</button>
                                <button onclick="examResultView.setFilter('skipped')" class="px-3 py-1.5 rounded-lg transition ${this.filterStatus === 'skipped' ? 'bg-slate-700 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}">Bỏ qua (${skippedCount})</button>
                            </div>
                        </div>

                        <!-- Danh sách câu hỏi -->
                        <div class="space-y-4">
                            ${filteredQuestions.length === 0 ? `
                                <p class="text-center py-8 text-xs text-slate-400">Không có câu hỏi nào thuộc phân loại này.</p>
                            ` : filteredQuestions.map(q => {
                                const userAns = answers[q.qNum];
                                const isCorrect = userAns === q.correctAnswer;
                                const isSkipped = !userAns;

                                let statusBadge = isCorrect
                                    ? `<span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">✓ Đúng</span>`
                                    : isSkipped
                                    ? `<span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">○ Bỏ qua</span>`
                                    : `<span class="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-200">✕ Sai</span>`;

                                const questionImg = q.image || (typeof q.passage === 'string' && (q.passage.startsWith('http') || q.passage.startsWith('data:image')) ? q.passage : null);

                                return `
                                    <div class="p-4 sm:p-5 rounded-2xl border transition shadow-sm ${isCorrect ? 'border-emerald-200 bg-emerald-50/20' : isSkipped ? 'border-pink-100 bg-[#fffafb]' : 'border-rose-200 bg-rose-50/20'} space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center space-x-2">
                                                <span class="font-bold text-slate-800 text-sm">Câu ${q.qNum} (Part ${q.part})</span>${statusBadge}
                                            </div>
                                            <div class="text-xs font-mono text-slate-500">
                                                Bạn chọn: <strong class="${isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">${userAns || 'Chưa chọn'}</strong> | Đáp án: <strong class="text-pink-600 font-bold">${q.correctAnswer}</strong>
                                            </div>
                                        </div>

                                        ${questionImg ? `
                                            <div class="max-w-sm rounded-xl overflow-hidden border border-pink-100 bg-white p-2">
                                                <img src="${questionImg}" class="max-h-52 object-contain rounded-lg mx-auto">
                                            </div>
                                        ` : ''}

                                        ${q.questionText ? `<p class="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">${q.questionText}</p>` : ''}

                                        <!-- Danh sách các đáp án -->
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            ${q.options.map((opt, idx) => {
                                                const letter = String.fromCharCode(65 + idx);
                                                const isThisCorrect = letter === q.correctAnswer;
                                                const isThisChosen = letter === userAns;

                                                let optClass = "bg-white border-pink-100 text-slate-700";
                                                if (isThisCorrect) {
                                                    optClass = "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-500";
                                                } else if (isThisChosen && !isThisCorrect) {
                                                    optClass = "bg-rose-50 border-rose-400 text-rose-800 font-semibold line-through";
                                                }

                                                return `
                                                    <div class="p-2.5 rounded-xl border flex items-center justify-between transition ${optClass}">
                                                        <div class="flex items-center space-x-2.5">
                                                            <span class="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${isThisCorrect ? 'bg-emerald-500 text-white' : isThisChosen ? 'bg-rose-500 text-white' : 'bg-pink-100/60 text-pink-700'}">${letter}</span>
                                                            <span>${opt}</span>
                                                        </div>
                                                        ${isThisCorrect ? '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i>' : ''}
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>

                                        <!-- KHUNG RIÊNG: GIẢI THÍCH & DỊCH NGHĨA (Chuẩn mẫu ảnh thiết kế) -->
                                        ${(q.explanation || q.translation) ? `
                                            <div class="bg-pink-50/40 rounded-xl border border-pink-100 p-3.5 sm:p-4 text-xs sm:text-sm space-y-2 mt-3 leading-relaxed text-slate-700">
                                                ${q.explanation ? `
                                                    <p class="text-slate-800">
                                                        <strong class="text-pink-600 font-bold mr-1">💡 Giải thích chi tiết:</strong>${q.explanation}
                                                    </p>
                                                ` : ''}
                                                ${q.translation ? `
                                                    <p class="text-slate-600 italic">
                                                        <strong class="text-slate-700 font-bold not-italic mr-1">📖 Dịch nghĩa:</strong>${q.translation}
                                                    </p>
                                                ` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setFilter(status) {
        this.filterStatus = status;
        const app = document.getElementById('app') || document.querySelector('main');
        if (app) {
            app.innerHTML = this.render();
            this.afterRender();
        }
    },

    afterRender() {
        if (window.lucide) lucide.createIcons();
    }
};