const vocabularySetsView = {
    // State cục bộ cho tìm kiếm và bộ lọc bảng từ
    searchQuery: '',
    selectedLevelFilter: 'all',

    // Helper lấy tiến độ SRS từ LocalStorage
    getSRSStorage() {
        try {
            return JSON.parse(localStorage.getItem('bong_toeic_srs_progress') || '{}');
        } catch (e) {
            return {};
        }
    },

    // Helper lấy cấp độ chính xác của 1 từ (ưu tiên từ localStorage)
    getWordLevel(setId, wordObj, srsData = null) {
        if (!srsData) srsData = this.getSRSStorage();
        const wordText = (wordObj.en || wordObj.word || '').trim();
        const key = `${setId}_${wordText}`;
        if (srsData[key] && srsData[key].level !== undefined) {
            return srsData[key].level;
        }
        return wordObj.srsLevel !== undefined ? wordObj.srsLevel : (wordObj.level || 0);
    },

    // Chuyển Tab
    switchTab(tab) {
        appState.vocabTab = tab;
        appState.openedFolderId = null;
        appState.viewingSetId = null;
        navigateTo('vocabularySets');
    },

    // Mở thư mục
    openFolder(folderId) {
        appState.openedFolderId = folderId;
        appState.viewingSetId = null;
        navigateTo('vocabularySets');
    },

    // Quay lại danh sách thư mục
    backToFolders() {
        appState.openedFolderId = null;
        appState.viewingSetId = null;
        navigateTo('vocabularySets');
    },

    // Mở xem chi tiết bảng từ vựng của 1 bộ đề
    viewSetWords(setId) {
        appState.viewingSetId = setId;
        this.searchQuery = '';
        this.selectedLevelFilter = 'all';
        navigateTo('vocabularySets');
    },

    // Thoát chế độ xem bảng từ vựng về lại danh sách bộ đề
    backToFolderSets() {
        appState.viewingSetId = null;
        this.searchQuery = '';
        this.selectedLevelFilter = 'all';
        navigateTo('vocabularySets');
    },

    // Xử lý sự kiện tìm kiếm & lọc cấp độ
    onSearchChange(val) {
        this.searchQuery = val.trim().toLowerCase();
        this.renderTableBody();
    },

    onLevelFilterChange(val) {
        this.selectedLevelFilter = val;
        this.renderTableBody();
    },

    // Bắt đầu học SRS Flashcard
    startLearning(setId) {
        const found = findVocabularySetById(setId);
        if (!found || !found.set.words || found.set.words.length === 0) {
            showToast('Bộ từ này chưa có từ vựng nào!');
            return;
        }
        appState.srsSource = appState.vocabTab || 'community';
        if (found.folder) appState.srsFolderId = found.folder.id;
        appState.srsSetId = setId;
        appState.currentStudySet = null; // Reset để studyVocabularyView nạp mới và lọc hạn ôn tập chính xác
        appState.forceReviewAll = false;
        appState.currentCardIndex = 0;
        navigateTo('studyVocabulary', { setId: setId });
    },

    // ==========================================
    // CỬA SỔ MODAL: TẠO / SỬA THƯ MỤC
    // ==========================================
    openFolderModal(folderId = null) {
        const folders = getMyFolders();
        const editingFolder = folderId ? folders.find(f => f.id === folderId) : null;
        const title = editingFolder ? 'Chỉnh sửa Thư mục' : 'Tạo Thư mục mới';
        const currentName = editingFolder ? editingFolder.name : '';

        const html = `
            <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-pink-100 space-y-4">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center space-x-2">
                        <i data-lucide="folder-plus" class="w-5 h-5 text-pink-500"></i>
                        <span>${title}</span>
                    </h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 p-1">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-600 uppercase">Tên thư mục</label>
                    <input id="input-folder-name" type="text" value="${currentName}" placeholder="Ví dụ: Luyện thi TOEIC cấp tốc, Từ vựng Part 7..." class="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm">
                </div>
                <div class="flex justify-end space-x-2 pt-2">
                    <button onclick="closeModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-semibold">Hủy</button>
                    <button onclick="vocabularySetsView.saveFolder('${folderId || ''}')" class="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-pink-200 transition">Lưu lại</button>
                </div>
            </div>
        `;
        openModal(html);
    },

    saveFolder(folderId) {
        const input = document.getElementById('input-folder-name');
        const name = input ? input.value.trim() : '';
        if (!name) {
            alert('Vui lòng nhập tên thư mục!');
            return;
        }

        const folders = getMyFolders();

        const isDuplicate = folders.some(f => 
            f.id !== folderId && f.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (isDuplicate) {
            alert(`Thư mục mang tên "${name}" đã tồn tại! Vui lòng chọn tên khác.`);
            return;
        }

        if (folderId) {
            const f = folders.find(item => item.id === folderId);
            if (f) f.name = name;
            showToast('Đã đổi tên thư mục thành công!');
        } else {
            folders.push({
                id: 'my-f-' + Date.now(),
                name: name,
                createdBy: window.currentUser ? window.currentUser.uid : null, // Gắn ID người tạo
                sets: []
            });
            showToast('Tạo thư mục mới thành công!');
        }
        saveMyFolders(folders);
        closeModal();
        navigateTo('vocabularySets');
    },

    deleteFolder(folderId) {
        if (!confirm('Bạn có chắc chắn muốn xóa thư mục này và toàn bộ các bộ từ bên trong?')) return;
        let folders = getMyFolders();
        folders = folders.filter(f => f.id !== folderId);
        saveMyFolders(folders);
        if (appState.openedFolderId === folderId) {
            appState.openedFolderId = null;
        }
        showToast('Đã xóa thư mục!');
        navigateTo('vocabularySets');
    },

    // ==========================================
    // CỬA SỔ MODAL: TẠO / SỬA BỘ TỪ
    // ==========================================
    openSetModal(targetFolderId = null, editingSetId = null) {
        const folders = getMyFolders();
        if (folders.length === 0) {
            alert('Bạn cần tạo ít nhất 1 thư mục trước khi thêm bộ từ!');
            this.openFolderModal();
            return;
        }

        let currentFolderId = targetFolderId || (folders[0] ? folders[0].id : '');
        let currentSetName = '';
        let wordsText = '';

        if (editingSetId) {
            for (const f of folders) {
                const s = (f.sets || []).find(x => x.id === editingSetId);
                if (s) {
                    currentFolderId = f.id;
                    currentSetName = s.name;
                    wordsText = (s.words || []).map(w => 
                        `${w.en || ''} : ${w.vn || ''} : ${w.pronun || ''} : ${w.type || ''} : ${w.example || ''} : ${w.synonym || ''}`
                    ).join('\n');
                    break;
                }
            }
        }

        const folderOptions = folders.map(f => `
            <option value="${f.id}" ${f.id === currentFolderId ? 'selected' : ''}>${f.name}</option>
        `).join('');

        const isEdit = !!editingSetId;
        const html = `
            <div class="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100 space-y-4">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center space-x-2">
                        <i data-lucide="book-plus" class="w-5 h-5 text-pink-500"></i>
                        <span>${isEdit ? 'Chỉnh sửa Bộ từ vựng' : 'Thêm Bộ từ vựng mới'}</span>
                    </h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 p-1">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase">Chọn Thư mục chứa</label>
                        <select id="modal-select-folder" class="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm">
                            ${folderOptions}
                        </select>
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-600 uppercase">Tên Bộ từ vựng</label>
                        <input id="modal-input-setname" type="text" value="${currentSetName}" placeholder="Ví dụ: Test 1 - Part 5, 50 từ vựng cốt lõi..." class="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm">
                    </div>
                </div>

                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label class="block text-xs font-bold text-slate-600 uppercase">Dữ liệu danh sách từ vựng</label>
                        <span class="text-[11px] text-pink-500 font-semibold">Mỗi từ một dòng</span>
                    </div>
                    <div class="bg-pink-50/60 p-2.5 rounded-xl border border-pink-200 text-xs text-pink-800 font-mono">
                        Cú pháp nhập: <span class="font-bold">Từ vựng : nghĩa tiếng việt : phiên âm : loại từ : ví dụ : từ đồng nghĩa</span>
                    </div>
                    <textarea id="modal-textarea-words" rows="7" placeholder="Aboriginal : nguyên sơ, nguyên thủy : /æbə'rɪdʒənəl/ : a : The Aboriginal people have a deep connection : Indigenous
Compliance : sự tuân thủ : /kəmˈplaɪəns/ : n : Must be in compliance with laws : Obedience" class="w-full px-4 py-3 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm font-mono text-xs leading-relaxed">${wordsText}</textarea>
                </div>

                <div class="flex justify-end space-x-2 pt-2 border-t border-pink-100">
                    <button onclick="closeModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-semibold">Hủy</button>
                    <button onclick="vocabularySetsView.saveSet('${editingSetId || ''}')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-pink-200 transition">Lưu bộ từ</button>
                </div>
            </div>
        `;
        openModal(html);
    },

    saveSet(editingSetId) {
        const folderSelect = document.getElementById('modal-select-folder');
        const setNameInput = document.getElementById('modal-input-setname');
        const wordsTextarea = document.getElementById('modal-textarea-words');

        const folderId = folderSelect ? folderSelect.value : '';
        const setName = setNameInput ? setNameInput.value.trim() : '';
        const rawWords = wordsTextarea ? wordsTextarea.value.trim() : '';

        if (!folderId) {
            alert('Vui lòng chọn thư mục!');
            return;
        }
        if (!setName) {
            alert('Vui lòng nhập tên bộ từ vựng!');
            return;
        }

        const folders = getMyFolders();
        const targetFolder = folders.find(f => f.id === folderId);
        if (!targetFolder) {
            alert('Thư mục được chọn không tồn tại!');
            return;
        }

        const isDuplicateSet = (targetFolder.sets || []).some(s => 
            s.id !== editingSetId && s.name.trim().toLowerCase() === setName.toLowerCase()
        );
        if (isDuplicateSet) {
            alert(`Bộ đề mang tên "${setName}" đã tồn tại trong thư mục "${targetFolder.name}"! Vui lòng chọn tên khác.`);
            return;
        }

        const words = [];
        if (rawWords) {
            const lines = rawWords.split('\n');
            lines.forEach(line => {
                const parts = line.split(':').map(p => p.trim());
                if (parts[0]) {
                    words.push({
                        en: parts[0] || '',
                        vn: parts[1] || '',
                        pronun: parts[2] || '',
                        type: parts[3] || 'n',
                        example: parts[4] || '',
                        synonym: parts[5] || '',
                        srsLevel: 0,
                        nextReviewTime: 0
                    });
                }
            });
        }

        if (editingSetId) {
            folders.forEach(f => {
                f.sets = (f.sets || []).filter(s => s.id !== editingSetId);
            });
        }

        targetFolder.sets = targetFolder.sets || [];
        targetFolder.sets.push({
            id: editingSetId || ('my-s-' + Date.now()),
            name: setName,
            createdBy: window.currentUser ? window.currentUser.uid : null, // Gắn ID người tạo
            words: words
        });

        saveMyFolders(folders);
        closeModal();
        showToast(editingSetId ? 'Đã cập nhật bộ từ!' : 'Đã thêm bộ từ mới!');
        appState.openedFolderId = folderId;
        navigateTo('vocabularySets');
    },

    deleteSet(setId) {
        if (!confirm('Bạn có chắc chắn muốn xóa bộ từ vựng này?')) return;
        const folders = getMyFolders();
        folders.forEach(f => {
            f.sets = (f.sets || []).filter(s => s.id !== setId);
        });
        saveMyFolders(folders);
        if (appState.viewingSetId === setId) {
            appState.viewingSetId = null;
        }
        showToast('Đã xóa bộ từ!');
        navigateTo('vocabularySets');
    },

    // Hàm lọc từ vựng theo từ khóa và cấp độ SRS
    getFilteredWords(words) {
        const srsData = this.getSRSStorage();

        return words.filter(w => {
            const currentLevel = this.getWordLevel(appState.viewingSetId, w, srsData);

            // Kiểm tra bộ lọc cấp độ
            if (this.selectedLevelFilter !== 'all') {
                const filterLevelNum = parseInt(this.selectedLevelFilter, 10);
                if (currentLevel !== filterLevelNum) return false;
            }

            // Kiểm tra tìm kiếm từ vựng hoặc nghĩa
            if (this.searchQuery) {
                const en = (w.en || '').toLowerCase();
                const vn = (w.vn || '').toLowerCase();
                if (!en.includes(this.searchQuery) && !vn.includes(this.searchQuery)) {
                    return false;
                }
            }

            return true;
        });
    },

    // Render lại riêng thẻ tbody của bảng từ vựng
    renderTableBody() {
        const tbody = document.getElementById('vocab-table-body');
        const countSpan = document.getElementById('vocab-filtered-count');
        if (!tbody || !appState.viewingSetId) return;

        const found = findVocabularySetById(appState.viewingSetId);
        if (!found) return;

        const words = found.set.words || [];
        const filteredWords = this.getFilteredWords(words);
        const srsData = this.getSRSStorage();

        if (countSpan) {
            countSpan.innerText = `Hiển thị: ${filteredWords.length}/${words.length} từ`;
        }

        if (filteredWords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-10 text-slate-400">Không tìm thấy từ vựng phù hợp với bộ lọc.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredWords.map((w, index) => {
            const lvl = this.getWordLevel(appState.viewingSetId, w, srsData);
            const levelBadge = lvl === 0 
                ? `<span class="inline-flex items-center justify-center whitespace-nowrap min-w-[65px] px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Cấp 0</span>`
                : `<span class="inline-flex items-center justify-center whitespace-nowrap min-w-[65px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-pink-600 border border-pink-200">Cấp ${lvl}</span>`;

            return `
                <tr class="hover:bg-pink-50/40 transition border-b border-pink-100/60 text-sm">
                    <td class="px-4 py-3 text-center font-bold text-pink-500">${index + 1}</td>
                    <td class="px-4 py-3 font-bold text-slate-800">${w.en || ''}</td>
                    <td class="px-4 py-3 font-mono text-xs text-pink-500">${w.pronun || ''}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">${w.type || '-'}</span>
                    </td>
                    <td class="px-4 py-3 text-slate-700 font-medium">${w.vn || ''}</td>
                    <td class="px-4 py-3 text-center whitespace-nowrap w-24">${levelBadge}</td>
                    <td class="px-4 py-3 text-xs text-slate-600 italic">${w.example || '-'}</td>
                    <td class="px-4 py-3 text-xs text-slate-600">${w.synonym || '-'}</td>
                </tr>
            `;
        }).join('');
    },

    // ==========================================
    // RENDER GIAO DIỆN CHÍNH
    // ==========================================
    render() {
        const isCommunity = appState.vocabTab === 'community';
        const currentFolders = isCommunity ? getCommunityFolders() : getMyFolders();
        const srsData = this.getSRSStorage();

        // ----------------------------------------------------
        // TRƯỜNG HỢP 1: XEM BẢNG TỪ VỰNG CHI TIẾT CỦA 1 BỘ ĐỀ (8 CỘT)
        // ----------------------------------------------------
        if (appState.viewingSetId) {
            const found = findVocabularySetById(appState.viewingSetId);
            if (!found) {
                return `<div class="p-8 text-center text-slate-500">Bộ từ không tồn tại. <button onclick="vocabularySetsView.backToFolderSets()" class="text-pink-600 underline">Quay lại</button></div>`;
            }
            const { folder, set } = found;
            const words = set.words || [];
            const filteredWords = this.getFilteredWords(words);

            const rowsHtml = filteredWords.length > 0 ? filteredWords.map((w, index) => {
                const lvl = this.getWordLevel(appState.viewingSetId, w, srsData);
                const levelBadge = lvl === 0 
                    ? `<span class="inline-flex items-center justify-center whitespace-nowrap min-w-[65px] px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Cấp 0</span>`
                    : `<span class="inline-flex items-center justify-center whitespace-nowrap min-w-[65px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-pink-600 border border-pink-200">Cấp ${lvl}</span>`;

                return `
                    <tr class="hover:bg-pink-50/40 transition border-b border-pink-100/60 text-sm">
                        <td class="px-4 py-3 text-center font-bold text-pink-500">${index + 1}</td>
                        <td class="px-4 py-3 font-bold text-slate-800">${w.en || ''}</td>
                        <td class="px-4 py-3 font-mono text-xs text-pink-500">${w.pronun || ''}</td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">${w.type || '-'}</span>
                        </td>
                        <td class="px-4 py-3 text-slate-700 font-medium">${w.vn || ''}</td>
                        <td class="px-4 py-3 text-center whitespace-nowrap w-24">${levelBadge}</td>
                        <td class="px-4 py-3 text-xs text-slate-600 italic">${w.example || '-'}</td>
                        <td class="px-4 py-3 text-xs text-slate-600">${w.synonym || '-'}</td>
                    </tr>
                `;
            }).join('') : `
                <tr>
                    <td colspan="8" class="text-center py-10 text-slate-400">Không tìm thấy từ vựng nào phù hợp.</td>
                </tr>
            `;

            return `
                <div class="space-y-6">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div class="flex items-center space-x-3">
                            <button onclick="vocabularySetsView.backToFolderSets()" class="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 transition">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-xs bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full font-semibold">${folder.name}</span>
                                    <h1 class="text-2xl font-bold text-slate-800">${set.name}</h1>
                                </div>
                                <p class="text-xs text-slate-500 mt-0.5" id="vocab-filtered-count">Hiển thị: ${filteredWords.length}/${words.length} từ</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2">
                            ${!isCommunity ? `
                                <button onclick="vocabularySetsView.openSetModal('${folder.id}', '${set.id}')" class="px-4 py-2 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 text-pink-600 text-xs font-semibold transition flex items-center space-x-1.5">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i><span>Sửa bộ từ</span>
                                </button>
                            ` : ''}
                            <button onclick="vocabularySetsView.startLearning('${set.id}')" class="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 transition flex items-center space-x-1.5">
                                <i data-lucide="brain" class="w-4 h-4"></i><span>Học ngay (SRS)</span>
                            </button>
                        </div>
                    </div>

                    <!-- KHU VỰC TÌM KIẾM VÀ BỘ LỌC CẤP ĐỘ -->
                    <div class="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm shadow-pink-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div class="relative w-full sm:w-80">
                            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                            <input 
                                type="text" 
                                placeholder="Tìm từ tiếng Anh hoặc nghĩa..." 
                                value="${this.searchQuery}"
                                oninput="vocabularySetsView.onSearchChange(this.value)" 
                                class="w-full pl-9 pr-4 py-2 text-sm bg-[#fffafb] border border-pink-200/70 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-400 focus:bg-white transition"
                            />
                        </div>

                        <div class="flex items-center space-x-2 w-full sm:w-auto">
                            <label class="text-xs font-bold text-slate-600 whitespace-nowrap">Cấp độ SRS:</label>
                            <select 
                                onchange="vocabularySetsView.onLevelFilterChange(this.value)" 
                                class="w-full sm:w-auto bg-[#fffafb] border border-pink-200/70 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-400"
                            >
                                <option value="all" ${this.selectedLevelFilter === 'all' ? 'selected' : ''}>Tất cả cấp độ</option>
                                <option value="0" ${this.selectedLevelFilter === '0' ? 'selected' : ''}>Cấp 0</option>
                                ${[1, 2, 3, 4, 5, 6, 7, 8].map(lvl => `
                                    <option value="${lvl}" ${this.selectedLevelFilter === String(lvl) ? 'selected' : ''}>Cấp ${lvl}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- BẢNG TỪ VỰNG 8 CỘT (CÓ THÊM CỘT CẤP ĐỘ) -->
                    <div class="bg-white rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-pink-50/70 text-slate-700 text-xs uppercase font-extrabold tracking-wider border-b border-pink-100">
                                        <th class="px-4 py-3.5 text-center w-12">STT</th>
                                        <th class="px-4 py-3.5">Từ vựng (EN)</th>
                                        <th class="px-4 py-3.5">Phiên âm</th>
                                        <th class="px-4 py-3.5 text-center">Loại từ</th>
                                        <th class="px-4 py-3.5">Nghĩa tiếng Việt</th>
                                        <th class="px-4 py-3.5 text-center whitespace-nowrap w-24">Cấp độ</th>
                                        <th class="px-4 py-3.5">Ví dụ</th>
                                        <th class="px-4 py-3.5">Từ đồng nghĩa</th>
                                    </tr>
                                </thead>
                                <tbody id="vocab-table-body">
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        // ----------------------------------------------------
        // TRƯỜNG HỢP 2: XEM DANH SÁCH BỘ TỪ BÊN TRONG 1 THƯ MỤC
        // ----------------------------------------------------
        if (appState.openedFolderId) {
            const folder = currentFolders.find(f => f.id === appState.openedFolderId);
            if (!folder) {
                return `<div class="p-6">Thư mục không tồn tại. <button onclick="vocabularySetsView.backToFolders()" class="text-pink-600 underline">Quay lại</button></div>`;
            }

            const setsHtml = folder.sets && folder.sets.length > 0 
                ? folder.sets.map(set => {
                    const total = (set.words || []).length;
                    const mastered = (set.words || []).filter(w => this.getWordLevel(set.id, w, srsData) > 0).length;

                    return `
                        <div class="p-4 rounded-2xl bg-white hover:bg-pink-50/30 transition border border-pink-100 shadow-sm shadow-pink-50/50 flex flex-col justify-between space-y-3">
                            <div class="flex items-start justify-between cursor-pointer" onclick="vocabularySetsView.viewSetWords('${set.id}')">
                                <div>
                                    <p class="font-bold text-slate-800 hover:text-pink-600 transition flex items-center space-x-1.5">
                                        <span>${set.name}</span>
                                        <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-400"></i>
                                    </p>
                                    <span class="text-xs text-slate-500 mt-1 inline-block">${total} từ • Đã thuộc: ${mastered}/${total}</span>
                                </div>
                                <span class="text-xs text-pink-600 font-semibold bg-pink-50 px-2 py-1 rounded-lg border border-pink-100">Xem từ vựng</span>
                            </div>

                            <div class="flex items-center justify-between pt-2 border-t border-pink-50">
                                <div class="flex items-center space-x-1">
                                    ${!isCommunity ? `
                                        <button onclick="vocabularySetsView.openSetModal('${folder.id}', '${set.id}')" title="Chỉnh sửa" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                                            <i data-lucide="edit" class="w-4 h-4"></i>
                                        </button>
                                        <button onclick="vocabularySetsView.deleteSet('${set.id}')" title="Xóa" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    ` : '<span class="text-[11px] text-slate-400">Bộ từ mặc định</span>'}
                                </div>
                                <button onclick="vocabularySetsView.startLearning('${set.id}')" class="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white rounded-xl text-xs font-semibold shadow-sm shadow-pink-200 transition">
                                    Học ngay
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')
                : `<div class="col-span-2 text-slate-400 text-center py-10">Chưa có bộ từ nào trong thư mục này.</div>`;

            return `
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <button onclick="vocabularySetsView.backToFolders()" class="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 transition">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div>
                                <h1 class="text-2xl font-bold text-slate-800">${folder.name}</h1>
                                <p class="text-xs text-slate-500">${(folder.sets || []).length} bộ từ vựng (Nhấp vào bộ đề để xem bảng từ)</p>
                            </div>
                        </div>

                        ${!isCommunity ? `
                            <button onclick="vocabularySetsView.openSetModal('${folder.id}')" class="bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 transition shadow-md shadow-pink-200">
                                <i data-lucide="plus" class="w-4 h-4"></i><span>+ Thêm bộ từ</span>
                            </button>
                        ` : ''}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${setsHtml}
                    </div>
                </div>
            `;
        }

        // ----------------------------------------------------
        // TRƯỜNG HỢP 3: DANH SÁCH THƯ MỤC BAN ĐẦU
        // ----------------------------------------------------
        const foldersHtml = currentFolders.length > 0 
            ? currentFolders.map(folder => `
                <div class="bg-white rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 p-6 hover:shadow-md hover:border-pink-300 transition group flex flex-col justify-between">
                    <div>
                        <div class="flex items-start justify-between">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 to-pink-50 text-pink-500 border border-pink-200/60 flex items-center justify-center font-bold">
                                <i data-lucide="folder" class="w-6 h-6"></i>
                            </div>
                            ${!isCommunity ? `
                                <div class="flex items-center space-x-1">
                                    <button onclick="vocabularySetsView.openFolderModal('${folder.id}')" title="Sửa tên" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                                        <i data-lucide="edit" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="vocabularySetsView.deleteFolder('${folder.id}')" title="Xóa thư mục" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <div class="mt-4">
                            <h3 class="font-bold text-slate-800 text-lg group-hover:text-pink-600 transition">${folder.name}</h3>
                            <p class="text-xs text-slate-400 mt-1">${(folder.sets || []).length} bộ từ vựng bên trong</p>
                        </div>
                    </div>

                    <div onclick="vocabularySetsView.openFolder('${folder.id}')" class="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-pink-600 font-semibold cursor-pointer hover:text-pink-700">
                        <span>Mở thư mục</span>
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </div>
                </div>
            `).join('')
            : `<div class="col-span-3 text-center py-12 text-slate-400">Chưa có thư mục nào. Bấm "+ Tạo thư mục" để bắt đầu!</div>`;

        return `
            <div class="space-y-6">
                <!-- Header & Tabs & Actions -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Quản lý Thư mục & Bộ từ vựng</h1>
                        <p class="text-sm text-slate-500">Tổ chức từ vựng khoa học theo cấu trúc Thư mục ➔ Bộ từ ➔ Bảng từ vựng.</p>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Chuyển Tab -->
                        <div class="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
                            <button onclick="vocabularySetsView.switchTab('community')" class="px-3.5 py-2 rounded-xl transition ${isCommunity ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
                                Bộ từ cộng đồng
                            </button>
                            <button onclick="vocabularySetsView.switchTab('my-vocab')" class="px-3.5 py-2 rounded-xl transition ${!isCommunity ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
                                Bộ từ của tôi
                            </button>
                        </div>

                        ${!isCommunity ? `
                            <button onclick="vocabularySetsView.openFolderModal()" class="bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 font-semibold px-3.5 py-2 rounded-2xl text-xs flex items-center space-x-1.5 transition">
                                <i data-lucide="folder-plus" class="w-4 h-4"></i><span>+ Tạo thư mục</span>
                            </button>
                            <button onclick="vocabularySetsView.openSetModal()" class="bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-semibold px-3.5 py-2 rounded-2xl text-xs flex items-center space-x-1.5 transition shadow-sm shadow-pink-200">
                                <i data-lucide="plus-circle" class="w-4 h-4"></i><span>+ Thêm bộ từ</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Danh sách thư mục -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${foldersHtml}
                </div>
            </div>
        `;
    },

    afterRender() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }
};