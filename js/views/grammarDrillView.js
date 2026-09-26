// js/views/grammarDrillView.js
const grammarDrillView = {
    audioReady: false,
    synth: null,

    initAudio() {
        if (this.audioReady) return;
        try {
            if (window.Tone) {
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.2 }
                }).toDestination();
                this.synth.volume.value = -12;
                this.audioReady = true;
            }
        } catch (e) {
            console.warn("Audio Tone.js init deferred.");
        }
    },

    playSound(isCorrect) {
        this.initAudio();
        if (!this.synth || !window.Tone) return;
        try {
            if (Tone.context.state !== 'running') {
                Tone.start();
            }
            if (isCorrect) {
                this.synth.triggerAttackRelease(["E5", "G#5"], "16n");
            } else {
                this.synth.triggerAttackRelease(["D3", "C#3"], "16n");
            }
        } catch (e) {}
    },

    formatMarkdown(text) {
        if (!text) return "";
        const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-pink-900 bg-pink-100/60 px-1 py-0.5 rounded">$1</strong>');
    },

    normalizeAnswer(str) {
        return (str || "").toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").replace(/\s+/g, " ");
    },

    checkWrittenAnswer(userInput, acceptedList) {
        const cleanUser = this.normalizeAnswer(userInput);
        if (!cleanUser) return false;
        return (acceptedList || []).some(acc => this.normalizeAnswer(acc) === cleanUser);
    },

    render() {
        const questions = window.GrammarStore ? GrammarStore.getQuestions() : [];
        const decks = window.GrammarStore ? GrammarStore.getDecks() : [];
        const folders = window.GrammarStore 
            ? (typeof GrammarStore.getFolders === 'function' 
                ? GrammarStore.getFolders() 
                : [...GrammarStore.getCommunityFolders(), ...GrammarStore.getMyFolders()])
            : [];
        const userAnswers = window.GrammarStore ? GrammarStore.getUserAnswers() : {};

        const currentFolder = appState.grammarFilterFolder || 'all';
        const currentDeck = appState.grammarFilterDeck || 'all';
        const currentType = appState.grammarFilterType || 'all';

        // Lọc danh sách bộ đề hiển thị tương ứng với Thư mục được chọn
        const availableDecks = currentFolder === 'all' 
            ? decks 
            : decks.filter(d => d.folderId === currentFolder);

        // Lọc câu hỏi ăn khớp với dữ liệu kho đề
        const filtered = questions.filter(q => {
            const matchType = (currentType === 'all') || (q.type === currentType);
            
            let matchFolder = true;
            if (currentFolder !== 'all') {
                const parentDeck = decks.find(d => d.id === q.deckId);
                matchFolder = parentDeck && (parentDeck.folderId === currentFolder);
            }

            const matchDeck = (currentDeck === 'all') || (q.deckId === currentDeck);
            return matchType && matchFolder && matchDeck;
        });

        const answeredCount = Object.keys(userAnswers).filter(id => {
            return filtered.some(q => q.id === id) && userAnswers[id].submitted;
        }).length;

        return `
            <div class="space-y-6 max-w-6xl mx-auto">
                <!-- Banner bộ lọc -->
                <div class="bg-white p-5 sm:p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50 space-y-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div class="flex items-center gap-2">
                                <div class="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                                    <i data-lucide="sparkles" class="w-5 h-5"></i>
                                </div>
                                <h1 class="text-2xl font-bold text-slate-900">Ngân hàng câu hỏi Ngữ pháp</h1>
                                <span class="text-xs bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <i data-lucide="target" class="w-3 h-3"></i> Luyện tập
                                </span>
                            </div>
                            <p class="text-xs sm:text-sm text-slate-500 mt-1">Luyện dạng câu hỏi Trắc nghiệm & Tự luận kèm âm thanh phản hồi và giải thích.</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-pink-50 text-slate-700 border border-pink-200/60 flex items-center gap-1.5">
                                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-pink-500"></i>
                                Đã làm: <strong class="text-pink-600 font-bold">${answeredCount}</strong>/${filtered.length}
                            </span>
                            <button onclick="grammarDrillView.resetProgress()" class="text-xs text-slate-400 hover:text-rose-500 transition font-medium flex items-center gap-1">
                                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                <span>Đặt lại tiến độ</span>
                            </button>
                        </div>
                    </div>

                    <!-- Thanh điều hướng dạng bài và bộ lọc cấu trúc kho đề -->
                    <div class="pt-3 border-t border-pink-50 flex flex-wrap items-center gap-3">
                        <span class="text-xs font-semibold uppercase text-pink-400 mr-1 flex items-center gap-1">
                            <i data-lucide="layers" class="w-3.5 h-3.5"></i> Dạng bài:
                        </span>
                        <button onclick="grammarDrillView.setTypeFilter('all')" class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${currentType === 'all' ? 'bg-pink-500 text-white shadow-xs' : 'bg-pink-50 text-pink-800 hover:bg-pink-100'} transition">
                            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
                            <span>Tất cả</span>
                        </button>
                        <button onclick="grammarDrillView.setTypeFilter('multiple_choice')" class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${currentType === 'multiple_choice' ? 'bg-pink-500 text-white shadow-xs' : 'bg-pink-50 text-pink-800 hover:bg-pink-100'} transition">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                            <span>Trắc nghiệm</span>
                        </button>
                        <button onclick="grammarDrillView.setTypeFilter('written')" class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${currentType === 'written' ? 'bg-pink-500 text-white shadow-xs' : 'bg-pink-50 text-pink-800 hover:bg-pink-100'} transition">
                            <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
                            <span>Tự luận</span>
                        </button>

                        <div class="hidden sm:block h-4 w-px bg-pink-100 mx-1"></div>

                        <!-- Lọc theo Thư mục (đồng bộ Kho đề) -->
                        <span class="text-xs font-semibold uppercase text-pink-400 mr-1 flex items-center gap-1">
                            <i data-lucide="folder" class="w-3.5 h-3.5"></i> Thư mục:
                        </span>
                        <select onchange="grammarDrillView.setFolderFilter(this.value)" class="text-xs font-medium bg-[#fffafb] border border-pink-200/70 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
                            <option value="all" ${currentFolder === 'all' ? 'selected' : ''}>📁 Tất cả thư mục</option>
                            ${folders.map(f => `<option value="${f.id}" ${currentFolder === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
                        </select>

                        <!-- Lọc theo Bộ đề (đồng bộ Kho đề) -->
                        <span class="text-xs font-semibold uppercase text-pink-400 mr-1 flex items-center gap-1">
                            <i data-lucide="book-open" class="w-3.5 h-3.5"></i> Bộ đề:
                        </span>
                        <select onchange="grammarDrillView.setDeckFilter(this.value)" class="text-xs font-medium bg-[#fffafb] border border-pink-200/70 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
                            <option value="all" ${currentDeck === 'all' ? 'selected' : ''}>📖 Tất cả bộ đề</option>
                            ${availableDecks.map(d => `<option value="${d.id}" ${currentDeck === d.id ? 'selected' : ''}>${d.folderName ? d.folderName + ' ➔ ' : ''}${d.title}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Danh sách câu hỏi -->
                <div class="space-y-4">
                    ${filtered.length === 0 ? `
                        <div class="bg-white p-12 text-center rounded-3xl border border-pink-100 text-slate-400 shadow-sm flex flex-col items-center">
                            <div class="w-14 h-14 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center mb-3">
                                <i data-lucide="inbox" class="w-7 h-7"></i>
                            </div>
                            <p class="text-base font-semibold text-slate-700">Không tìm thấy câu hỏi phù hợp bộ lọc</p>
                            <p class="text-xs text-slate-400 mt-1">Hãy chuyển bộ lọc hoặc tạo thêm câu hỏi trong mục Quản lý đề.</p>
                            <button onclick="navigateTo('grammarManager')" class="mt-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
                                <i data-lucide="folder-plus" class="w-4 h-4"></i>
                                <span>Đến trang Quản lý & Tạo đề</span>
                            </button>
                        </div>
                    ` : filtered.map((q, idx) => {
                        const state = userAnswers[q.id] || { answer: "", isCorrect: false, submitted: false };
                        const isMC = q.type === 'multiple_choice';

                        const borderStyle = state.submitted 
                            ? (state.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20') 
                            : 'border-pink-100 hover:border-pink-200';

                        return `
                            <div class="bg-white p-5 sm:p-6 rounded-3xl border transition shadow-sm ${borderStyle}">
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    <span class="text-xs font-bold text-pink-400">Câu ${idx + 1}</span>
                                    <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${isMC ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                                        <i data-lucide="${isMC ? 'check-circle' : 'pen-tool'}" class="w-3 h-3"></i>
                                        <span>${isMC ? 'Trắc nghiệm' : 'Tự luận'}</span>
                                    </span>
                                    <span class="text-[11px] font-medium px-2 py-0.5 rounded bg-pink-50 text-slate-600 flex items-center gap-1">
                                        <i data-lucide="tag" class="w-2.5 h-2.5 text-pink-400"></i>
                                        <span>${q.topicLabel || q.topic}</span>
                                    </span>
                                    ${q.subTopicLabel ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-pink-100/70 text-pink-800">${q.subTopicLabel}</span>` : ''}
                                </div>

                                <p class="text-slate-900 font-semibold text-sm sm:text-base leading-snug whitespace-pre-line mt-2">
                                    ${this.formatMarkdown(q.question)}
                                </p>

                                <!-- Body câu hỏi -->
                                ${isMC ? `
                                    <div class="mt-4 space-y-2">
                                        ${(q.options || []).map(opt => {
                                            const letter = opt.charAt(0);
                                            const isSelected = state.answer === letter;
                                            let optionStyles = "border-pink-100 hover:border-pink-300 hover:bg-pink-50/40 text-slate-700";

                                            if (state.submitted) {
                                                if (letter === q.correctAnswer) {
                                                    optionStyles = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500";
                                                } else if (isSelected && !state.isCorrect) {
                                                    optionStyles = "border-rose-400 bg-rose-50 text-rose-800 line-through";
                                                } else {
                                                    optionStyles = "border-slate-200 opacity-60 text-slate-500";
                                                }
                                            } else if (isSelected) {
                                                optionStyles = "border-pink-400 bg-pink-50/80 text-pink-900 font-semibold ring-1 ring-pink-300";
                                            }

                                            return `
                                                <button onclick="grammarDrillView.selectMC('${q.id}', '${letter}')" ${state.submitted ? 'disabled' : ''} class="w-full text-left p-3 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center gap-3 ${optionStyles}">
                                                    <span class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-pink-500 text-white' : 'bg-pink-100/60 text-pink-700'}">${letter}</span>
                                                    <span class="flex-1">${opt.slice(3)}</span>
                                                </button>
                                            `;
                                        }).join('')}
                                    </div>
                                ` : `
                                    <div class="mt-4 space-y-3">
                                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                            ${q.promptPrefix ? `<span class="font-semibold text-slate-700 text-sm shrink-0">${q.promptPrefix}</span>` : ''}
                                            <input type="text" id="drill-written-${q.id}" value="${state.answer || ''}" ${state.submitted ? 'disabled' : ''} placeholder="${q.placeholder || 'Nhập câu trả lời...'}" onkeydown="if(event.key==='Enter') grammarDrillView.submitWritten('${q.id}')" class="flex-1 text-sm px-3.5 py-2.5 rounded-2xl border ${state.submitted ? (state.isCorrect ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900' : 'border-rose-400 bg-rose-50/50 text-rose-900') : 'border-pink-200 focus:border-pink-400'} transition font-medium focus:outline-none">
                                            ${!state.submitted ? `
                                                <button onclick="grammarDrillView.submitWritten('${q.id}')" class="px-5 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition shrink-0 shadow-sm shadow-pink-200 flex items-center justify-center gap-1.5">
                                                    <i data-lucide="check" class="w-4 h-4"></i>
                                                    <span>Kiểm tra</span>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `}

                                <!-- Giải thích chi tiết khi nộp -->
                                ${state.submitted ? `
                                    <div class="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs sm:text-sm">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <span class="inline-flex items-center gap-1 font-bold text-xs ${state.isCorrect ? 'text-emerald-700 bg-emerald-100/60' : 'text-rose-700 bg-rose-100/60'} px-2.5 py-1 rounded-md">
                                                    <i data-lucide="${state.isCorrect ? 'check' : 'x'}" class="w-3.5 h-3.5"></i>
                                                    <span>${state.isCorrect ? 'Chính xác' : 'Chưa đúng'}</span>
                                                </span>
                                                <span class="text-slate-600 text-xs">
                                                    ${isMC ? `Đáp án đúng: <strong>${q.correctAnswer}</strong>` : `Đáp án chuẩn: <strong class="text-pink-600 font-mono">${q.cleanTarget || (q.acceptedAnswers && q.acceptedAnswers[0])}</strong>`}
                                                </span>
                                            </div>
                                            <button onclick="grammarDrillView.retryQuestion('${q.id}')" class="text-xs text-pink-500 hover:text-pink-700 font-semibold underline flex items-center gap-1">
                                                <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                                                <span>Làm lại câu này</span>
                                            </button>
                                        </div>
                                        ${q.translation ? `
                                            <div class="bg-amber-50/60 p-2.5 rounded-xl text-slate-800 border border-amber-200/60 text-xs flex items-start gap-2">
                                                <i data-lucide="languages" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
                                                <div>
                                                    <span class="font-bold text-amber-800">Dịch nghĩa:</span> ${this.formatMarkdown(q.translation)}
                                                </div>
                                            </div>
                                        ` : ''}
                                        <div class="bg-pink-50/40 p-3.5 rounded-2xl text-slate-700 border border-pink-100 leading-relaxed text-xs sm:text-sm flex items-start gap-2">
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

    selectMC(qId, letter) {
        const q = GrammarStore.getQuestions().find(item => item.id === qId);
        if (!q) return;
        const isCorrect = (letter === q.correctAnswer);
        GrammarStore.setUserAnswer(qId, { answer: letter, isCorrect, submitted: true });
        this.playSound(isCorrect);
        this.refresh();
    },

    submitWritten(qId) {
        const q = GrammarStore.getQuestions().find(item => item.id === qId);
        if (!q) return;
        const input = document.getElementById(`drill-written-${qId}`);
        if (!input || !input.value.trim()) {
            if (typeof showToast === 'function') showToast("Vui lòng nhập câu trả lời!");
            return;
        }
        const val = input.value.trim();
        const isCorrect = this.checkWrittenAnswer(val, q.acceptedAnswers || [q.cleanTarget]);
        GrammarStore.setUserAnswer(qId, { answer: val, isCorrect, submitted: true });
        this.playSound(isCorrect);
        this.refresh();
    },

    retryQuestion(qId) {
        GrammarStore.removeUserAnswer(qId);
        this.refresh();
    },

    resetProgress() {
        if (confirm("Bạn có chắc muốn đặt lại toàn bộ tiến độ làm bài ngữ pháp?")) {
            GrammarStore.resetUserAnswers();
            this.refresh();
            if (typeof showToast === 'function') showToast("Đã đặt lại tiến độ!");
        }
    },

    setTypeFilter(type) {
        appState.grammarFilterType = type;
        this.refresh();
    },
    setFolderFilter(folderId) {
        appState.grammarFilterFolder = folderId;
        appState.grammarFilterDeck = 'all'; // Đặt lại bộ đề khi đổi thư mục
        this.refresh();
    },
    setDeckFilter(deckId) {
        appState.grammarFilterDeck = deckId;
        this.refresh();
    },

    refresh() {
        if (typeof navigateTo === 'function') navigateTo('grammarDrill');
    },

    afterRender() {
        if (window.lucide && lucide.createIcons) {
            lucide.createIcons();
        }
    }
};