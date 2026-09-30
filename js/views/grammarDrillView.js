// js/views/grammarDrillView.js
const grammarDrillView = {
    audioReady: false,
    synth: null,

    initAudio() {
        if (this.audioReady) return;
        try {
            if (window.Tone && typeof Tone.PolySynth === 'function') {
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.2 }
                }).toDestination();
                if (this.synth && this.synth.volume) {
                    this.synth.volume.value = -12;
                }
                this.audioReady = true;
            }
        } catch (e) {
            console.warn("Audio Tone.js init deferred.", e);
        }
    },

    playSound(isCorrect) {
        try {
            this.initAudio();
            if (!this.synth || !window.Tone) return;
            
            if (Tone.context && Tone.context.state !== 'running') {
                Tone.start().catch(() => {});
            }
            
            if (isCorrect) {
                this.synth.triggerAttackRelease(["E5", "G#5"], "16n");
            } else {
                this.synth.triggerAttackRelease(["D3", "C#3"], "16n");
            }
        } catch (e) {
            // Bỏ qua lỗi âm thanh nếu trình duyệt chặn
        }
    },

    // Cập nhật: In đậm chữ màu hồng chuẩn theo Hình 3 (không dùng background xám/hồng)
    formatMarkdown(text) {
        if (!text) return "";
        let formatted = String(text)
            .replace(/\\n/g, '<br/>')
            .replace(/<br\s*[\/]?>/gi, '<br/>');
            
        // In đậm text-pink-600 font-bold như ảnh 3
        return formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-600 font-bold">$1</strong>');
    },

    normalizeAnswer(str) {
        return (str || "").toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").replace(/\s+/g, " ");
    },

    checkWrittenAnswer(userInput, acceptedList) {
        const cleanUser = this.normalizeAnswer(userInput);
        if (!cleanUser) return false;
        return (acceptedList || []).some(acc => this.normalizeAnswer(acc) === cleanUser);
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

        // 1. Tách phần "Lý do:" (nằm ở cuối)
        const reasonRegex = /(?:^|\n|<br\s*\/?>|\.\s+|;\s*)Lý do\s*:\s*([\s\S]*)$/i;
        const reasonMatch = text.match(reasonRegex);
        if (reasonMatch) {
            reason = reasonMatch[1]
                .replace(/^<br\s*\/?>/gi, '')
                .trim();
            // Cắt bỏ phần Lý do ra khỏi text chính
            text = text.substring(0, reasonMatch.index).trim();
        }

        // 2. Tách phần "Nghĩa của các đáp án:"
        const optRegex = /(?:^|\n|<br\s*\/?>)Nghĩa của các đáp án\s*:\s*([\s\S]*)$/i;
        const optMatch = text.match(optRegex);
        if (optMatch) {
            const optBlock = optMatch[1].trim();
            // Cắt bỏ phần Nghĩa đáp án ra khỏi text chính -> phần còn lại chính là Giải thích chung
            general = text.substring(0, optMatch.index).trim();

            // Tách các dòng theo xuống dòng hoặc thẻ <br>
            const rawLines = optBlock.split(/\r?\n|<br\s*\/?>/gi);
            optionsMeanings = rawLines
                .map(l => l.trim())
                .filter(l => l.length > 0);
        } else {
            general = text;
        }

        // Làm sạch thẻ <br> hoặc dấu câu dư thừa ở cuối general
        general = general.replace(/(?:<br\s*\/?>|\s)+$/gi, '').trim();

        return { general, optionsMeanings, reason };
    },

    render() {
        const questions = window.GrammarStore ? GrammarStore.getQuestions() : [];
        const decks = window.GrammarStore ? GrammarStore.getDecks() : [];
        const folders = window.GrammarStore 
            ? (typeof GrammarStore.getFolders === 'function' 
                ? GrammarStore.getFolders() 
                : [...(GrammarStore.getCommunityFolders?.() || []), ...(GrammarStore.getMyFolders?.() || [])])
            : [];
        const userAnswers = window.GrammarStore ? GrammarStore.getUserAnswers() : {};

        const currentFolder = appState.grammarFilterFolder || 'all';
        const currentTopic = appState.grammarFilterTopic || 'all';
        const currentDeck = appState.grammarFilterDeck || 'all';
        const currentType = appState.grammarFilterType || 'all';

        // 1. Lọc danh sách chuyên đề theo thư mục được chọn
        let availableTopics = [];
        folders.forEach(f => {
            if (currentFolder === 'all' || f.id === currentFolder) {
                if (f.topics) availableTopics.push(...f.topics);
            }
        });

        // 2. Lọc danh sách bộ đề theo thư mục và chuyên đề được chọn
        let availableDecks = [];
        let validDeckIds = new Set();

        folders.forEach(f => {
            if (currentFolder === 'all' || f.id === currentFolder) {
                (f.topics || []).forEach(t => {
                    if (currentTopic === 'all' || t.id === currentTopic) {
                        (t.decks || []).forEach(d => {
                            availableDecks.push(d);
                            if (currentDeck === 'all' || d.id === currentDeck) {
                                validDeckIds.add(d.id);
                            }
                        });
                    }
                });
            }
        });

        // Sắp xếp bộ đề theo A-Z tự nhiên
        availableDecks.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi', { numeric: true, sensitivity: 'base' }));

        // 3. Lọc danh sách câu hỏi phù hợp
        const filtered = questions.filter(q => {
            const matchType = (currentType === 'all') || (q.type === currentType);
            const matchDeck = validDeckIds.has(q.deckId);
            return matchType && matchDeck;
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
                            <button onclick="grammarDrillView.resetProgress()" class="text-xs text-slate-400 hover:text-rose-500 transition font-medium flex items-center gap-1 cursor-pointer">
                                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                <span>Đặt lại tiến độ</span>
                            </button>
                        </div>
                    </div>

                    <!-- Thanh điều hướng dạng bài và bộ lọc cấu trúc kho đề (Đã chuẩn hóa cân đối Mobile & Laptop) -->
                    <div class="pt-4 border-t border-pink-50 space-y-3.5">
                        <!-- Hàng 1: Dạng bài -->
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-pink-500 mr-1 flex items-center gap-1.5 shrink-0">
                                <i data-lucide="layers" class="w-3.5 h-3.5"></i> Dạng bài:
                            </span>
                            <div class="flex flex-wrap items-center gap-2">
                                <button onclick="grammarDrillView.setTypeFilter('all')" class="text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${currentType === 'all' ? 'bg-pink-500 text-white shadow-xs ring-2 ring-pink-300' : 'bg-pink-50/80 text-pink-700 hover:bg-pink-100'}">
                                    <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
                                    <span>Tất cả</span>
                                </button>
                                <button onclick="grammarDrillView.setTypeFilter('multiple_choice')" class="text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${currentType === 'multiple_choice' ? 'bg-pink-500 text-white shadow-xs ring-2 ring-pink-300' : 'bg-pink-50/80 text-pink-700 hover:bg-pink-100'}">
                                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                                    <span>Trắc nghiệm</span>
                                </button>
                                <button onclick="grammarDrillView.setTypeFilter('written')" class="text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${currentType === 'written' ? 'bg-pink-500 text-white shadow-xs ring-2 ring-pink-300' : 'bg-pink-50/80 text-pink-700 hover:bg-pink-100'}">
                                    <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
                                    <span>Tự luận</span>
                                </button>
                            </div>
                        </div>

                        <!-- Hàng 2: Bộ lọc 3 cấp Thư mục -> Chuyên đề -> Bộ đề (Grid 3 cột cân đối tuyệt đối) -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <!-- 1. Lọc theo Thư mục -->
                            <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-pink-50/40 p-1.5 px-2.5 rounded-2xl border border-pink-100/80">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-pink-500 flex items-center gap-1 shrink-0">
                                    <i data-lucide="folder" class="w-3.5 h-3.5"></i> Thư mục:
                                </span>
                                <div class="relative flex-1 min-w-0">
                                    <select onchange="grammarDrillView.setFolderFilter(this.value)" class="w-full text-xs font-medium bg-white border border-pink-200/80 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-pink-400 cursor-pointer truncate">
                                        <option value="all" ${currentFolder === 'all' ? 'selected' : ''}>📁 Tất cả thư mục</option>
                                        ${folders.map(f => `<option value="${f.id}" ${currentFolder === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <!-- 2. Lọc theo Chuyên đề -->
                            <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-pink-50/40 p-1.5 px-2.5 rounded-2xl border border-pink-100/80">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-pink-500 flex items-center gap-1 shrink-0">
                                    <i data-lucide="bookmark" class="w-3.5 h-3.5"></i> Chuyên đề:
                                </span>
                                <div class="relative flex-1 min-w-0">
                                    <select onchange="grammarDrillView.setTopicFilter(this.value)" class="w-full text-xs font-medium bg-white border border-pink-200/80 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-pink-400 cursor-pointer truncate">
                                        <option value="all" ${currentTopic === 'all' ? 'selected' : ''}>🔖 Tất cả chuyên đề</option>
                                        ${availableTopics.map(t => `<option value="${t.id}" ${currentTopic === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <!-- 3. Lọc theo Bộ đề -->
                            <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-pink-50/40 p-1.5 px-2.5 rounded-2xl border border-pink-100/80">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-pink-500 flex items-center gap-1 shrink-0">
                                    <i data-lucide="book-open" class="w-3.5 h-3.5"></i> Bộ đề:
                                </span>
                                <div class="relative flex-1 min-w-0">
                                    <select onchange="grammarDrillView.setDeckFilter(this.value)" class="w-full text-xs font-medium bg-white border border-pink-200/80 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-pink-400 cursor-pointer truncate">
                                        <option value="all" ${currentDeck === 'all' ? 'selected' : ''}>📖 Tất cả bộ đề</option>
                                        ${availableDecks.map(d => `<option value="${d.id}" ${currentDeck === d.id ? 'selected' : ''}>${d.title}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Danh sách câu hỏi -->
                <div class="space-y-5">
                    ${filtered.length === 0 ? `
                        <div class="bg-white p-12 text-center rounded-3xl border border-pink-100 text-slate-400 shadow-sm flex flex-col items-center">
                            <div class="w-14 h-14 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center mb-3">
                                <i data-lucide="inbox" class="w-7 h-7"></i>
                            </div>
                            <p class="text-base font-semibold text-slate-700">Không tìm thấy câu hỏi phù hợp bộ lọc</p>
                            <p class="text-xs text-slate-400 mt-1">Hãy chuyển bộ lọc hoặc tạo thêm câu hỏi trong mục Quản lý đề.</p>
                            <button onclick="navigateTo('grammarManager')" class="mt-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer">
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
                                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-xs font-bold text-pink-600 bg-pink-50 border border-pink-200/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                                            <span class="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                            <span>Câu ${idx + 1}</span>
                                        </span>
                                        <span class="text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                                            isMC 
                                                ? 'bg-purple-50 text-purple-700 border-purple-200/70' 
                                                : 'bg-amber-50 text-amber-700 border-amber-200/70'
                                        }">
                                            <span class="w-1.5 h-1.5 rounded-full ${isMC ? 'bg-purple-500' : 'bg-amber-500'}"></span>
                                            <span>${isMC ? 'Trắc nghiệm' : 'Tự luận'}</span>
                                        </span>
                                    </div>

                                    ${state.submitted ? `
                                        <span class="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${state.isCorrect ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200' : 'bg-rose-100/80 text-rose-800 border border-rose-200'}">
                                            <i data-lucide="${state.isCorrect ? 'check-circle' : 'x-circle'}" class="w-3.5 h-3.5"></i>
                                            <span>${state.isCorrect ? 'Đúng' : 'Sai'}</span>
                                        </span>
                                    ` : ''}
                                </div>

                                <div class="text-slate-800 font-medium text-sm sm:text-base leading-relaxed mt-2">
                                    ${this.formatMarkdown(q.question)}
                                </div>

                                ${isMC ? `
                                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        ${(q.options || []).map(opt => {
                                            const letter = opt.trim().charAt(0).toUpperCase();
                                            const optionContent = opt.replace(/^[A-D]\.\s*/i, '');
                                            const isSelected = state.answer === letter;
                                            
                                            let optionStyles = "border-slate-200 hover:border-pink-300 hover:bg-pink-50/40 text-slate-700 bg-white";
                                            let badgeStyles = isSelected ? "bg-pink-500 text-white" : "border border-slate-300 bg-slate-50 text-slate-600";
                                            let icon = `<span class="text-xs font-bold">${letter}</span>`;

                                            if (state.submitted) {
                                                if (letter === q.correctAnswer) {
                                                    optionStyles = "border-emerald-400 bg-emerald-50/90 text-emerald-900 font-semibold ring-1 ring-emerald-400";
                                                    badgeStyles = "bg-emerald-500 text-white";
                                                    icon = `<i data-lucide="check" class="w-3.5 h-3.5"></i>`;
                                                } else if (isSelected && !state.isCorrect) {
                                                    optionStyles = "border-rose-300 bg-rose-50 text-rose-800 line-through";
                                                    badgeStyles = "bg-rose-500 text-white";
                                                    icon = `<i data-lucide="x" class="w-3.5 h-3.5"></i>`;
                                                } else {
                                                    optionStyles = "border-slate-200 bg-white text-slate-600";
                                                }
                                            }

                                            return `
                                                <button onclick="grammarDrillView.selectMC('${q.id}', '${letter}')" ${state.submitted ? 'disabled' : ''} class="w-full text-left p-3 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center gap-3 cursor-pointer ${optionStyles}">
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
                                            <input type="text" id="drill-written-${q.id}" value="${state.answer || ''}" ${state.submitted ? 'disabled' : ''} placeholder="${q.placeholder || 'Nhập câu trả lời...'}" onkeydown="if(event.key==='Enter') grammarDrillView.submitWritten('${q.id}')" class="flex-1 text-sm px-3.5 py-2.5 rounded-2xl border ${state.submitted ? (state.isCorrect ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900' : 'border-rose-400 bg-rose-50/50 text-rose-900') : 'border-pink-200 focus:border-pink-400'} transition font-medium focus:outline-none">
                                            ${!state.submitted ? `
                                                <button onclick="grammarDrillView.submitWritten('${q.id}')" class="px-5 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition shrink-0 shadow-sm shadow-pink-200 flex items-center justify-center gap-1.5 cursor-pointer">
                                                    <i data-lucide="check" class="w-4 h-4"></i>
                                                    <span>Kiểm tra</span>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `}

                                ${state.submitted ? (() => {
                                    // Bóc tách chính xác các thành phần từ explanation
                                    const parsed = this.splitExplanationParts(q.explanation);

                                    // Lấy đúng phần giải thích (đã loại bỏ phần nghĩa đáp án và lý do)
                                    const generalExplanation = parsed.general || (q.optionsMeanings?.length ? q.explanation : '');
                                    
                                    // Ưu tiên mảng optionsMeanings đã được parse sạch
                                    const finalMeanings = (q.optionsMeanings && q.optionsMeanings.length > 0) 
                                        ? q.optionsMeanings 
                                        : parsed.optionsMeanings;

                                    // Lấy lý do chuẩn
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
                                            <button onclick="grammarDrillView.retryQuestion('${q.id}')" class="text-xs text-pink-500 hover:text-pink-700 font-semibold underline flex items-center gap-1 cursor-pointer">
                                                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                                <span>Làm lại câu này</span>
                                            </button>
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
        appState.grammarFilterTopic = 'all';
        appState.grammarFilterDeck = 'all';
        this.refresh();
    },

    setTopicFilter(topicId) {
        appState.grammarFilterTopic = topicId;
        appState.grammarFilterDeck = 'all';
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