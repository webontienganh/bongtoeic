// js/views/grammarExamView.js
const grammarExamView = {
    timerInterval: null,
    timeLeft: 600,
    isSubmitted: false,
    examQuestions: [],
    examAnswers: {},

    formatMarkdown(text) {
        if (!text) return "";
        let formatted = String(text)
            .replace(/\\n/g, '<br/>')
            .replace(/<br\s*[\/]?>/gi, '<br/>');
            
        return formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-600 font-bold">$1</strong>');
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

    selectExamOption(qId, letter) {
        if (this.isSubmitted) return;
        this.examAnswers[qId] = letter;
        this.refresh();
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
                                <button onclick="grammarExamView.submitTest()" class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-xs shadow-md shadow-pink-200 hover:opacity-95 transition flex items-center space-x-1.5 cursor-pointer">
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
                                <button onclick="grammarExamView.startTest()" class="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center space-x-1.5 cursor-pointer">
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
                            <button onclick="grammarExamView.startTest()" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer">
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
                <div class="space-y-5">
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

                        let isCorrect = false;
                        if (this.isSubmitted) {
                            isCorrect = isMC 
                                ? (userAns === q.correctAnswer)
                                : this.checkWrittenAnswer(userAns, q.acceptedAnswers || [q.cleanTarget]);
                        }

                        const borderStyle = this.isSubmitted 
                            ? (isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20') 
                            : 'border-pink-100 hover:border-pink-200';

                        return `
                            <div class="bg-white p-5 sm:p-6 rounded-3xl border transition shadow-sm ${borderStyle}">
                                <!-- Tiêu đề tách biệt 2 nhãn màu riêng: Nhãn câu & Nhãn hình thức -->
                                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <!-- Nhãn 1: Số thứ tự câu -->
                                        <span class="text-xs font-bold text-pink-600 bg-pink-50 border border-pink-200/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                                            <span class="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                            <span>Câu ${idx + 1}</span>
                                        </span>

                                        <!-- Nhãn 2: Hình thức câu hỏi với màu sắc phân biệt riêng -->
                                        <span class="text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                                            isMC 
                                                ? 'bg-purple-50 text-purple-700 border-purple-200/70' 
                                                : 'bg-amber-50 text-amber-700 border-amber-200/70'
                                        }">
                                            <span class="w-1.5 h-1.5 rounded-full ${isMC ? 'bg-purple-500' : 'bg-amber-500'}"></span>
                                            <span>${isMC ? 'Trắc nghiệm' : 'Tự luận'}</span>
                                        </span>
                                    </div>

                                    ${this.isSubmitted ? `
                                        <span class="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${isCorrect ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200' : 'bg-rose-100/80 text-rose-800 border border-rose-200'}">
                                            <i data-lucide="${isCorrect ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5"></i>
                                            <span>${isCorrect ? 'Đúng' : 'Sai'}</span>
                                        </span>
                                    ` : ''}
                                </div>

                                <!-- Nội dung câu hỏi -->
                                <div class="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mt-2">
                                    ${this.formatMarkdown(q.question)}
                                </div>

                                <!-- Bố cục đáp án: Dạng lưới 2 cột với huy hiệu chữ cái bo tròn đồng bộ -->
                                ${isMC ? `
                                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        ${(q.options || []).map(opt => {
                                            const letter = opt.trim().charAt(0).toUpperCase();
                                            const optionContent = opt.replace(/^[A-D]\.\s*/i, '');
                                            const isSelected = userAns === letter;
                                            
                                            let optionStyles = "border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 text-slate-700 bg-white";
                                            let badgeStyles = isSelected ? "bg-pink-500 text-white" : "border border-slate-300 bg-slate-50 text-slate-600";
                                            let icon = `<span class="text-xs font-bold">${letter}</span>`;

                                            if (this.isSubmitted) {
                                                if (letter === q.correctAnswer) {
                                                    optionStyles = "border-emerald-400 bg-emerald-50/90 text-emerald-900 font-semibold ring-1 ring-emerald-400";
                                                    badgeStyles = "bg-emerald-500 text-white";
                                                    icon = `<i data-lucide="check" class="w-3.5 h-3.5"></i>`;
                                                } else if (isSelected && !isCorrect) {
                                                    optionStyles = "border-rose-300 bg-rose-50 text-rose-800 line-through";
                                                    badgeStyles = "bg-rose-500 text-white";
                                                    icon = `<i data-lucide="x" class="w-3.5 h-3.5"></i>`;
                                                } else {
                                                    optionStyles = "border-slate-200 opacity-50 text-slate-400 bg-slate-50/40";
                                                }
                                            } else if (isSelected) {
                                                optionStyles = "border-pink-400 bg-pink-50/80 text-pink-900 font-semibold ring-1 ring-pink-300";
                                            }

                                            return `
                                                <button onclick="grammarExamView.selectExamOption('${q.id}', '${letter}')" ${this.isSubmitted ? 'disabled' : ''} class="w-full text-left p-3 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center gap-3 cursor-pointer ${optionStyles}">
                                                    <span class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${badgeStyles}">${icon}</span>
                                                    <span class="flex-1">${this.formatMarkdown(optionContent)}</span>
                                                </button>
                                            `;
                                        }).join('')}
                                    </div>
                                ` : `
                                    <div class="mt-4 space-y-3">
                                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            ${q.promptPrefix ? `<span class="font-semibold text-slate-700 text-sm shrink-0">${this.formatMarkdown(q.promptPrefix)}</span>` : ''}
                                            <input type="text" value="${userAns || ''}" ${this.isSubmitted ? 'disabled' : ''} placeholder="${q.placeholder || 'Nhập câu trả lời...'}" oninput="grammarExamView.examAnswers['${q.id}'] = this.value" class="flex-1 text-sm px-3.5 py-2.5 rounded-2xl border ${this.isSubmitted ? (isCorrect ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900' : 'border-rose-400 bg-rose-50/50 text-rose-900') : 'border-pink-200 focus:border-pink-400'} transition font-medium focus:outline-none">
                                        </div>
                                    </div>
                                `}

                                <!-- Giải thích chi tiết sau khi nộp bài -->
                                ${this.isSubmitted ? `
                                    <div class="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <span class="text-slate-600 text-xs">
                                                    ${isMC ? `Đáp án đúng: <strong class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">${q.correctAnswer}</strong>` : `Đáp án chuẩn: <strong class="text-pink-600 font-mono bg-pink-50 px-2 py-0.5 rounded border border-pink-200">${q.cleanTarget || (q.acceptedAnswers && q.acceptedAnswers[0])}</strong>`}
                                                </span>
                                            </div>
                                        </div>
                                        ${q.translation ? `
                                            <div class="bg-amber-50/70 p-3 rounded-2xl text-slate-800 border border-amber-200/60 text-xs flex items-start gap-2 leading-relaxed">
                                                <i data-lucide="languages" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
                                                <div>
                                                    <span class="font-bold text-amber-900">Dịch nghĩa:</span> ${this.formatMarkdown(q.translation)}
                                                </div>
                                            </div>
                                        ` : ''}
                                        <div class="bg-pink-50/50 p-3.5 rounded-2xl text-slate-700 border border-pink-100 leading-relaxed text-xs sm:text-sm flex items-start gap-2">
                                            <i data-lucide="lightbulb" class="w-4 h-4 text-pink-500 shrink-0 mt-0.5"></i>
                                            <div>
                                                <span class="font-bold text-slate-900 block mb-1">Giải thích chi tiết:</span>
                                                ${this.formatMarkdown(q.explanation || 'Không có giải thích chi tiết.')}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
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