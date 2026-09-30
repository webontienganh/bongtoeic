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
    // Tách chuỗi giải thích thô thành 3 phần rõ ràng và chuẩn xác
    splitExplanationParts(rawExplanation) {
        if (!rawExplanation) {
            return { general: '', optionsMeanings: [], reason: '' };
        }

        let text = rawExplanation.trim();
        let reason = '';
        let optionsMeanings = [];
        let general = '';

        // 1. Tách phần "Lý do:" (ở cuối)
        const reasonRegex = /(?:^|\n|<br\s*\/?>|\.\s+|;\s*)Lý do\s*:\s*([\s\S]*)$/i;
        const reasonMatch = text.match(reasonRegex);
        if (reasonMatch) {
            reason = reasonMatch[1]
                .replace(/^<br\s*\/?>/gi, '')
                .trim();
            text = text.substring(0, reasonMatch.index).trim();
        }

        // 2. Tách phần "Nghĩa của các đáp án:"
        const optRegex = /(?:^|\n|<br\s*\/?>)Nghĩa của các đáp án\s*:\s*([\s\S]*)$/i;
        const optMatch = text.match(optRegex);
        if (optMatch) {
            const optBlock = optMatch[1].trim();
            general = text.substring(0, optMatch.index).trim();

            const rawLines = optBlock.split(/\r?\n|<br\s*\/?>/gi);
            optionsMeanings = rawLines
                .map(l => l.trim())
                .filter(l => l.length > 0);
        } else {
            general = text;
        }

        general = general.replace(/(?:<br\s*\/?>|\s)+$/gi, '').trim();

        return { general, optionsMeanings, reason };
    },
    
    onFolderChange(folderId) {
        const folders = window.GrammarStore 
            ? (typeof GrammarStore.getFolders === 'function' 
                ? GrammarStore.getFolders() 
                : [...(GrammarStore.getCommunityFolders?.() || []), ...(GrammarStore.getMyFolders?.() || [])])
            : [];
        
        const topicSelect = document.getElementById('examTopicSelect');
        const deckSelect = document.getElementById('examDeckSelect');
        if (!topicSelect || !deckSelect) return;

        let topics = [];
        if (folderId === 'all') {
            folders.forEach(f => {
                if (f.topics) topics.push(...f.topics);
            });
        } else {
            const folder = folders.find(f => f.id === folderId);
            topics = folder ? (folder.topics || []) : [];
        }

        topicSelect.innerHTML = `<option value="all">Tất cả chuyên đề</option>` + 
            topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

        this.onTopicChange(topicSelect.value);
    },

    onTopicChange(topicId) {
        const folders = window.GrammarStore 
            ? (typeof GrammarStore.getFolders === 'function' 
                ? GrammarStore.getFolders() 
                : [...(GrammarStore.getCommunityFolders?.() || []), ...(GrammarStore.getMyFolders?.() || [])])
            : [];
        const folderId = document.getElementById('examFolderSelect')?.value || 'all';
        const deckSelect = document.getElementById('examDeckSelect');
        if (!deckSelect) return;

        let decks = [];

        folders.forEach(f => {
            if (folderId === 'all' || f.id === folderId) {
                (f.topics || []).forEach(t => {
                    if (topicId === 'all' || t.id === topicId) {
                        (t.decks || []).forEach(d => {
                            decks.push(d);
                        });
                    }
                });
            }
        });

        // Sắp xếp tự nhiên A-Z
        decks.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi', { numeric: true, sensitivity: 'base' }));

        deckSelect.innerHTML = `<option value="all">Tất cả bộ đề</option>` + 
            decks.map(d => `<option value="${d.id}">${d.title}</option>`).join('');
    },

    startTest() {
        this.isSubmitted = false;
        this.examAnswers = {};
        const questions = window.GrammarStore ? GrammarStore.getQuestions() : [];
        const folders = window.GrammarStore 
            ? (typeof GrammarStore.getFolders === 'function' 
                ? GrammarStore.getFolders() 
                : [...(GrammarStore.getCommunityFolders?.() || []), ...(GrammarStore.getMyFolders?.() || [])])
            : [];

        const folderSel = document.getElementById('examFolderSelect')?.value || 'all';
        const topicSel = document.getElementById('examTopicSelect')?.value || 'all';
        const deckSel = document.getElementById('examDeckSelect')?.value || 'all';
        const typeSel = document.getElementById('examTypeSelect')?.value || 'all';
        const countSel = document.getElementById('examCountSelect')?.value || '10';

        // Lấy danh sách ID các bộ đề thỏa mãn bộ lọc 3 cấp
        let validDeckIds = new Set();
        folders.forEach(f => {
            if (folderSel === 'all' || f.id === folderSel) {
                (f.topics || []).forEach(t => {
                    if (topicSel === 'all' || t.id === topicSel) {
                        (t.decks || []).forEach(d => {
                            if (deckSel === 'all' || d.id === deckSel) {
                                validDeckIds.add(d.id);
                            }
                        });
                    }
                });
            }
        });

        let pool = questions.filter(q => {
            let matchDeck = validDeckIds.has(q.deckId);
            let matchType = (typeSel === 'all') || (q.type === typeSel);
            return matchDeck && matchType;
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

                    <!-- Thanh cấu hình (Tách rõ 3 cấp: Thư mục -> Chuyên đề -> Bộ đề) -->
                    <div class="pt-4 border-t border-pink-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <!-- 1. Thư mục -->
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="folder" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>1. Nguồn thư mục:</span>
                            </label>
                            <select id="examFolderSelect" onchange="grammarExamView.onFolderChange(this.value)" class="w-full text-xs font-medium bg-[#fffafb] border border-pink-200 rounded-xl p-2 text-slate-700 focus:outline-none">
                                <option value="all">Tất cả thư mục</option>
                                ${folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                            </select>
                        </div>

                        <!-- 2. Chuyên đề -->
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="bookmark" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>2. Chuyên đề:</span>
                            </label>
                            <select id="examTopicSelect" onchange="grammarExamView.onTopicChange(this.value)" class="w-full text-xs font-medium bg-[#fffafb] border border-pink-200 rounded-xl p-2 text-slate-700 focus:outline-none">
                                <option value="all">Tất cả chuyên đề</option>
                                ${(() => {
                                    let allTopics = [];
                                    folders.forEach(f => (f.topics || []).forEach(t => allTopics.push(t)));
                                    return allTopics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
                                })()}
                            </select>
                        </div>

                        <!-- 3. Bộ đề -->
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="book-open" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>3. Chọn bộ đề:</span>
                            </label>
                            <select id="examDeckSelect" class="w-full text-xs font-medium bg-[#fffafb] border border-pink-200 rounded-xl p-2 text-slate-700 focus:outline-none">
                                <option value="all">Tất cả bộ đề</option>
                                ${(() => {
                                    let allDecks = [];
                                    folders.forEach(f => (f.topics || []).forEach(t => (t.decks || []).forEach(d => allDecks.push(d))));
                                    allDecks.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi', { numeric: true, sensitivity: 'base' }));
                                    return allDecks.map(d => `<option value="${d.id}">${d.title}</option>`).join('');
                                })()}
                            </select>
                        </div>

                        <!-- 4. Dạng bài -->
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

                        <!-- 5. Số lượng câu + Nút bắt đầu -->
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                                <i data-lucide="hash" class="w-3.5 h-3.5 text-pink-500"></i>
                                <span>Số câu:</span>
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

                                <!-- 4 Khung giải thích chi tiết sau khi nộp bài -->
                                ${this.isSubmitted ? (() => {
                                    const parsed = this.splitExplanationParts(q.explanation);
                                    const generalExplanation = parsed.general || (q.optionsMeanings?.length ? q.explanation : '');
                                    const finalMeanings = (q.optionsMeanings && q.optionsMeanings.length > 0) 
                                        ? q.optionsMeanings 
                                        : parsed.optionsMeanings;
                                    const finalReason = q.reason || parsed.reason;
                                    const defaultReason = `Chọn <strong>${isMC ? (q.correctAnswer || '...') : ((q.acceptedAnswers || [])[0] || '...')}</strong> vì đáp án này phù hợp hoàn toàn với cấu trúc ngữ pháp và nghĩa của ngữ cảnh câu hỏi.`;

                                    return `
                                    <div class="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm">
                                        <div class="flex items-center justify-between pb-1">
                                            <div class="flex items-center gap-2">
                                                <span class="text-slate-600 text-xs">
                                                    ${isMC ? `Đáp án đúng: <strong class="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">${q.correctAnswer}</strong>` : `Đáp án chuẩn: <strong class="text-pink-600 font-mono bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200 font-bold">${q.cleanTarget || (q.acceptedAnswers && q.acceptedAnswers[0])}</strong>`}
                                                </span>
                                            </div>
                                        </div>

                                        <!-- 1. Dịch nghĩa (Màu Xanh lam / Sky) -->
                                        ${q.translation ? `
                                            <div class="text-sky-900 bg-sky-50/70 p-3 rounded-2xl border border-sky-200/60 leading-relaxed text-xs">
                                                <strong class="text-sky-700 font-bold block mb-1">Dịch nghĩa:</strong> 
                                                <span>${this.formatMarkdown(q.translation)}</span>
                                            </div>
                                        ` : ''}

                                        <!-- 2. Giải thích (Màu Tím / Purple) -->
                                        ${generalExplanation ? `
                                            <div class="text-purple-900 bg-purple-50/70 p-3 rounded-2xl border border-purple-200/60 leading-relaxed text-xs">
                                                <strong class="text-purple-700 font-bold block mb-1">Giải thích:</strong> 
                                                <span>${this.formatMarkdown(generalExplanation)}</span>
                                            </div>
                                        ` : ''}

                                        <!-- 3. Nghĩa của các đáp án (Màu Xanh lá / Emerald) -->
                                        ${finalMeanings && finalMeanings.length > 0 ? `
                                            <div class="text-emerald-900 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/60 leading-relaxed text-xs space-y-1">
                                                <strong class="text-emerald-700 font-bold block mb-1">Nghĩa của các đáp án:</strong>
                                                <div class="grid grid-cols-1 gap-1">
                                                    ${finalMeanings.map(opt => `<div class="text-emerald-800">${this.formatMarkdown(opt)}</div>`).join('')}
                                                </div>
                                            </div>
                                        ` : ''}

                                        <!-- 4. Lý do (Màu Hổ phách / Amber) -->
                                        <div class="text-amber-900 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 leading-relaxed text-xs">
                                            <strong class="text-amber-700 font-bold block mb-1">Lý do:</strong>
                                            <span>${this.formatMarkdown(finalReason || defaultReason)}</span>
                                        </div>
                                    </div>
                                    `;
                                })() : ''}
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