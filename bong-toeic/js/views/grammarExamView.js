// js/views/grammarExamView.js
const grammarExamView = {
    timerInterval: null,
    timeLeft: 600,
    isSubmitted: false,
    examQuestions: [],
    examAnswers: {},

    formatMarkdown(text) {
        if (!text) return "";
        const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-pink-900 bg-pink-100/60 px-1 py-0.5 rounded">$1</strong>');
    },

    checkWrittenAnswer(userInput, acceptedList) {
        const cleanUser = (userInput || "").toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").replace(/\s+/g, " ");
        if (!cleanUser) return false;
        return (acceptedList || []).some(acc => {
            const cleanAcc = (acc || "").toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").replace(/\s+/g, " ");
            return cleanAcc === cleanUser;
        });
    },

    startTest() {
        this.isSubmitted = false;
        this.examAnswers = {};
        const questions = window.GrammarStore ? GrammarStore.getQuestions() : [];
        const decks = window.GrammarStore ? GrammarStore.getDecks() : [];

        const folderSel = document.getElementById('examFolderSelect')?.value || 'all';
        const deckSel = document.getElementById('examDeckSelect')?.value || 'all';
        const typeSel = document.getElementById('examTypeSelect')?.value || 'all';
        const countSel = document.getElementById('examCountSelect')?.value || '10';

        let pool = questions.filter(q => {
            let matchFolder = true;
            if (folderSel !== 'all') {
                const parentDeck = decks.find(d => d.id === q.deckId);
                matchFolder = parentDeck && (parentDeck.folderId === folderSel);
            }
            let matchDeck = (deckSel === 'all') || (q.deckId === deckSel);
            let matchType = (typeSel === 'all') || (q.type === typeSel);
            return matchFolder && matchDeck && matchType;
        });

        if (pool.length === 0) {
            alert("Không tìm thấy câu hỏi nào phù hợp với bộ lọc!");
            return;
        }

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const count = countSel === 'all' ? shuffled.length : Math.min(parseInt(countSel), shuffled.length);
        this.examQuestions = shuffled.slice(0, count);

        this.timeLeft = Math.max(60, count * 70);

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            const timerEl = document.getElementById('exam-countdown');
            if (timerEl) {
                const mins = String(Math.floor(this.timeLeft / 60)).padStart(2, '0');
                const secs = String(this.timeLeft % 60).padStart(2, '0');
                timerEl.innerText = `${mins}:${secs}`;
            }
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.submitTest();
            }
        }, 1000);

        this.refresh();
        if (typeof showToast === 'function') showToast(`Bắt đầu bài thi gồm ${count} câu!`);
    },

    submitTest() {
        if (this.isSubmitted) return;
        clearInterval(this.timerInterval);
        this.isSubmitted = true;
        this.refresh();
        if (typeof showToast === 'function') showToast("Đã nộp bài kiểm tra!");
    },

    render() {
        const folders = window.GrammarStore 
            ? (typeof GrammarStore.getFolders === 'function' 
                ? GrammarStore.getFolders() 
                : [...GrammarStore.getCommunityFolders(), ...GrammarStore.getMyFolders()])
            : [];
        const decks = window.GrammarStore ? GrammarStore.getDecks() : [];

        let correctCount = 0;
        if (this.isSubmitted) {
            this.examQuestions.forEach(q => {
                const userAns = this.examAnswers[q.id];
                if (q.type === 'multiple_choice') {
                    if (userAns === q.correctAnswer) correctCount++;
                } else {
                    if (this.checkWrittenAnswer(userAns, q.acceptedAnswers || [q.cleanTarget])) correctCount++;
                }
            });
        }
        const total = this.examQuestions.length;
        const score = total > 0 ? Math.round((correctCount / total) * 100) / 10 : 0;
        const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

        const mins = String(Math.floor(this.timeLeft / 60)).padStart(2, '0');
        const secs = String(this.timeLeft % 60).padStart(2, '0');

        return `
            <div class="space-y-6 max-w-6xl mx-auto pb-16">
                <!-- Cấu hình bài thi -->
                <div class="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50 space-y-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-start space-x-3.5">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-pink-200">
                                <i data-lucide="timer" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <div class="inline-flex items-center space-x-1.5 text-xs bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full font-bold border border-pink-200/60 mb-1">
                                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-pink-500"></i>
                                    <span>Chế độ Thi Tổng hợp</span>
                                </div>
                                <h1 class="text-xl sm:text-2xl font-bold text-slate-900">Bài Kiểm Tra Ngữ Pháp Tổng Hợp</h1>
                                <p class="text-xs sm:text-sm text-slate-500">Tùy biến câu hỏi từ thư mục hoặc bộ đề bất kỳ để kiểm tra tính toàn diện.</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="bg-pink-50/70 border border-pink-100 px-4 py-2 rounded-2xl text-right">
                                <span class="text-[11px] text-pink-500 block font-semibold flex items-center justify-end space-x-1">
                                    <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                                    <span>Thời gian</span>
                                </span>
                                <span id="exam-countdown" class="font-mono text-2xl font-bold text-pink-600">${mins}:${secs}</span>
                            </div>
                            ${!this.isSubmitted && this.examQuestions.length > 0 ? `
                                <button onclick="grammarExamView.submitTest()" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-xs shadow-md shadow-pink-200 hover:opacity-95 transition flex items-center space-x-1.5">
                                    <i data-lucide="check-check" class="w-4 h-4"></i>
                                    <span>Nộp bài thi</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Thanh cấu hình -->
                    <div class="pt-4 border-t border-pink-100 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="folder" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>Nguồn thư mục:</span>
                            </label>
                            <select id="examFolderSelect" class="w-full text-xs font-medium bg-[#fffafb] border border-pink-200 rounded-xl p-2 text-slate-700 focus:outline-none">
                                <option value="all">Tất cả thư mục</option>
                                ${folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="book-open" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>Chọn bộ đề:</span>
                            </label>
                            <select id="examDeckSelect" class="w-full text-xs font-medium bg-[#fffafb] border border-pink-200 rounded-xl p-2 text-slate-700 focus:outline-none">
                                <option value="all">Tất cả bộ đề</option>
                                ${decks.map(d => `<option value="${d.id}">${d.folderName ? d.folderName + ' ➔ ' : ''}${d.title}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="layers" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>Dạng bài tập:</span>
                            </label>
                            <select id="examTypeSelect" class="w-full text-xs font-medium bg-[#fffafb] border border-pink-200 rounded-xl p-2 text-slate-700 focus:outline-none">
                                <option value="all">Tất cả (TN & TL)</option>
                                <option value="multiple_choice">Chỉ trắc nghiệm</option>
                                <option value="written">Chỉ tự luận</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="hash" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>Số lượng câu:</span>
                            </label>
                            <div class="flex gap-2">
                                <select id="examCountSelect" class="flex-1 text-xs font-medium bg-[#fffafb] border border-pink-200 rounded-xl p-2 text-slate-700 focus:outline-none">
                                    <option value="5">5 câu</option>
                                    <option value="10" selected>10 câu</option>
                                    <option value="15">15 câu</option>
                                    <option value="20">20 câu</option>
                                    <option value="all">Tất cả</option>
                                </select>
                                <button onclick="grammarExamView.startTest()" class="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center space-x-1.5">
                                    <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                    <span>Bắt đầu</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bảng kết quả sau khi nộp -->
                ${this.isSubmitted ? `
                    <div class="bg-white p-6 rounded-3xl border-2 border-pink-300 shadow-xl shadow-pink-100/50 space-y-4">
                        <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                            <div class="flex items-center space-x-2.5">
                                <div class="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                                    <i data-lucide="award" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-900">Kết quả bài làm tổng hợp</h3>
                                    <p class="text-xs text-slate-500">Đánh giá chuẩn xác trên cả hình thức trắc nghiệm và tự luận</p>
                                </div>
                            </div>
                            <button onclick="grammarExamView.startTest()" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1.5">
                                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                <span>Làm lại đề này</span>
                            </button>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div class="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                                <span class="text-xs text-pink-600 font-semibold block uppercase">Điểm số</span>
                                <span class="text-3xl font-extrabold text-pink-600">${score}/10</span>
                            </div>
                            <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                <span class="text-xs text-emerald-600 font-semibold block uppercase">Đúng</span>
                                <span class="text-3xl font-extrabold text-emerald-700">${correctCount}</span>
                            </div>
                            <div class="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                <span class="text-xs text-rose-600 font-semibold block uppercase">Sai / Chưa làm</span>
                                <span class="text-3xl font-extrabold text-rose-700">${total - correctCount}</span>
                            </div>
                            <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <span class="text-xs text-amber-600 font-semibold block uppercase">Tỉ lệ đạt</span>
                                <span class="text-3xl font-extrabold text-amber-700">${percent}%</span>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Danh sách câu hỏi thi -->
                <div class="space-y-4">
                    ${this.examQuestions.length === 0 ? `
                        <div class="bg-white p-12 text-center rounded-3xl border border-pink-100 text-slate-400 flex flex-col items-center justify-center space-y-2">
                            <div class="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center mb-1">
                                <i data-lucide="file-question" class="w-6 h-6"></i>
                            </div>
                            <p class="text-sm">Bấm nút <strong>"Bắt đầu"</strong> ở phía trên để nạp đề thi.</p>
                        </div>
                    ` : this.examQuestions.map((q, idx) => {
                        const isMC = q.type === 'multiple_choice';
                        const userAns = this.examAnswers[q.id];

                        let reviewHtml = "";
                        if (this.isSubmitted) {
                            const isCorrect = isMC 
                                ? (userAns === q.correctAnswer)
                                : this.checkWrittenAnswer(userAns, q.acceptedAnswers || [q.cleanTarget]);

                            reviewHtml = `
                                <div class="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                            <i data-lucide="${isCorrect ? 'check-circle-2' : 'x-circle'}" class="w-3.5 h-3.5"></i>
                                            <span>${isCorrect ? 'Đúng' : 'Sai / Chưa làm'}</span>
                                        </span>
                                        <span class="text-slate-600">
                                            ${isMC ? `Đáp án: <strong>${q.correctAnswer}</strong>` : `Đáp án chuẩn: <strong class="text-pink-600 font-mono">${q.cleanTarget || (q.acceptedAnswers && q.acceptedAnswers[0])}</strong>`}
                                        </span>
                                    </div>
                                    ${q.translation ? `
                                        <div class="bg-amber-50/70 p-2.5 rounded-2xl text-slate-800 border border-amber-200/50 flex items-start space-x-2">
                                            <i data-lucide="languages" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                                            <div><strong>Dịch nghĩa:</strong> ${this.formatMarkdown(q.translation)}</div>
                                        </div>
                                    ` : ''}
                                    <div class="bg-pink-50/50 p-2.5 rounded-2xl text-slate-700 flex items-start space-x-2 border border-pink-100/50">
                                        <i data-lucide="lightbulb" class="w-4 h-4 text-pink-500 shrink-0 mt-0.5"></i>
                                        <div><strong>Giải thích:</strong> ${this.formatMarkdown(q.explanation || 'Không có giải thích.')}</div>
                                    </div>
                                </div>
                            `;
                        }

                        return `
                            <div class="bg-white p-5 sm:p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50 space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-bold text-pink-400">Câu ${idx + 1}</span>
                                        <span class="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${isMC ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                                            <i data-lucide="${isMC ? 'check-circle' : 'pen-tool'}" class="w-3 h-3"></i>
                                            <span>${isMC ? 'Trắc nghiệm' : 'Tự luận'}</span>
                                        </span>
                                        <span class="text-xs text-slate-500 font-medium">(${q.topicLabel || q.topic})</span>
                                    </div>
                                </div>

                                <p class="text-slate-900 font-semibold text-sm sm:text-base leading-snug whitespace-pre-line">
                                    ${this.formatMarkdown(q.question)}
                                </p>

                                ${isMC ? `
                                    <div class="space-y-2 mt-2">
                                        ${(q.options || []).map(opt => {
                                            const letter = opt.charAt(0);
                                            return `
                                                <label class="flex items-center gap-3 p-3 rounded-2xl border border-pink-100 hover:bg-pink-50/40 cursor-pointer text-xs sm:text-sm transition">
                                                    <input type="radio" name="exam_q_${q.id}" value="${letter}" ${this.isSubmitted ? 'disabled' : ''} ${userAns === letter ? 'checked' : ''} onchange="grammarExamView.examAnswers['${q.id}'] = '${letter}'" class="text-pink-500 focus:ring-pink-400">
                                                    <span>${opt}</span>
                                                </label>
                                            `;
                                        }).join('')}
                                    </div>
                                ` : `
                                    <div class="mt-2 flex items-center">
                                        ${q.promptPrefix ? `<span class="font-semibold text-slate-700 text-sm shrink-0 mr-2">${q.promptPrefix}</span>` : ''}
                                        <input type="text" ${this.isSubmitted ? 'disabled' : ''} value="${userAns || ''}" placeholder="${q.placeholder || 'Nhập câu trả lời...'}" oninput="grammarExamView.examAnswers['${q.id}'] = this.value" class="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-pink-200 focus:border-pink-400 focus:outline-none">
                                    </div>
                                `}

                                ${reviewHtml}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    refresh() {
        if (typeof navigateTo === 'function') navigateTo('grammarExam');
    },

    afterRender() {
        if (window.lucide && lucide.createIcons) {
            lucide.createIcons();
        }
    }
};