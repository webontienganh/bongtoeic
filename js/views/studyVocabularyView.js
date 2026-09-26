const studyVocabularyView = {
    timer: null,
    matchState: null,
    isFlipped: false,

    // Quản lý trạng thái kết quả phiên làm bài hiện tại
    sessionResult: {
        isCompleted: false,
        mastered: [], // Danh sách các từ trả lời đúng/đã thuộc
        unmastered: [] // Danh sách các từ trả lời sai/chưa thuộc
    },

    // Hàm tiện ích xáo trộn mảng ngẫu nhiên (Fisher-Yates Shuffle)
    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // Cấu hình khoảng thời gian ôn tập theo SRS (đơn vị: mili-giây)
    SRS_INTERVALS: [
        0,                                   // Cấp 0: Chưa ôn lần nào / Ôn ngay
        1 * 60 * 60 * 1000,                  // Cấp 1: 1 giờ
        12 * 60 * 60 * 1000,                 // Cấp 2: 12 giờ
        24 * 60 * 60 * 1000,                 // Cấp 3: 1 ngày
        3 * 24 * 60 * 60 * 1000,             // Cấp 4: 3 ngày
        7 * 24 * 60 * 60 * 1000,             // Cấp 5: 1 tuần
        14 * 24 * 60 * 60 * 1000,            // Cấp 6: 2 tuần
        30 * 24 * 60 * 60 * 1000,            // Cấp 7: 1 tháng
        60 * 24 * 60 * 60 * 1000             // Cấp 8: 2 tháng
    ],

    getFoldersBySource(source) {
        if (source === 'my-vocab') {
            return (typeof getMyFolders === 'function') ? getMyFolders() : (appState.myFolders || []);
        }
        return (typeof getCommunityFolders === 'function') ? getCommunityFolders() : (appState.folders || []);
    },

    isWordDue(word) {
        const lvl = word.level !== undefined ? word.level : (word.srsLevel || 0);
        if (lvl === 0) return true;
        if (!word.nextReviewTime) return true;
        return Date.now() >= word.nextReviewTime;
    },

    getSRSStorage() {
        try {
            return JSON.parse(localStorage.getItem('bong_toeic_srs_progress') || '{}');
        } catch (e) {
            return {};
        }
    },

    saveSRSStorage(data) {
        try {
            localStorage.setItem('bong_toeic_srs_progress', JSON.stringify(data));
        } catch (e) {
            console.error('Không thể lưu tiến trình SRS:', e);
        }
    },

    getCurrentContext() {
        const source = appState.srsSource || appState.vocabTab || 'community';
        const folders = this.getFoldersBySource(source);

        let selectedFolder = folders.find(f => f.id === appState.srsFolderId);
        if (!selectedFolder && folders.length > 0) {
            selectedFolder = folders[0];
            appState.srsFolderId = selectedFolder.id;
        }

        const sets = selectedFolder?.sets || [];
        let selectedSet = sets.find(s => s.id === appState.srsSetId);
        if (!selectedSet && sets.length > 0) {
            selectedSet = sets[0];
            appState.srsSetId = selectedSet.id;
        }

        const savedSRS = this.getSRSStorage();

        if (selectedSet) {
            appState.currentStudySet = selectedSet;
            if (Array.isArray(selectedSet.words)) {
                appState.allWords = selectedSet.words.map(w => {
                    const wordText = (w.en || w.word || '').trim();
                    const key = `${selectedSet.id}_${wordText}`;
                    const savedWordSRS = savedSRS[key] || {};

                    const level = savedWordSRS.level !== undefined 
                        ? savedWordSRS.level 
                        : (w.srsLevel !== undefined ? w.srsLevel : (w.level || 0));
                    
                    const nextReviewTime = savedWordSRS.nextReviewTime !== undefined 
                        ? savedWordSRS.nextReviewTime 
                        : (w.nextReviewTime || 0);

                    w.srsLevel = level;
                    w.nextReviewTime = nextReviewTime;

                    return {
                        word: wordText,
                        phonetic: (w.pronun || w.phonetic || '').trim(),
                        type: (w.type || 'n').trim(),
                        meaning: (w.vn || w.meaning || '').trim(),
                        example: (w.example || '').trim(),
                        synonym: (w.synonym || '').trim(),
                        level: level,
                        nextReviewTime: nextReviewTime,
                        ref: w
                    };
                });
            }
        }

        return { source, folders, selectedFolder, sets, selectedSet };
    },

    render() {
        if (!appState.currentStudyMode) appState.currentStudyMode = 'flashcard';
        if (!appState.vocabLimit) appState.vocabLimit = 20;
        if (appState.flashcardInverted === undefined) appState.flashcardInverted = false;
        if (!appState.quizSubMode) appState.quizSubMode = 'word-meaning';

        const { source, folders, selectedFolder, sets, selectedSet } = this.getCurrentContext();

        const allWords = appState.allWords || [];
        const dueWords = allWords.filter(w => this.isWordDue(w));
        const dueCount = dueWords.length;
        const masteredCount = allWords.filter(w => (w.level || 0) > 0).length;
        const totalVocab = allWords.length;
        const percentage = totalVocab > 0 ? Math.round((masteredCount / totalVocab) * 100) : 0;

        // XỬ LÝ LỖI HẾT TỪ ĐẾN HẠN:
        // Nếu không còn từ nào đến hạn và phiên chưa hoàn thành thì dọn dẹp flashcards ngay
        if (dueCount === 0 && !this.sessionResult.isCompleted) {
            appState.flashcards = [];
            appState.currentCardIndex = 0;
        }

        // Xáo trộn ngẫu nhiên từ vựng khi khởi tạo lượt ôn tập
        if (!this.sessionResult.isCompleted && (!appState.flashcards || appState.flashcards.length === 0) && dueCount > 0) {
            let randomizedPool = this.shuffleArray(dueWords);
            if (appState.currentStudyMode !== 'matching') {
                randomizedPool = randomizedPool.slice(0, appState.vocabLimit);
            }
            appState.flashcards = randomizedPool;
            appState.currentCardIndex = 0;
        }

        const modes = [
            { id: 'flashcard', label: 'Flashcard', icon: 'layers' },
            { id: 'quiz', label: 'Trắc nghiệm', icon: 'check-square' },
            { id: 'matching', label: 'Từ nối (60s)', icon: 'zap' },
            { id: 'typing', label: 'Gõ từ', icon: 'keyboard' },
            { id: 'listening', label: 'Nghe viết', icon: 'headphones' },
            { id: 'partofspeech', label: 'Từ loại', icon: 'tag' },
        ];

        return `
            <div class="space-y-6">
                <!-- Header & Thanh tiến độ (Màu hồng theo file Ngữ pháp) -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900">Luyện tập từ vựng (SRS Spaced Repetition)</h1>
                        <p class="text-sm text-slate-500">Tối ưu hoá khả năng ghi nhớ qua chu kỳ 9 cấp độ và 6 phương pháp thông minh.</p>
                    </div>
                    <div class="flex items-center space-x-3 bg-white border border-pink-100 px-4 py-2 rounded-2xl shadow-sm shadow-pink-50/50">
                        <span class="text-xs font-semibold text-slate-500">Đã thuộc: <strong class="text-pink-600 font-bold">${masteredCount} / ${totalVocab}</strong></span>
                        <div class="w-24 bg-pink-100/60 h-2 rounded-full overflow-hidden">
                            <div class="bg-gradient-to-r from-pink-500 to-rose-400 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs font-bold text-pink-600">${percentage}%</span>
                    </div>
                </div>

                <!-- Bộ lọc thông số -->
                <div class="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm shadow-pink-50 space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <!-- Nguồn bộ từ -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">Nguồn bộ từ vựng</label>
                            <select onchange="studyVocabularyView.onSourceChange(this.value)" class="w-full bg-[#fffafb] border border-pink-200/70 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-300 font-medium text-slate-700">
                                <option value="community" ${source === 'community' ? 'selected' : ''}>🌐 Cộng đồng</option>
                                <option value="my-vocab" ${source === 'my-vocab' ? 'selected' : ''}>👤 Của tôi</option>
                            </select>
                        </div>

                        <!-- Thư mục -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">Thư mục</label>
                            <select onchange="studyVocabularyView.onFolderChange(this.value)" class="w-full bg-[#fffafb] border border-pink-200/70 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-300 text-slate-700 font-medium">
                                ${folders.map(f => `<option value="${f.id}" ${f.id === selectedFolder?.id ? 'selected' : ''}>${f.name}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Bộ từ vựng -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">Bộ từ vựng</label>
                            <select onchange="studyVocabularyView.onSetChange(this.value)" class="w-full bg-[#fffafb] border border-pink-200/70 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-300 text-slate-700 font-medium">
                                ${sets.map(s => `<option value="${s.id}" ${s.id === selectedSet?.id ? 'selected' : ''}>${s.name} (${(s.words || []).length || 0} từ)</option>`).join('')}
                            </select>
                        </div>

                        <!-- Bộ lọc số lượng từ -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">
                                Số lượng ôn ${appState.currentStudyMode === 'matching' ? '<span class="text-pink-500">(Cố định 10)</span>' : ''}
                            </label>
                            <select onchange="studyVocabularyView.onLimitChange(this.value)" ${appState.currentStudyMode === 'matching' ? 'disabled' : ''} class="w-full bg-[#fffafb] border border-pink-200/70 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-300 disabled:opacity-50 font-medium text-slate-700">
                                ${[10, 20, 50, 100, 200].map(n => `<option value="${n}" ${appState.vocabLimit === n ? 'selected' : ''}>${n} từ</option>`).join('')}
                            </select>
                        </div>

                        <!-- Hạn ôn tập hôm nay -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1">Hạn ôn tập hôm nay</label>
                            <div class="flex items-center justify-between bg-pink-50 border border-pink-200 px-3 py-2 rounded-2xl text-pink-800 text-sm font-bold">
                                <span class="text-xs">Đến hạn:</span>
                                <span class="bg-pink-500 text-white px-2.5 py-0.5 rounded-xl text-xs font-bold shadow-xs">${dueCount} từ</span>
                            </div>
                        </div>
                    </div>

                    <!-- 6 Chế độ học tập -->
                    <div class="pt-3 border-t border-pink-50">
                        <label class="block text-xs font-semibold text-slate-600 mb-2">Chọn Chế độ học tập (6 chế độ)</label>

                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            ${modes.map(m => {
                                const isActive = appState.currentStudyMode === m.id;
                                const activeClass = isActive 
                                    ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white border-pink-500 shadow-md shadow-pink-200 ring-2 ring-pink-300' 
                                    : 'bg-pink-50/60 hover:bg-pink-100 text-pink-900 border-pink-200/70';
                                return `
                                    <button onclick="studyVocabularyView.selectMode('${m.id}')" class="p-3 border rounded-2xl text-center transition group ${activeClass}">
                                        <i data-lucide="${m.icon}" class="w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : 'text-pink-500'}"></i>
                                        <span class="text-xs font-bold block">${m.label}</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Khu vực làm bài chính hoặc Hiển thị Bảng kết quả -->
                <div class="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm shadow-pink-50/50 relative min-h-[440px] flex flex-col justify-center">
                    ${this.sessionResult.isCompleted 
                        ? this.renderResultSummary() 
                        : this.renderMainArena(dueCount, allWords)}
                </div>
            </div>
        `;
    },

    renderMainArena(dueCount, allWords) {
        if (!allWords || allWords.length === 0) {
            return `<div class="text-center text-slate-500 font-semibold">Bộ từ này hiện chưa có danh sách từ vựng.</div>`;
        }

        // Kiểm tra lập tức: Nếu không còn từ nào đến hạn
        if (dueCount === 0 || (!appState.flashcards || appState.flashcards.length === 0)) {
            return `
                <div class="text-center p-8 max-w-lg mx-auto flex flex-col items-center">
                    <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                        <i data-lucide="check-circle" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">Chưa có từ nào đến hạn ôn!</h3>
                    <p class="text-sm text-slate-500">Tất cả từ vựng trong bộ này đều đang trong chu kỳ ghi nhớ tốt. Hãy quay lại sau khi đến hạn ôn tập.</p>
                </div>
            `;
        }

        const flashcards = appState.flashcards;
        const card = flashcards[appState.currentCardIndex];
        if (!card) {
            return `
                <div class="text-center p-8 max-w-lg mx-auto flex flex-col items-center">
                    <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                        <i data-lucide="check-circle" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">Chưa có từ nào đến hạn ôn!</h3>
                    <p class="text-sm text-slate-500">Tất cả từ vựng trong bộ này đều đang trong chu kỳ ghi nhớ tốt. Hãy quay lại sau khi đến hạn ôn tập.</p>
                </div>
            `;
        }

        switch (appState.currentStudyMode) {
            case 'flashcard':
                return this.renderFlashcardArena(card, flashcards.length);
            case 'quiz':
                return this.renderQuizArena(card, flashcards);
            case 'matching':
                return this.renderMatchingArena(allWords);
            case 'typing':
                return this.renderTypingArena(card, flashcards.length);
            case 'listening':
                return this.renderListeningArena(card, flashcards.length);
            case 'partofspeech':
                return this.renderPartOfSpeechArena(card, flashcards.length);
            default:
                return '';
        }
    },

    // ============================================
    // BẢNG KẾT QUẢ SAU KHI HOÀN THÀNH LƯỢT ÔN
    // ============================================
    renderResultSummary() {
        const { mastered, unmastered } = this.sessionResult;
        const total = mastered.length + unmastered.length;

        return `
            <div class="w-full max-w-3xl mx-auto space-y-6">
                <!-- Thống kê chung -->
                <div class="text-center">
                    <div class="inline-flex p-3 rounded-full bg-pink-50 text-pink-500 mb-2 border border-pink-100">
                        <i data-lucide="award" class="w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900">Hoàn thành lượt ôn tập!</h2>
                    <p class="text-sm text-slate-500">Bạn đã hoàn thành đủ số lượng từ đặt ra cho lượt này.</p>
                </div>

                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="bg-pink-50/40 p-4 rounded-2xl border border-pink-100">
                        <span class="text-xs text-slate-500 font-bold uppercase">Tổng số từ</span>
                        <div class="text-2xl font-black text-slate-800">${total}</div>
                    </div>
                    <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                        <span class="text-xs text-emerald-700 font-bold uppercase">Đã thuộc</span>
                        <div class="text-2xl font-black text-emerald-600">${mastered.length}</div>
                    </div>
                    <div class="bg-rose-50 p-4 rounded-2xl border border-rose-200">
                        <span class="text-xs text-rose-700 font-bold uppercase">Chưa thuộc</span>
                        <div class="text-2xl font-black text-rose-600">${unmastered.length}</div>
                    </div>
                </div>

                <!-- Bảng danh sách phân loại chi tiết -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Cột: Đã thuộc -->
                    <div class="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-4 flex flex-col h-[320px]">
                        <div class="flex items-center justify-between pb-3 mb-2 border-b border-emerald-100">
                            <span class="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> Từ đã nhớ (${mastered.length})
                            </span>
                        </div>
                        <div class="overflow-y-auto space-y-2 pr-1 flex-1">
                            ${mastered.length === 0 ? '<p class="text-xs text-slate-400 italic text-center py-8">Chưa có từ nào ở nhóm này.</p>' : ''}
                            ${mastered.map(item => `
                                <div class="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs flex items-center justify-between">
                                    <div>
                                        <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                                            <span>${item.word}</span>
                                            <span class="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">SRS +1</span>
                                        </div>
                                        <div class="text-xs text-slate-500">${item.meaning}</div>
                                    </div>
                                    <button onclick="studyVocabularyView.speak('${item.word}')" class="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-pink-600 transition">
                                        <i data-lucide="volume-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Cột: Chưa thuộc -->
                    <div class="border border-rose-200 bg-rose-50/20 rounded-2xl p-4 flex flex-col h-[320px]">
                        <div class="flex items-center justify-between pb-3 mb-2 border-b border-rose-100">
                            <span class="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                                <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600"></i> Từ cần ôn lại (${unmastered.length})
                            </span>
                        </div>
                        <div class="overflow-y-auto space-y-2 pr-1 flex-1">
                            ${unmastered.length === 0 ? '<p class="text-xs text-slate-400 italic text-center py-8">Tuyệt vời! Không có từ nào bị sai.</p>' : ''}
                            ${unmastered.map(item => `
                                <div class="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs flex items-center justify-between">
                                    <div>
                                        <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                                            <span>${item.word}</span>
                                            <span class="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-mono">Cấp 0</span>
                                        </div>
                                        <div class="text-xs text-slate-500">${item.meaning}</div>
                                    </div>
                                    <button onclick="studyVocabularyView.speak('${item.word}')" class="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-pink-600 transition">
                                        <i data-lucide="volume-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Các nút hành động cuối phiên -->
                <div class="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    ${unmastered.length > 0 ? `
                        <button onclick="studyVocabularyView.retryUnmastered()" class="w-full sm:w-1/2 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold rounded-2xl border border-pink-200 transition flex items-center justify-center space-x-2">
                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                            <span>Chỉ ôn lại ${unmastered.length} từ chưa thuộc</span>
                        </button>
                    ` : ''}
                    <button onclick="studyVocabularyView.resetStudySession()" class="w-full ${unmastered.length > 0 ? 'sm:w-1/2' : 'max-w-xs mx-auto'} py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white font-bold rounded-2xl shadow-md shadow-pink-200 transition flex items-center justify-center space-x-2">
                        <i data-lucide="play" class="w-4 h-4 fill-current"></i>
                        <span>Bắt đầu lượt mới (Ngẫu nhiên)</span>
                    </button>
                </div>
            </div>
        `;
    },

    retryUnmastered() {
        if (!this.sessionResult.unmastered || this.sessionResult.unmastered.length === 0) return;
        appState.flashcards = this.shuffleArray(this.sessionResult.unmastered);
        appState.currentCardIndex = 0;
        this.sessionResult = { isCompleted: false, mastered: [], unmastered: [] };
        this.refreshView();
    },

    resetStudySession() {
        this.sessionResult = { isCompleted: false, mastered: [], unmastered: [] };
        appState.flashcards = [];
        appState.currentCardIndex = 0;
        this.refreshView();
    },

    // 1. Chế độ Flashcard
    renderFlashcardArena(card, total) {
        const isInverted = !!appState.flashcardInverted;
        const frontText = isInverted ? card.meaning : `${card.word} <span class="text-xs font-normal opacity-80">(${card.type})</span>`;
        const backText = isInverted ? `${card.word} <span class="text-xs font-normal opacity-80">(${card.type})</span>` : card.meaning;
        const englishSideIsFront = !isInverted;

        return `
            <div class="flex flex-col items-center w-full">
                <div class="flex items-center justify-between w-full max-w-xl mb-3 text-xs text-slate-500">
                    <span>Thẻ ${appState.currentCardIndex + 1}/${total} • SRS Cấp ${card.level || 0}</span>
                    <button onclick="studyVocabularyView.toggleFlashcardInvert()" class="flex items-center space-x-1 text-pink-600 hover:text-pink-700 font-bold bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-100">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                        <span>${isInverted ? 'Nghĩa -> Từ (Đang đảo)' : 'Từ -> Nghĩa (Mặc định)'}</span>
                    </button>
                </div>

                <div class="w-full max-w-xl h-64 cursor-pointer my-2 [perspective:1000px]" onclick="studyVocabularyView.flipCard()">
                    <div id="flashcard-inner" class="w-full h-full relative transition-all duration-500 [transform-style:preserve-3d]">
                        <!-- Mặt trước -->
                        <div class="absolute inset-0 bg-gradient-to-tr from-pink-500 via-rose-400 to-pink-400 text-white rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg shadow-pink-200 [backface-visibility:hidden]">
                            <span class="text-xs uppercase tracking-widest text-pink-100 mb-2 font-semibold">${isInverted ? 'Nghĩa tiếng Việt' : 'Từ vựng'}</span>
                            <div class="text-3xl font-extrabold flex items-center justify-center gap-2">
                                <span>${frontText}</span>
                                ${englishSideIsFront ? `
                                    <button onclick="event.stopPropagation(); studyVocabularyView.speak('${card.word}')" class="p-2 bg-white/20 hover:bg-white/30 rounded-full transition">
                                        <i data-lucide="volume-2" class="w-5 h-5"></i>
                                    </button>
                                ` : ''}
                            </div>
                            ${englishSideIsFront ? `<p class="text-sm text-pink-100 mt-1 font-mono">${card.phonetic}</p>` : ''}
                            <p class="text-xs text-pink-100/80 mt-6">[Space] hoặc click để lật thẻ</p>
                        </div>
                        <!-- Mặt sau -->
                        <div class="absolute inset-0 bg-slate-900 text-white rounded-3xl p-6 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                            <span class="text-xs uppercase tracking-widest text-pink-300 mb-2 font-semibold">${isInverted ? 'Từ vựng tiếng Anh' : 'Nghĩa tiếng Việt'}</span>
                            <div class="text-2xl font-bold flex items-center justify-center gap-2">
                                <span>${backText}</span>
                                ${!englishSideIsFront ? `
                                    <button onclick="event.stopPropagation(); studyVocabularyView.speak('${card.word}')" class="p-2 bg-white/20 hover:bg-white/30 rounded-full transition">
                                        <i data-lucide="volume-2" class="w-5 h-5"></i>
                                    </button>
                                ` : ''}
                            </div>
                            <p class="text-xs text-slate-300 italic mt-3 max-w-sm">"${card.example || ''}"</p>
                        </div>
                    </div>
                </div>

                <div class="flex items-center space-x-4 w-full max-w-xl mt-4">
                    <button onclick="studyVocabularyView.answer(false)" class="flex-1 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold rounded-2xl border border-pink-200 transition flex items-center justify-center space-x-2">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i>
                        <span>Chưa thuộc (← Về Cấp 0)</span>
                    </button>
                    <button onclick="studyVocabularyView.answer(true)" class="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-bold rounded-2xl transition shadow-md shadow-pink-200 flex items-center justify-center space-x-2">
                        <span>Thuộc (→ Tăng cấp)</span>
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // 2. Chế độ Trắc nghiệm
    renderQuizArena(card, flashcards) {
        const subModes = [
            { id: 'word-meaning', label: 'Từ -> Nghĩa' },
            { id: 'meaning-word', label: 'Nghĩa -> Từ' },
            { id: 'context', label: 'Ngữ cảnh' },
            { id: 'synonym', label: 'Từ đồng nghĩa' }
        ];

        let question = '';
        let correctAnswer = '';
        let options = [];

        if (appState.quizSubMode === 'word-meaning') {
            question = `<span class="text-3xl font-extrabold text-slate-900">${card.word}</span> <span class="text-sm font-semibold text-pink-500">(${card.type})</span>`;
            correctAnswer = card.meaning;
            options = this.generateOptions(correctAnswer, flashcards.map(f => f.meaning));
        } else if (appState.quizSubMode === 'meaning-word') {
            question = `<span class="text-2xl font-bold text-slate-900">${card.meaning}</span>`;
            correctAnswer = card.word;
            options = this.generateOptions(correctAnswer, flashcards.map(f => f.word));
        } else if (appState.quizSubMode === 'context') {
            const sentence = card.example ? card.example.replace(new RegExp(card.word, 'gi'), '_____') : 'I need to _____ carefully.';
            question = `<span class="text-lg font-medium text-slate-800">"${sentence}"</span>`;
            correctAnswer = card.word;
            options = this.generateOptions(correctAnswer, flashcards.map(f => f.word));
        } else if (appState.quizSubMode === 'synonym') {
            question = `Tìm từ đồng nghĩa với: <strong class="text-2xl text-pink-600">${card.word}</strong>`;
            correctAnswer = card.synonym || card.word;
            options = this.generateOptions(correctAnswer, flashcards.map(f => f.synonym).filter(Boolean));
            if (options.length < 4) {
                options = this.generateOptions(correctAnswer, flashcards.map(f => f.word));
            }
        }

        return `
            <div class="w-full max-w-xl mx-auto flex flex-col items-center">
                <div class="flex items-center space-x-2 bg-pink-50/70 border border-pink-100 p-1.5 rounded-2xl mb-6">
                    ${subModes.map(sm => `
                        <button onclick="studyVocabularyView.changeQuizSubMode('${sm.id}')" class="px-3 py-1.5 text-xs font-bold rounded-xl transition ${appState.quizSubMode === sm.id ? 'bg-pink-500 text-white shadow-xs' : 'text-slate-600 hover:text-pink-600'}">
                            ${sm.label}
                        </button>
                    `).join('')}
                </div>

                <div class="text-center mb-6">
                    <p class="text-xs text-pink-400 font-bold uppercase tracking-wider mb-2">Thẻ ${appState.currentCardIndex + 1}/${flashcards.length}</p>
                    <div>${question}</div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    ${options.map((opt, idx) => `
                        <button onclick="studyVocabularyView.checkQuizAnswer('${opt.replace(/'/g, "\\'")}', '${correctAnswer.replace(/'/g, "\\'")}', this)" class="p-4 rounded-2xl border border-pink-100 bg-[#fffafb] hover:bg-pink-50/60 hover:border-pink-300 text-slate-800 font-semibold text-sm text-left transition flex items-center">
                            <span class="inline-block w-6 h-6 rounded-lg bg-pink-100/70 border border-pink-200 text-pink-700 text-center leading-5 text-xs font-bold mr-3 shrink-0">${String.fromCharCode(65 + idx)}</span>
                            <span>${opt}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // 3. Chế độ Từ nối
    renderMatchingArena(allWords) {
        if (!this.matchState || !this.matchState.isStarted) {
            return `
                <div class="text-center p-8 max-w-md mx-auto flex flex-col items-center">
                    <div class="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-4 border border-pink-200">
                        <i data-lucide="zap" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-slate-900 mb-2">Thử thách Nối từ (60s)</h3>
                    <p class="text-xs text-slate-500 mb-6 leading-relaxed">
                        • Cố định 10 cặp từ vựng lấy ngẫu nhiên từ bộ đã chọn.<br>
                        • Bạn có tối đa 3 lần chọn sai.<br>
                        • Thời gian chạy ngược 60 giây. Từ chưa chọn kịp sẽ bị hạ về Cấp 0.
                    </p>
                    <button onclick="studyVocabularyView.startMatchingGame()" class="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-bold rounded-2xl shadow-md shadow-pink-200 transition flex items-center justify-center space-x-2">
                        <i data-lucide="play" class="w-4 h-4 fill-current"></i>
                        <span>Bắt đầu thử thách</span>
                    </button>
                </div>
            `;
        }

        const state = this.matchState;
        return `
            <div class="w-full max-w-2xl mx-auto flex flex-col items-center">
                <div class="flex items-center justify-between w-full mb-4 bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                    <div class="flex items-center space-x-2">
                        <i data-lucide="timer" class="w-4 h-4 text-amber-500"></i>
                        <span class="font-bold text-sm text-slate-700">Thời gian: <strong id="match-timer" class="text-pink-600 font-mono text-base">${state.timeLeft}s</strong></span>
                    </div>
                    <div class="text-sm font-semibold text-slate-600">
                        Sai: <strong class="text-rose-600">${state.mistakes}</strong>/3 lần
                    </div>
                    <div class="text-sm font-semibold text-slate-600">
                        Ghép đúng: <strong class="text-emerald-600">${state.matchedPairs}</strong>/10
                    </div>
                </div>

                ${state.isFinished ? `
                    <div class="text-center p-8 bg-pink-50/60 rounded-3xl w-full border border-pink-100">
                        <h3 class="text-xl font-bold ${state.mistakes >= 3 || state.timeLeft === 0 ? 'text-rose-600' : 'text-emerald-600'} mb-2">
                            ${state.mistakes >= 3 ? 'Đã hết 3 lượt chọn sai!' : state.timeLeft === 0 ? 'Hết giờ (60s)!' : 'Xuất sắc! Đã hoàn thành tất cả 10 từ!'}
                        </h3>
                        <p class="text-sm text-slate-600 mb-4">Các từ chưa ghép hoàn tất đã tự động đưa về Cấp 0 để bạn ôn lại.</p>
                        <button onclick="studyVocabularyView.finishMatchingSession()" class="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-sm shadow-pink-200">
                            Xem bảng kết quả
                        </button>
                    </div>
                ` : `
                    <div class="grid grid-cols-2 gap-4 w-full">
                        <div class="space-y-2">
                            ${state.enWords.map(item => `
                                <button onclick="studyVocabularyView.selectMatchItem('en', '${item.id}')" class="w-full p-3 rounded-2xl border text-sm font-bold text-slate-700 transition ${state.matchedIds.includes(item.id) ? 'opacity-30 pointer-events-none bg-slate-100 border-slate-200' : state.selectedEn === item.id ? 'border-pink-500 bg-pink-100 ring-2 ring-pink-400' : 'border-pink-100 bg-[#fffafb] hover:bg-pink-50/50'}">
                                    ${item.text}
                                </button>
                            `).join('')}
                        </div>
                        <div class="space-y-2">
                            ${state.vnWords.map(item => `
                                <button onclick="studyVocabularyView.selectMatchItem('vn', '${item.id}')" class="w-full p-3 rounded-2xl border text-sm font-bold text-slate-700 transition ${state.matchedIds.includes(item.id) ? 'opacity-30 pointer-events-none bg-slate-100 border-slate-200' : state.selectedVn === item.id ? 'border-pink-500 bg-pink-100 ring-2 ring-pink-400' : 'border-pink-100 bg-[#fffafb] hover:bg-pink-50/50'}">
                                    ${item.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `}
            </div>
        `;
    },

    // 4. Chế độ Gõ từ
    renderTypingArena(card, total) {
        return `
            <div class="w-full max-w-md mx-auto flex flex-col items-center">
                <span class="text-xs font-semibold text-slate-400 mb-2">Thẻ ${appState.currentCardIndex + 1}/${total}</span>
                <p class="text-xs uppercase text-pink-500 font-bold mb-1">Nghĩa tiếng Việt</p>
                <h2 class="text-3xl font-extrabold text-slate-900 mb-6">${card.meaning}</h2>

                <div class="w-full relative mb-3">
                    <input id="typing-input" type="text" autocomplete="off" placeholder="Gõ từ tiếng Anh vào đây..." oninput="studyVocabularyView.onTypingCheck(this.value, '${card.word.replace(/'/g, "\\'")}')" class="w-full text-center text-xl font-bold py-3.5 px-4 bg-[#fffafb] border-2 border-pink-200 focus:border-pink-500 rounded-2xl outline-hidden transition">
                </div>

                <div id="typing-feedback" class="h-6 text-sm font-bold text-slate-500">
                    Bắt đầu gõ ký tự đầu tiên...
                </div>
            </div>
        `;
    },

    // 5. Chế độ Nghe viết
    renderListeningArena(card, total) {
        return `
            <div class="w-full max-w-md mx-auto flex flex-col items-center">
                <span class="text-xs font-semibold text-slate-400 mb-2">Thẻ ${appState.currentCardIndex + 1}/${total}</span>
                <button onclick="studyVocabularyView.speak('${card.word.replace(/'/g, "\\'")}')" class="p-5 bg-gradient-to-tr from-pink-500 to-rose-400 hover:opacity-95 text-white rounded-full shadow-lg shadow-pink-200 mb-3 transition transform active:scale-95">
                    <i data-lucide="volume-2" class="w-8 h-8"></i>
                </button>
                <p class="text-xs text-slate-500 font-medium mb-6">Bấm loa để nghe lại (Không có gợi ý)</p>

                <div class="w-full space-y-3">
                    <input id="listen-input" type="text" autocomplete="off" placeholder="Gõ từ bạn nghe được..." onkeydown="if(event.key === 'Enter') studyVocabularyView.submitListening('${card.word.replace(/'/g, "\\'")}')" class="w-full text-center text-xl font-bold py-3.5 px-4 bg-[#fffafb] border-2 border-pink-200 focus:border-pink-500 rounded-2xl outline-hidden transition">
                    <button onclick="studyVocabularyView.submitListening('${card.word.replace(/'/g, "\\'")}')" class="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-bold rounded-2xl shadow-md shadow-pink-200 transition">
                        Kiểm tra kết quả
                    </button>
                </div>
                <div id="listen-feedback" class="mt-3 text-sm font-bold min-h-[20px]"></div>
            </div>
        `;
    },

    // 6. Chế độ Từ loại
    renderPartOfSpeechArena(card, total) {
        const types = ['noun', 'verb', 'adjective', 'adverb'];
        const normalizedTarget = (card.type || 'noun').toLowerCase();
        let targetType = 'noun';
        if (normalizedTarget.includes('v')) targetType = 'verb';
        else if (normalizedTarget.includes('adj')) targetType = 'adjective';
        else if (normalizedTarget.includes('adv')) targetType = 'adverb';

        return `
            <div class="w-full max-w-md mx-auto flex flex-col items-center">
                <span class="text-xs font-semibold text-slate-400 mb-2">Thẻ ${appState.currentCardIndex + 1}/${total}</span>
                <p class="text-xs text-pink-500 uppercase tracking-widest font-bold mb-1">Xác định từ loại</p>
                <h2 class="text-4xl font-extrabold text-slate-900 mb-2">${card.word}</h2>
                <p class="text-sm text-slate-500 mb-6">${card.meaning}</p>

                <div class="grid grid-cols-2 gap-3 w-full">
                    ${types.map(t => `
                        <button onclick="studyVocabularyView.checkPartOfSpeech('${t}', '${targetType}', this)" class="p-4 rounded-2xl border border-pink-100 bg-[#fffafb] hover:bg-pink-50/60 hover:border-pink-300 text-slate-800 font-bold capitalize transition">
                            ${t}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    },

    toggleFlashcardInvert() {
        appState.flashcardInverted = !appState.flashcardInverted;
        this.refreshView();
    },

    flipCard() {
        const inner = document.getElementById('flashcard-inner');
        if (inner) {
            this.isFlipped = !this.isFlipped;
            inner.style.transform = this.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';

            const card = appState.flashcards[appState.currentCardIndex];
            if (card) {
                if (appState.flashcardInverted && this.isFlipped) {
                    this.speak(card.word);
                } else if (!appState.flashcardInverted && !this.isFlipped) {
                    this.speak(card.word);
                }
            }
        }
    },

    bindKeyboard() {
        window.onkeydown = (e) => {
            if (appState.currentStudyMode !== 'flashcard' || this.sessionResult.isCompleted) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.flipCard();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.answer(false);
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.answer(true);
            }
        };
    },

    startMatchingGame() {
        clearInterval(this.timer);
        const sourcePool = appState.allWords && appState.allWords.length > 0 ? appState.allWords : (appState.flashcards || []);
        const sample = this.shuffleArray(sourcePool).slice(0, 10);
        const enWords = this.shuffleArray(sample.map(c => ({ id: c.word, text: c.word })));
        const vnWords = this.shuffleArray(sample.map(c => ({ id: c.word, text: c.meaning })));

        this.sessionResult = { isCompleted: false, mastered: [], unmastered: [] };

        this.matchState = {
            sample,
            enWords,
            vnWords,
            selectedEn: null,
            selectedVn: null,
            matchedIds: [],
            mistakes: 0,
            matchedPairs: 0,
            timeLeft: 60,
            isStarted: true,
            isFinished: false
        };

        this.timer = setInterval(() => {
            if (!this.matchState || this.matchState.isFinished) return;
            this.matchState.timeLeft--;
            const timerEl = document.getElementById('match-timer');
            if (timerEl) timerEl.innerText = `${this.matchState.timeLeft}s`;

            if (this.matchState.timeLeft <= 0) {
                clearInterval(this.timer);
                this.matchState.isFinished = true;
                this.matchState.sample.forEach(c => {
                    if (!this.matchState.matchedIds.includes(c.word)) {
                        this.updateWordSRS(c, false);
                    }
                });
                this.refreshView();
            }
        }, 1000);

        this.refreshView();
    },

    finishMatchingSession() {
        if (!this.matchState) return;
        const matched = [];
        const unmastered = [];

        this.matchState.sample.forEach(item => {
            if (this.matchState.matchedIds.includes(item.word)) {
                matched.push(item);
            } else {
                unmastered.push(item);
            }
        });

        this.sessionResult = {
            isCompleted: true,
            mastered: matched,
            unmastered: unmastered
        };
        this.refreshView();
    },

    selectMatchItem(type, id) {
        if (!this.matchState || this.matchState.isFinished) return;

        if (type === 'en') {
            this.matchState.selectedEn = id;
        } else {
            this.matchState.selectedVn = id;
        }

        if (this.matchState.selectedEn && this.matchState.selectedVn) {
            if (this.matchState.selectedEn === this.matchState.selectedVn) {
                this.matchState.matchedIds.push(this.matchState.selectedEn);
                this.matchState.matchedPairs++;

                const matchedWord = this.matchState.sample.find(c => c.word === this.matchState.selectedEn);
                if (matchedWord) this.updateWordSRS(matchedWord, true);

                this.matchState.selectedEn = null;
                this.matchState.selectedVn = null;

                if (this.matchState.matchedPairs === this.matchState.sample.length) {
                    clearInterval(this.timer);
                    this.matchState.isFinished = true;
                }
            } else {
                this.matchState.mistakes++;
                this.matchState.selectedEn = null;
                this.matchState.selectedVn = null;

                if (this.matchState.mistakes >= 3) {
                    clearInterval(this.timer);
                    this.matchState.isFinished = true;
                    this.matchState.sample.forEach(c => {
                        if (!this.matchState.matchedIds.includes(c.word)) {
                            this.updateWordSRS(c, false);
                        }
                    });
                }
            }
        }
        this.refreshView();
    },

    onTypingCheck(val, targetWord) {
        const feedbackEl = document.getElementById('typing-feedback');
        const inputEl = document.getElementById('typing-input');
        if (!feedbackEl || !inputEl) return;

        const currentVal = val.trim().toLowerCase();
        const target = targetWord.trim().toLowerCase();

        if (currentVal.length === 0) {
            feedbackEl.innerText = 'Bắt đầu gõ ký tự đầu tiên...';
            feedbackEl.className = 'h-6 text-sm font-bold text-slate-500';
            return;
        }

        if (target.startsWith(currentVal)) {
            if (currentVal === target) {
                feedbackEl.innerText = 'Chính xác hoàn toàn! Đang chuyển thẻ...';
                feedbackEl.className = 'h-6 text-sm font-bold text-emerald-600';
                inputEl.classList.add('border-emerald-500', 'bg-emerald-50');
                setTimeout(() => this.answer(true), 700);
            } else {
                feedbackEl.innerText = 'Bạn đang đi đúng hướng';
                feedbackEl.className = 'h-6 text-sm font-bold text-emerald-600';
            }
        } else {
            feedbackEl.innerText = 'Bạn đang đi sai hướng';
            feedbackEl.className = 'h-6 text-sm font-bold text-rose-600';
        }
    },

    submitListening(targetWord) {
        const input = document.getElementById('listen-input');
        const feedback = document.getElementById('listen-feedback');
        if (!input || !feedback) return;

        if (input.value.trim().toLowerCase() === targetWord.trim().toLowerCase()) {
            feedback.innerText = 'Chính xác!';
            feedback.className = 'mt-3 text-sm font-bold text-emerald-600';
            setTimeout(() => this.answer(true), 700);
        } else {
            feedback.innerText = `Chưa đúng! Đáp án đúng là: "${targetWord}"`;
            feedback.className = 'mt-3 text-sm font-bold text-rose-600';
            setTimeout(() => this.answer(false), 1400);
        }
    },

    checkQuizAnswer(selected, correct, btn) {
        const isRight = selected.trim().toLowerCase() === correct.trim().toLowerCase();
        if (isRight) {
            btn.classList.add('bg-emerald-500', 'text-white', 'border-emerald-500');
        } else {
            btn.classList.add('bg-rose-500', 'text-white', 'border-rose-500');
        }
        setTimeout(() => this.answer(isRight), 650);
    },

    checkPartOfSpeech(selected, correct, btn) {
        const isRight = selected === correct;
        if (isRight) {
            btn.classList.add('bg-emerald-500', 'text-white', 'border-emerald-500');
        } else {
            btn.classList.add('bg-rose-500', 'text-white', 'border-rose-500');
        }
        setTimeout(() => this.answer(isRight), 650);
    },

    generateOptions(correct, pool) {
        const filtered = [...new Set(pool.filter(item => item && item !== correct))];
        const randomPicks = this.shuffleArray(filtered).slice(0, 3);
        return this.shuffleArray([correct, ...randomPicks]);
    },

    changeQuizSubMode(subMode) {
        appState.quizSubMode = subMode;
        this.refreshView();
    },

    updateWordSRS(wordObj, isSuccess) {
        if (!wordObj) return;

        if (isSuccess) {
            wordObj.level = Math.min(8, (wordObj.level || 0) + 1);
        } else {
            wordObj.level = 0;
        }

        const interval = this.SRS_INTERVALS[wordObj.level] || 0;
        wordObj.nextReviewTime = Date.now() + interval;

        if (wordObj.ref) {
            wordObj.ref.srsLevel = wordObj.level;
            wordObj.ref.nextReviewTime = wordObj.nextReviewTime;
        }

        const setId = appState.srsSetId || (appState.currentStudySet ? appState.currentStudySet.id : 'default');
        const key = `${setId}_${wordObj.word}`;
        const srsData = this.getSRSStorage();
        srsData[key] = {
            level: wordObj.level,
            nextReviewTime: wordObj.nextReviewTime,
            updatedAt: Date.now()
        };
        this.saveSRSStorage(srsData);

        const source = appState.srsSource || appState.vocabTab || 'community';
        if (source === 'my-vocab' && typeof getMyFolders === 'function' && typeof saveMyFolders === 'function') {
            saveMyFolders(getMyFolders());
        }
        if (window.syncUserDataToCloud) {
            window.syncUserDataToCloud();
        }
    },

    answer(isSuccess) {
        this.isFlipped = false;
        if (!appState.flashcards || appState.flashcards.length === 0) return;

        const card = appState.flashcards[appState.currentCardIndex];
        if (card) {
            this.updateWordSRS(card, isSuccess);

            if (isSuccess) {
                this.sessionResult.mastered.push(card);
            } else {
                this.sessionResult.unmastered.push(card);
            }
        }

        if (appState.currentCardIndex + 1 >= appState.flashcards.length) {
            this.sessionResult.isCompleted = true;
            this.refreshView();
            return;
        }

        appState.currentCardIndex++;
        this.refreshView();
    },

    onLimitChange(limitVal) {
        appState.vocabLimit = parseInt(limitVal, 10);
        this.resetStudySession();
    },

    forceReview() {
        appState.forceReviewAll = true;
        this.resetStudySession();
    },

    // SỬA ĐỔI: Khi chuyển chế độ, reset toàn bộ danh sách flashcards và index về 0
    selectMode(modeId) {
        clearInterval(this.timer);
        appState.currentStudyMode = modeId;
        this.isFlipped = false;
        this.sessionResult = { isCompleted: false, mastered: [], unmastered: [] };
        appState.flashcards = [];
        appState.currentCardIndex = 0;
        if (modeId === 'matching') {
            this.matchState = { isStarted: false };
        }
        this.refreshView();
    },

    onSourceChange(newSource) {
        appState.srsSource = newSource;
        const folders = this.getFoldersBySource(newSource);
        appState.srsFolderId = folders[0]?.id || null;
        appState.srsSetId = folders[0]?.sets?.[0]?.id || null;
        appState.currentStudySet = null;
        appState.forceReviewAll = false;
        this.resetStudySession();
    },

    onFolderChange(folderId) {
        appState.srsFolderId = folderId;
        const folders = this.getFoldersBySource(appState.srsSource || 'community');
        const folder = folders.find(f => f.id === folderId);
        appState.srsSetId = folder?.sets?.[0]?.id || null;
        appState.currentStudySet = null;
        appState.forceReviewAll = false;
        this.resetStudySession();
    },

    onSetChange(setId) {
        appState.srsSetId = setId;
        appState.currentStudySet = null;
        appState.forceReviewAll = false;
        this.resetStudySession();
    },

    refreshView() {
        if (typeof navigateTo === 'function') {
            navigateTo('studyVocabulary');
        } else if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }
    },

    afterRender() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        this.bindKeyboard();

        if (!this.sessionResult.isCompleted) {
            if (appState.currentStudyMode === 'flashcard' && !appState.flashcardInverted && appState.flashcards && appState.flashcards[appState.currentCardIndex]) {
                this.speak(appState.flashcards[appState.currentCardIndex].word);
            }

            if (appState.currentStudyMode === 'listening' && appState.flashcards && appState.flashcards[appState.currentCardIndex]) {
                this.speak(appState.flashcards[appState.currentCardIndex].word);
            }
        }
    }
};