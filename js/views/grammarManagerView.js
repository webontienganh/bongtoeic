// js/views/grammarManagerView.js
const grammarManagerView = {
    // Điều hướng phân cấp trong quản lý
    // appState.grammarTab: 'community' | 'my'
    // appState.grammarOpenedFolderId
    // appState.grammarOpenedTopicId

    switchTab(tab) {
        if (!window.appState) window.appState = {};
        appState.grammarTab = tab;
        appState.grammarOpenedFolderId = null;
        appState.grammarOpenedTopicId = null;
        this.refresh();
    },

    openFolder(folderId) {
        appState.grammarOpenedFolderId = folderId;
        appState.grammarOpenedTopicId = null;
        this.refresh();
    },

    backToFolders() {
        appState.grammarOpenedFolderId = null;
        appState.grammarOpenedTopicId = null;
        this.refresh();
    },

    openTopic(topicId) {
        appState.grammarOpenedTopicId = topicId;
        this.refresh();
    },

    backToTopics() {
        appState.grammarOpenedTopicId = null;
        this.refresh();
    },

    render() {
        if (!window.appState) window.appState = {};
        const isCommunity = (appState.grammarTab || 'community') === 'community';
        const folders = isCommunity ? GrammarStore.getCommunityFolders() : GrammarStore.getMyFolders();
        const allQuestions = GrammarStore.getQuestions();

        // ----------------------------------------------------
        // CẤP 3: XEM CÁC BỘ ĐỀ TRONG CHUYÊN ĐỀ (TOPIC)
        // ----------------------------------------------------
        if (appState.grammarOpenedTopicId && appState.grammarOpenedFolderId) {
            const folder = folders.find(f => f.id === appState.grammarOpenedFolderId);
            const topic = folder ? (folder.topics || []).find(t => t.id === appState.grammarOpenedTopicId) : null;

            if (!topic) {
                return `<div class="p-8 text-center text-slate-400">Chuyên đề không tồn tại. <button onclick="grammarManagerView.backToTopics()" class="text-pink-600 underline">Quay lại</button></div>`;
            }

            const decks = topic.decks || [];

            return `
                <div class="space-y-6 max-w-6xl mx-auto pb-16">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <button onclick="grammarManagerView.backToTopics()" class="p-2.5 rounded-2xl bg-white border border-pink-100 hover:bg-pink-50 text-pink-600 transition shadow-2xs">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs bg-pink-100/80 text-pink-700 px-2.5 py-0.5 rounded-full font-semibold border border-pink-200/50 flex items-center gap-1">
                                        <i data-lucide="folder" class="w-3.5 h-3.5"></i>
                                        <span>${folder.name}</span>
                                    </span>
                                    <span class="text-slate-400">/</span>
                                    <h1 class="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                                        <i data-lucide="bookmark" class="w-5 h-5 text-pink-500"></i>
                                        <span>${topic.name}</span>
                                    </h1>
                                </div>
                                <p class="text-xs text-slate-500 mt-1">Cấp 3: Danh sách các Bộ đề kiểm tra bên trong chuyên đề.</p>
                            </div>
                        </div>

                        ${!isCommunity ? `
                            <div class="flex items-center gap-2">
                                <button onclick="grammarManagerView.openBulkUploadModal('${folder.id}', '${topic.id}')" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white text-xs font-bold transition shadow-md shadow-pink-200 flex items-center gap-1.5">
                                    <i data-lucide="upload" class="w-4 h-4"></i><span>Upload bài tập</span>
                                </button>
                                <button onclick="grammarManagerView.openCreateDeckModal('${topic.id}')" class="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-pink-200">
                                    <i data-lucide="plus" class="w-4 h-4"></i><span>Thêm Bộ đề</span>
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Lưới các Bộ đề -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${decks.length === 0 ? `
                            <div class="col-span-full bg-white p-12 text-center rounded-3xl border border-dashed border-pink-200 text-slate-400 flex flex-col items-center justify-center space-y-2">
                                <div class="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center">
                                    <i data-lucide="folder-open" class="w-6 h-6"></i>
                                </div>
                                <p>Chưa có bộ đề nào trong chuyên đề này. Nhấn "+ Thêm Bộ đề" hoặc "Upload bài tập" để tạo đề mới.</p>
                            </div>
                        ` : decks.map(deck => {
                            const deckQuestions = allQuestions.filter(q => q.deckId === deck.id);
                            const mcCount = deckQuestions.filter(q => q.type === 'multiple_choice').length;
                            const writtenCount = deckQuestions.filter(q => q.type === 'written').length;

                            return `
                                <div class="bg-white border border-pink-100 rounded-3xl p-5 shadow-sm shadow-pink-50/50 hover:border-pink-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
                                    <div>
                                        <div class="flex items-start justify-between gap-2">
                                            <div class="flex items-center space-x-2">
                                                <div class="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                                                    <i data-lucide="layers" class="w-4 h-4"></i>
                                                </div>
                                                <h4 class="font-bold text-slate-900 text-base line-clamp-1">${deck.title}</h4>
                                            </div>
                                            ${!isCommunity ? `
                                                <div class="flex items-center gap-1">
                                                    <button onclick="grammarManagerView.openEditDeckModal('${deck.id}')" title="Sửa tên & bài tập của bộ đề" class="text-slate-300 hover:text-pink-600 p-1.5 rounded-lg hover:bg-pink-50 transition">
                                                        <i data-lucide="pencil" class="w-4 h-4"></i>
                                                    </button>
                                                    <button onclick="grammarManagerView.deleteDeck('${deck.id}')" title="Xóa đề" class="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition">
                                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                    </button>
                                                </div>
                                            ` : ''}
                                        </div>
                                        <p class="text-xs text-slate-500 mt-2 line-clamp-2">${deck.description || 'Không có mô tả'}</p>
                                    </div>

                                    <div class="pt-3 border-t border-pink-50 text-[11px] text-slate-600 flex items-center justify-between">
                                        <span class="px-2.5 py-0.5 rounded-full bg-pink-50 font-bold text-pink-700 border border-pink-100 flex items-center gap-1">
                                            <i data-lucide="file-question" class="w-3 h-3"></i>
                                            <span>${deckQuestions.length} câu</span>
                                        </span>
                                        <span class="text-slate-400">${mcCount} trắc nghiệm • ${writtenCount} tự luận</span>
                                    </div>

                                    <div class="grid grid-cols-2 gap-2 pt-1">
                                        <button onclick="grammarManagerView.startPractice('${deck.id}')" class="px-3 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs shadow-pink-200">
                                            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
                                            <span>Luyện ngay</span>
                                        </button>
                                        <button onclick="grammarManagerView.startExam('${deck.id}')" class="px-3 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-pink-200/50">
                                            <i data-lucide="timer" class="w-3.5 h-3.5 text-pink-600"></i>
                                            <span>Thi thử</span>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // ----------------------------------------------------
        // CẤP 2: XEM DANH SÁCH CHUYÊN ĐỀ (TOPICS) TRONG THƯ MỤC
        // ----------------------------------------------------
        if (appState.grammarOpenedFolderId) {
            const folder = folders.find(f => f.id === appState.grammarOpenedFolderId);
            if (!folder) {
                return `<div class="p-8 text-center text-slate-400">Thư mục không tồn tại. <button onclick="grammarManagerView.backToFolders()" class="text-pink-600 underline">Quay lại</button></div>`;
            }

            const topics = folder.topics || [];

            return `
                <div class="space-y-6 max-w-6xl mx-auto pb-16">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <button onclick="grammarManagerView.backToFolders()" class="p-2.5 rounded-2xl bg-white border border-pink-100 hover:bg-pink-50 text-pink-600 transition shadow-2xs">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div>
                                <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <span class="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
                                        <i data-lucide="${this.getLucideIcon(folder.icon)}" class="w-5 h-5"></i>
                                    </span>
                                    <span>${folder.name}</span>
                                </h1>
                                <p class="text-xs text-slate-500 mt-1">Cấp 2: Các chuyên đề ngữ pháp bên trong thư mục.</p>
                            </div>
                        </div>

                        ${!isCommunity ? `
                            <button onclick="grammarManagerView.openCreateTopicModal('${folder.id}')" class="bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-md shadow-pink-200">
                                <i data-lucide="plus" class="w-4 h-4"></i><span>Thêm Chuyên đề</span>
                            </button>
                        ` : ''}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                        ${topics.length === 0 ? `
                            <div class="col-span-full bg-white p-12 text-center rounded-3xl border border-pink-100 text-slate-400 flex flex-col items-center justify-center space-y-2">
                                <div class="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center">
                                    <i data-lucide="book-open" class="w-6 h-6"></i>
                                </div>
                                <p>Thư mục này chưa có chuyên đề nào. Bấm "+ Thêm Chuyên đề" để tạo cấp thứ 2!</p>
                            </div>
                        ` : topics.map(topic => `
                            <div class="bg-white rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 p-5 hover:border-pink-300 hover:shadow-md transition flex flex-col justify-between space-y-4">
                                <div>
                                    <div class="flex items-start justify-between">
                                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 to-pink-50 text-pink-600 border border-pink-200/50 flex items-center justify-center">
                                            <i data-lucide="book-open-check" class="w-6 h-6"></i>
                                        </div>
                                        ${!isCommunity ? `
                                            <div class="flex items-center gap-1">
                                                <button onclick="grammarManagerView.openEditTopicModal('${folder.id}', '${topic.id}')" title="Sửa chuyên đề" class="p-1.5 text-slate-300 hover:text-pink-600 rounded-lg hover:bg-pink-50 transition">
                                                    <i data-lucide="pencil" class="w-4 h-4"></i>
                                                </button>
                                                <button onclick="grammarManagerView.deleteTopic('${folder.id}', '${topic.id}')" title="Xóa chuyên đề" class="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition">
                                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="mt-3">
                                        <h3 class="font-bold text-slate-800 text-base">${topic.name}</h3>
                                        <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                            <i data-lucide="folder-kanban" class="w-3.5 h-3.5"></i>
                                            <span>${(topic.decks || []).length} bộ đề kiểm tra bên trong</span>
                                        </p>
                                    </div>
                                </div>

                                <button onclick="grammarManagerView.openTopic('${topic.id}')" class="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-pink-100">
                                    <span>Mở chuyên đề</span>
                                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // ----------------------------------------------------
        // CẤP 1: DANH SÁCH THƯ MỤC BAN ĐẦU + CHUYỂN TAB CỘNG ĐỒNG / CÁ NHÂN
        // ----------------------------------------------------
        return `
            <div class="space-y-6 max-w-6xl mx-auto pb-16">
                <div class="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full font-bold border border-pink-200/50">Cấu trúc 3 cấp</span>
                            <span class="text-xs text-slate-400 flex items-center gap-1">
                                <span>Thư mục</span>
                                <i data-lucide="chevron-right" class="w-3 h-3"></i>
                                <span>Chuyên đề</span>
                                <i data-lucide="chevron-right" class="w-3 h-3"></i>
                                <span>Bộ đề</span>
                            </span>
                        </div>
                        <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <i data-lucide="folder-plus" class="w-6 h-6 text-pink-500"></i>
                            <span>Quản Lý Đề Ngữ Pháp</span>
                        </h1>
                        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Phân tách kho đề công cộng và kho đề cá nhân để dễ dàng soạn đề & học tập.</p>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <div class="flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
                            <button onclick="grammarManagerView.switchTab('community')" class="px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${isCommunity ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
                                <i data-lucide="globe" class="w-4 h-4"></i>
                                <span>Kho đề cộng đồng</span>
                            </button>
                            <button onclick="grammarManagerView.switchTab('my')" class="px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${!isCommunity ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
                                <i data-lucide="user" class="w-4 h-4"></i>
                                <span>Bộ đề của tôi</span>
                            </button>
                        </div>

                        ${!isCommunity ? `
                            <button onclick="grammarManagerView.openCreateFolderModal()" class="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition shadow-sm shadow-pink-200 flex items-center gap-1.5">
                                <i data-lucide="folder-plus" class="w-4 h-4"></i><span>Tạo Thư mục</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Danh sách Thư mục lớn -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${folders.length === 0 ? `
                        <div class="col-span-full bg-white p-12 text-center rounded-3xl border border-pink-100 text-slate-400 flex flex-col items-center justify-center space-y-2">
                            <div class="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center">
                                <i data-lucide="folder" class="w-6 h-6"></i>
                            </div>
                            <p>${isCommunity ? 'Kho đề cộng đồng hiện đang trống.' : 'Bạn chưa có thư mục nào trong kho cá nhân. Nhấn "+ Tạo Thư mục" để bắt đầu!'}</p>
                        </div>
                    ` : folders.map(folder => {
                        const topicCount = (folder.topics || []).length;
                        let totalDecks = 0;
                        (folder.topics || []).forEach(t => totalDecks += (t.decks || []).length);
                        const iconName = this.getLucideIcon(folder.icon);

                        return `
                            <div class="bg-white rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 p-6 hover:shadow-md hover:border-pink-300 transition flex flex-col justify-between space-y-4">
                                <div>
                                    <div class="flex items-start justify-between">
                                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 to-pink-50 text-pink-600 border border-pink-200/60 flex items-center justify-center">
                                            <i data-lucide="${iconName}" class="w-6 h-6"></i>
                                        </div>
                                        ${!isCommunity ? `
                                            <div class="flex items-center gap-1">
                                                <button onclick="grammarManagerView.openEditFolderModal('${folder.id}')" title="Sửa thư mục" class="p-1.5 text-slate-300 hover:text-pink-600 rounded-lg hover:bg-pink-50 transition">
                                                    <i data-lucide="pencil" class="w-4 h-4"></i>
                                                </button>
                                                <button onclick="grammarManagerView.deleteFolder('${folder.id}')" title="Xóa thư mục" class="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition">
                                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="mt-4">
                                        <h3 class="font-bold text-slate-800 text-lg">${folder.name}</h3>
                                        <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                            <i data-lucide="folder-kanban" class="w-3.5 h-3.5"></i>
                                            <span>${topicCount} chuyên đề • ${totalDecks} bộ đề</span>
                                        </p>
                                    </div>
                                </div>

                                <div onclick="grammarManagerView.openFolder('${folder.id}')" class="pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-pink-600 font-semibold cursor-pointer hover:text-pink-700">
                                    <span>Mở chuyên đề bên trong</span>
                                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    getLucideIcon(iconKey) {
        switch (iconKey) {
            case 'flame':
            case '🔥':
                return 'flame';
            case 'book-open':
            case '📖':
                return 'book-open';
            case 'target':
            case '🎯':
                return 'target';
            case 'folder':
            case '📁':
            default:
                return 'folder';
        }
    },

    openCreateFolderModal() {
        const html = `
            <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-pink-100 space-y-4">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
                        <i data-lucide="folder-plus" class="w-5 h-5 text-pink-500"></i>
                        <span>Tạo Thư Mục Mới (Cấp 1)</span>
                    </h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Tên thư mục:</label>
                    <input id="input-grammar-folder-name" type="text" placeholder="Ví dụ: Ôn Thi THPT Quốc Gia, TOEIC..." class="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Biểu tượng phân loại:</label>
                    <select id="input-grammar-folder-icon" class="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none">
                        <option value="folder">📁 Thư mục chung</option>
                        <option value="flame">🔥 Trọng tâm / Cấp tốc</option>
                        <option value="book-open">📖 Ngữ pháp nền tảng</option>
                        <option value="target">🎯 Mục tiêu điểm cao</option>
                    </select>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button onclick="closeModal()" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold">Hủy</button>
                    <button onclick="grammarManagerView.saveFolder()" class="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 flex items-center gap-1.5">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Lưu lại</span>
                    </button>
                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    saveFolder() {
        const name = document.getElementById('input-grammar-folder-name')?.value.trim();
        const icon = document.getElementById('input-grammar-folder-icon')?.value || 'folder';
        if (!name) {
            alert('Vui lòng nhập tên thư mục!');
            return;
        }

        const folders = GrammarStore.getMyFolders();
        folders.push({
            id: `gf-${Date.now()}`,
            name,
            icon,
            topics: []
        });
        GrammarStore.saveMyFolders(folders);
        closeModal();
        if (typeof showToast === 'function') showToast(`Đã tạo thư mục "${name}"`);
        this.refresh();
    },

    openEditFolderModal(folderId) {
        const folders = GrammarStore.getMyFolders();
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;

        const html = `
            <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-pink-100 space-y-4">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
                        <i data-lucide="edit-3" class="w-5 h-5 text-pink-500"></i>
                        <span>Chỉnh Sửa Thư Mục (Cấp 1)</span>
                    </h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Tên thư mục:</label>
                    <input id="input-edit-folder-name" type="text" value="${folder.name || ''}" class="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Biểu tượng phân loại:</label>
                    <select id="input-edit-folder-icon" class="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-sm focus:outline-none">
                        <option value="folder" ${folder.icon === 'folder' ? 'selected' : ''}>📁 Thư mục chung</option>
                        <option value="flame" ${folder.icon === 'flame' ? 'selected' : ''}>🔥 Trọng tâm / Cấp tốc</option>
                        <option value="book-open" ${folder.icon === 'book-open' ? 'selected' : ''}>📖 Ngữ pháp nền tảng</option>
                        <option value="target" ${folder.icon === 'target' ? 'selected' : ''}>🎯 Mục tiêu điểm cao</option>
                    </select>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button onclick="closeModal()" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold">Hủy</button>
                    <button onclick="grammarManagerView.updateFolder('${folderId}')" class="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 flex items-center gap-1.5">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Cập nhật</span>
                    </button>
                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    updateFolder(folderId) {
        const name = document.getElementById('input-edit-folder-name')?.value.trim();
        const icon = document.getElementById('input-edit-folder-icon')?.value || 'folder';
        if (!name) {
            alert('Vui lòng nhập tên thư mục!');
            return;
        }

        const folders = GrammarStore.getMyFolders();
        const target = folders.find(f => f.id === folderId);
        if (target) {
            target.name = name;
            target.icon = icon;
            GrammarStore.saveMyFolders(folders);
        }
        closeModal();
        if (typeof showToast === 'function') showToast(`Đã cập nhật thư mục thành "${name}"`);
        this.refresh();
    },

    deleteFolder(folderId) {
        if (!confirm("Xóa thư mục sẽ xóa tất cả chuyên đề và bộ đề bên trong. Tiếp tục?")) return;
        let folders = GrammarStore.getMyFolders().filter(f => f.id !== folderId);
        GrammarStore.saveMyFolders(folders);
        this.refresh();
    },

    openCreateTopicModal(folderId) {
        const html = `
            <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-pink-100 space-y-4">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
                        <i data-lucide="book-plus" class="w-5 h-5 text-pink-500"></i>
                        <span>Thêm Chuyên Đề Mới (Cấp 2)</span>
                    </h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Tên chuyên đề:</label>
                    <input id="input-grammar-topic-name" type="text" placeholder="Ví dụ: Các Thì (Tenses), Mệnh Đề Quan Hệ..." class="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm">
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button onclick="closeModal()" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold">Hủy</button>
                    <button onclick="grammarManagerView.saveTopic('${folderId}')" class="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 flex items-center gap-1.5">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Lưu chuyên đề</span>
                    </button>
                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    saveTopic(folderId) {
        const name = document.getElementById('input-grammar-topic-name')?.value.trim();
        if (!name) {
            alert('Vui lòng nhập tên chuyên đề!');
            return;
        }

        const folders = GrammarStore.getMyFolders();
        const f = folders.find(item => item.id === folderId);
        if (f) {
            f.topics = f.topics || [];
            f.topics.push({
                id: `gt-${Date.now()}`,
                name,
                decks: []
            });
            GrammarStore.saveMyFolders(folders);
        }
        closeModal();
        if (typeof showToast === 'function') showToast(`Đã thêm chuyên đề "${name}"`);
        this.refresh();
    },

    openEditTopicModal(folderId, topicId) {
        const folders = GrammarStore.getMyFolders();
        const folder = folders.find(f => f.id === folderId);
        const topic = folder ? (folder.topics || []).find(t => t.id === topicId) : null;
        if (!topic) return;

        const html = `
            <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-pink-100 space-y-4">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
                        <i data-lucide="edit-3" class="w-5 h-5 text-pink-500"></i>
                        <span>Chỉnh Sửa Chuyên Đề (Cấp 2)</span>
                    </h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Tên chuyên đề:</label>
                    <input id="input-edit-topic-name" type="text" value="${topic.name || ''}" class="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm">
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button onclick="closeModal()" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold">Hủy</button>
                    <button onclick="grammarManagerView.updateTopic('${folderId}', '${topicId}')" class="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 flex items-center gap-1.5">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Cập nhật</span>
                    </button>
                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    updateTopic(folderId, topicId) {
        const name = document.getElementById('input-edit-topic-name')?.value.trim();
        if (!name) {
            alert('Vui lòng nhập tên chuyên đề!');
            return;
        }

        const folders = GrammarStore.getMyFolders();
        const f = folders.find(item => item.id === folderId);
        if (f) {
            const topic = (f.topics || []).find(t => t.id === topicId);
            if (topic) {
                topic.name = name;
                GrammarStore.saveMyFolders(folders);
            }
        }
        closeModal();
        if (typeof showToast === 'function') showToast(`Đã cập nhật chuyên đề thành "${name}"`);
        this.refresh();
    },

    deleteTopic(folderId, topicId) {
        if (!confirm("Xóa chuyên đề sẽ xóa tất cả bộ đề bên trong. Tiếp tục?")) return;
        const folders = GrammarStore.getMyFolders();
        const f = folders.find(item => item.id === folderId);
        if (f) {
            f.topics = (f.topics || []).filter(t => t.id !== topicId);
            GrammarStore.saveMyFolders(folders);
        }
        this.refresh();
    },

    openCreateDeckModal(targetTopicId = null) {
        const html = `
            <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-pink-100 space-y-4">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3">
                    <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
                        <i data-lucide="folder-kanban" class="w-5 h-5 text-pink-500"></i>
                        <span>Tạo Bộ Đề Mới (Cấp 3)</span>
                    </h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Tên bộ đề:</label>
                    <input id="modal-deck-title" type="text" placeholder="Ví dụ: Đề Luyện Tập Thì Hoàn Thành - Số 1..." class="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none text-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Mô tả ngắn gọn:</label>
                    <textarea id="modal-deck-desc" rows="2" placeholder="Ghi chú kiến thức hoặc hướng dẫn làm bài..." class="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none text-xs"></textarea>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button onclick="closeModal()" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold">Hủy</button>
                    <button onclick="grammarManagerView.saveDeck('${targetTopicId}')" class="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 flex items-center gap-1.5">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Tạo bộ đề</span>
                    </button>
                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    saveDeck(topicId) {
        const title = document.getElementById('modal-deck-title')?.value.trim();
        const description = document.getElementById('modal-deck-desc')?.value.trim();

        if (!title) {
            alert('Vui lòng nhập tên bộ đề!');
            return;
        }

        const folders = GrammarStore.getMyFolders();
        for (let f of folders) {
            const t = (f.topics || []).find(x => x.id === topicId);
            if (t) {
                t.decks = t.decks || [];
                t.decks.push({
                    id: `gd-${Date.now()}`,
                    title,
                    description
                });
                break;
            }
        }
        GrammarStore.saveMyFolders(folders);
        closeModal();
        if (typeof showToast === 'function') showToast(`Đã tạo bộ đề "${title}"`);
        this.refresh();
    },

    openEditDeckModal(deckId) {
        const folders = GrammarStore.getMyFolders();
        let targetDeck = null;
        for (const f of folders) {
            for (const t of (f.topics || [])) {
                const found = (t.decks || []).find(d => d.id === deckId);
                if (found) {
                    targetDeck = found;
                    break;
                }
            }
            if (targetDeck) break;
        }

        if (!targetDeck) return;

        const allQuestions = GrammarStore.getQuestions();
        const deckQuestions = allQuestions.filter(q => q.deckId === deckId);
        const rawQuestionsText = this.convertQuestionsToRawText(deckQuestions);

        const html = `
            <div class="fixed inset-0 w-screen h-screen bg-slate-50 flex flex-col p-4 sm:p-6 overflow-hidden space-y-3 z-50">
                <div class="flex items-center justify-between border-b border-pink-100 pb-3 bg-white px-5 py-3 rounded-2xl shadow-xs shrink-0">
                    <div>
                        <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
                            <i data-lucide="file-edit" class="w-5 h-5 text-pink-500"></i>
                            <span>Chỉnh Sửa Bộ Đề & Dữ Liệu Bài Tập (Toàn màn hình)</span>
                        </h3>
                        <p class="text-xs text-slate-400">Chỉnh sửa thông tin và trực tiếp cập nhật các câu hỏi trong bộ đề.</p>
                    </div>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-pink-100 shrink-0">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Tên bộ đề:</label>
                        <input id="modal-edit-deck-title" type="text" value="${targetDeck.title || ''}" class="w-full px-3.5 py-2 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 text-xs font-medium">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn gọn:</label>
                        <input id="modal-edit-deck-desc" type="text" value="${targetDeck.description || ''}" placeholder="Mô tả kiến thức đề kiểm tra..." class="w-full px-3.5 py-2 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-1 focus:ring-pink-400 text-xs font-medium">
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                    <div class="flex flex-col space-y-1.5 h-full bg-white p-4 rounded-2xl border border-pink-100">
                        <div class="flex items-center justify-between shrink-0 mb-1">
                            <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <i data-lucide="code" class="w-4 h-4 text-pink-500"></i>
                                <span>Dữ liệu bài tập thô:</span>
                            </label>
                            <span class="text-[11px] text-pink-600 font-semibold bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100">Hỗ trợ [MCQ] & [TL]</span>
                        </div>
                        <textarea id="modal-edit-deck-raw-text" oninput="grammarManagerView.handleLivePreview(this.value, 'edit-deck-preview-container', 'edit-deck-preview-count')" placeholder="Nhập cấu trúc [MCQ] hoặc [TL]..." class="flex-1 w-full font-mono text-xs p-3.5 rounded-xl border border-pink-200 focus:outline-none leading-relaxed bg-[#fcfdfe] resize-none overflow-y-auto">${rawQuestionsText}</textarea>
                    </div>

                    <div class="flex flex-col space-y-1.5 h-full bg-white p-4 rounded-2xl border border-pink-100">
                        <div class="flex items-center justify-between shrink-0 mb-1">
                            <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <i data-lucide="eye" class="w-4 h-4 text-pink-500"></i>
                                <span>Xem trước giao diện (Live Preview):</span>
                            </label>
                            <span id="edit-deck-preview-count" class="text-[11px] text-pink-600 font-bold"></span>
                        </div>
                        <div id="edit-deck-preview-container" class="flex-1 w-full p-4 rounded-xl border border-pink-100 bg-slate-50/50 overflow-y-auto space-y-3"></div>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2 bg-white px-5 py-3 rounded-2xl border border-pink-100 shrink-0">
                    <button onclick="closeModal()" class="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold">Hủy</button>
                    <button onclick="grammarManagerView.updateDeckAndQuestions('${deckId}')" class="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 flex items-center gap-1.5">
                        <i data-lucide="save" class="w-4 h-4"></i>
                        <span>Lưu thay đổi</span>
                    </button>
                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
        this.handleLivePreview(rawQuestionsText, 'edit-deck-preview-container', 'edit-deck-preview-count');
    },

    convertQuestionsToRawText(questions) {
        if (!questions || questions.length === 0) return "";
        return questions.map(q => {
            if (q.type === 'multiple_choice') {
                const optStr = (q.options || []).join('\n');
                let str = `[MCQ]\nCâu hỏi: ${q.question || ''}\n${optStr}\nĐáp án: ${q.correctAnswer || ''}`;
                if (q.translation) str += `\nDịch: ${q.translation}`;
                if (q.explanation) str += `\nGiải thích: ${q.explanation}`;
                return str;
            } else {
                const ansStr = (q.acceptedAnswers || []).join(', ');
                let str = `[TL]\nCâu hỏi: ${q.question || ''}`;
                if (q.promptPrefix) str += `\nGợi ý: ${q.promptPrefix}`;
                str += `\nĐáp án: ${ansStr}`;
                if (q.translation) str += `\nDịch: ${q.translation}`;
                if (q.explanation) str += `\nGiải thích: ${q.explanation}`;
                return str;
            }
        }).join('\n\n');
    },

    updateDeckAndQuestions(deckId) {
        const title = document.getElementById('modal-edit-deck-title')?.value.trim();
        const description = document.getElementById('modal-edit-deck-desc')?.value.trim();
        const rawText = document.getElementById('modal-edit-deck-raw-text')?.value.trim();

        if (!title) {
            alert('Vui lòng nhập tên bộ đề!');
            return;
        }

        const folders = GrammarStore.getMyFolders();
        for (const f of folders) {
            for (const t of (f.topics || [])) {
                const d = (t.decks || []).find(item => item.id === deckId);
                if (d) {
                    d.title = title;
                    d.description = description;
                    break;
                }
            }
        }
        GrammarStore.saveMyFolders(folders);

        const parsedQuestions = this.parseRawQuestions(rawText, deckId);
        GrammarStore.deleteQuestionsByDeck(deckId);
        if (parsedQuestions.length > 0) {
            GrammarStore.addQuestions(parsedQuestions);
        }

        closeModal();
        if (typeof showToast === 'function') {
            showToast(`Đã lưu bộ đề và cập nhật ${parsedQuestions.length} câu hỏi!`);
        }
        this.refresh();
    },

    deleteDeck(deckId) {
        if (!confirm("Xóa bộ đề này và các câu hỏi đi kèm?")) return;
        const folders = GrammarStore.getMyFolders();
        folders.forEach(f => {
            (f.topics || []).forEach(t => {
                t.decks = (t.decks || []).filter(d => d.id !== deckId);
            });
        });
        GrammarStore.saveMyFolders(folders);
        GrammarStore.deleteQuestionsByDeck(deckId);
        this.refresh();
    },

    // ==========================================
    // BULK UPLOAD TOÀN MÀN HÌNH + BỐ CỤC ĐƯỢC TỐI ƯU THANH CUỘN & HỖ TRỢ XUỐNG DÒNG
    // ==========================================
    openBulkUploadModal(defaultFolderId = null, defaultTopicId = null) {
        const folders = GrammarStore.getMyFolders();
        if (!folders || folders.length === 0) {
            alert("Vui lòng tạo Thư mục, Chuyên đề và Bộ đề trước khi tải lên bài tập!");
            return;
        }

        const selectedFolderId = defaultFolderId || folders[0].id;
        const selectedFolder = folders.find(f => f.id === selectedFolderId) || folders[0];
        const topics = selectedFolder?.topics || [];

        const selectedTopicId = defaultTopicId && topics.some(t => t.id === defaultTopicId) 
            ? defaultTopicId 
            : (topics[0]?.id || '');
        const selectedTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
        const decks = selectedTopic?.decks || [];

        const html = `
            <div class="fixed inset-0 w-full h-full bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
                <div class="bg-white w-full max-w-7xl h-[96vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-pink-100">
                    
                    <!-- 1. Header tinh gọn -->
                    <div class="px-6 py-3.5 bg-white border-b border-pink-100/80 flex items-center justify-between shrink-0">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200">
                                <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
                                    Tải Lên Bài Tập Hàng Loạt
                                    <span class="text-[11px] font-semibold bg-pink-50 text-pink-600 px-2.5 py-0.5 rounded-full border border-pink-200/60">Bulk Studio</span>
                                </h3>
                                <p class="text-xs text-slate-400">Tự động nhận diện cú pháp trắc nghiệm [MCQ] & tự luận [TL] tức thì.</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="grammarManagerView.loadSampleData()" class="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs border border-pink-200/80 transition flex items-center gap-1.5 shadow-2xs">
                                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                                <span>Dữ liệu mẫu</span>
                            </button>
                            <button onclick="closeModal()" class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 2. Thanh vị trí lưu (Thư mục -> Chuyên đề -> Bộ đề) -->
                    <div class="px-6 py-2.5 bg-slate-50/70 border-b border-pink-100/60 shrink-0">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-pink-100 shadow-2xs">
                                <span class="text-[11px] font-bold text-slate-500 shrink-0">1. Thư mục:</span>
                                <select id="bulkUploadFolderSelect" onchange="grammarManagerView.onBulkFolderChange(this.value)" class="w-full text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer">
                                    ${folders.map(f => `<option value="${f.id}" ${f.id === selectedFolderId ? 'selected' : ''}>${f.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-pink-100 shadow-2xs">
                                <span class="text-[11px] font-bold text-slate-500 shrink-0">2. Chuyên đề:</span>
                                <select id="bulkUploadTopicSelect" onchange="grammarManagerView.onBulkTopicChange(this.value)" class="w-full text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer">
                                    ${topics.length === 0 ? '<option value="">(Chưa có chuyên đề)</option>' : topics.map(t => `<option value="${t.id}" ${t.id === selectedTopicId ? 'selected' : ''}>${t.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs ring-1 ring-pink-100">
                                <span class="text-[11px] font-bold text-pink-600 shrink-0">3. Bộ đề nạp vào:</span>
                                <select id="bulkUploadDeckSelect" class="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer">
                                    ${decks.length === 0 ? '<option value="">(Chưa có bộ đề)</option>' : decks.map(d => `<option value="${d.id}">${d.title}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Bảng quy tắc dạng Collapsible (Gồm quy tắc Xuống dòng mới) -->
                    <div class="px-6 py-2 bg-amber-50/50 border-b border-amber-200/50 shrink-0">
                        <details class="group text-xs text-slate-700" open>
                            <summary class="flex items-center justify-between cursor-pointer select-none font-semibold text-amber-900 py-0.5">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="help-circle" class="w-4 h-4 text-amber-600"></i>
                                    <span>Quy tắc chuẩn khi nhập liệu (Bấm để ẩn / hiện chi tiết)</span>
                                </div>
                                <span class="text-[11px] text-amber-700 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2.5 pb-1 text-[11px]">
                                <div class="bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                                    <span class="font-bold text-pink-600">1. Loại câu:</span>
                                    <p class="text-slate-500 mt-0.5"><code class="text-pink-600 font-bold">[MCQ]</code> hoặc <code class="text-pink-600 font-bold">[TL]</code> ở đầu mỗi câu.</p>
                                </div>
                                <div class="bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                                    <span class="font-bold text-pink-600">2. Bắt đầu câu:</span>
                                    <p class="text-slate-500 mt-0.5">Dòng <code class="font-mono text-slate-700">Câu hỏi: ...</code>. Ngắt các câu bằng 1 dòng trống.</p>
                                </div>
                                <div class="bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                                    <span class="font-bold text-pink-600">3. In đậm từ khóa:</span>
                                    <p class="text-slate-500 mt-0.5">Kẹp dấu sao <code class="font-bold text-pink-600">**từ in đậm**</code> để làm nổi bật.</p>
                                </div>
                                <div class="bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                                    <span class="font-bold text-pink-600">4. Xuống dòng:</span>
                                    <p class="text-slate-500 mt-0.5">Dùng <code class="text-pink-600 font-bold">&lt;br&gt;</code> hoặc gõ <code class="text-pink-600 font-bold">\\n</code> trong câu.</p>
                                </div>
                                <div class="bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                                    <span class="font-bold text-pink-600">5. Lựa chọn MCQ:</span>
                                    <p class="text-slate-500 mt-0.5">Mỗi dòng: <code class="font-bold text-slate-700">A.</code> <code class="font-bold text-slate-700">B.</code> <code class="font-bold text-slate-700">C.</code> <code class="font-bold text-slate-700">D.</code></p>
                                </div>
                                <div class="bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                                    <span class="font-bold text-pink-600">6. Đáp án đúng:</span>
                                    <p class="text-slate-500 mt-0.5">MCQ: <code class="text-slate-700 font-bold">Đáp án: B</code> | TL: ngăn nhau bằng <code class="text-slate-700">,</code></p>
                                </div>
                                <div class="bg-white p-2 rounded-xl border border-amber-200/60 shadow-2xs">
                                    <span class="font-bold text-pink-600">7. Dịch & Giải thích:</span>
                                    <p class="text-slate-500 mt-0.5">Thêm <code class="text-slate-700">Dịch: ...</code> và <code class="text-slate-700">Giải thích: ...</code> ở cuối.</p>
                                </div>
                            </div>
                        </details>
                    </div>

                    <!-- 4. KHU VỰC CHÍNH (2 CỘT) - ĐÃ CỐ ĐỊNH THANH CUỘN ĐỘC LẬP -->
                    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 bg-slate-50/50">
                        
                        <!-- Cột Trái: Trình soạn thảo văn bản -->
                        <div class="flex flex-col h-full bg-white rounded-2xl border border-pink-100 shadow-xs overflow-hidden">
                            <div class="px-4 py-3 bg-white border-b border-pink-50 flex items-center justify-between shrink-0">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="edit-3" class="w-4 h-4 text-pink-500"></i>
                                    <span class="text-xs font-bold text-slate-700">Nội dung soạn thảo / Dán đề</span>
                                </div>
                                <button onclick="document.getElementById('bulkUploadText').value=''; grammarManagerView.handleLivePreview('', 'bulk-preview-container', 'bulk-preview-count');" class="text-[11px] text-slate-400 hover:text-rose-500 transition">
                                    Xóa trắng
                                </button>
                            </div>
                            <div class="flex-1 min-h-0 relative">
                                <textarea id="bulkUploadText" 
                                    oninput="grammarManagerView.handleLivePreview(this.value, 'bulk-preview-container', 'bulk-preview-count')" 
                                    placeholder="Dán hoặc gõ nội dung câu hỏi theo quy tắc chuẩn vào đây..." 
                                    class="w-full h-full p-4 font-mono text-xs leading-relaxed text-slate-800 bg-[#fdfefe] resize-none focus:outline-none border-none overflow-y-auto"
                                    style="scrollbar-width: thin; scrollbar-color: #f472b6 #fdf2f8;"
                                ></textarea>
                            </div>
                        </div>

                        <!-- Cột Phải: Live Preview trực quan -->
                        <div class="flex flex-col h-full bg-white rounded-2xl border border-pink-100 shadow-xs overflow-hidden">
                            <div class="px-4 py-3 bg-white border-b border-pink-50 flex items-center justify-between shrink-0">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="eye" class="w-4 h-4 text-pink-500"></i>
                                    <span class="text-xs font-bold text-slate-700">Bản xem trước trực tiếp (Live Preview)</span>
                                </div>
                                <span id="bulk-preview-count" class="text-[11px] font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">0 câu hỏi hợp lệ</span>
                            </div>
                            <div id="bulk-preview-container" 
                                class="flex-1 min-h-0 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40"
                                style="scrollbar-width: thin; scrollbar-color: #f472b6 #fdf2f8;"
                            >
                                <div class="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2 py-16">
                                    <div class="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center">
                                        <i data-lucide="sparkles" class="w-6 h-6"></i>
                                    </div>
                                    <p class="text-xs font-medium">Nhập câu hỏi hoặc bấm <strong>"Dữ liệu mẫu"</strong> ở trên<br/>để kiểm tra kết quả hiển thị tại đây.</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- 5. Footer cố định bên dưới -->
                    <div class="px-6 py-3.5 bg-white border-t border-pink-100 flex items-center justify-between shrink-0">
                        <span class="text-xs text-slate-400 hidden sm:inline">Kiểm tra kỹ số lượng câu hợp lệ trước khi bấm nạp.</span>
                        <div class="flex items-center gap-2.5 ml-auto">
                            <button onclick="closeModal()" class="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Đóng</button>
                            <button onclick="grammarManagerView.processBulkUpload()" class="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white shadow-md shadow-pink-200 transition flex items-center gap-2">
                                <i data-lucide="check" class="w-4 h-4"></i>
                                <span>Xác nhận nạp bài tập</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    onBulkFolderChange(folderId) {
        const folders = GrammarStore.getMyFolders();
        const folder = folders.find(f => f.id === folderId);
        const topics = folder ? (folder.topics || []) : [];
        const topicSelect = document.getElementById('bulkUploadTopicSelect');

        if (topicSelect) {
            topicSelect.innerHTML = topics.length === 0 
                ? '<option value="">(Không có chuyên đề)</option>'
                : topics.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            
            this.onBulkTopicChange(topicSelect.value);
        }
    },

    onBulkTopicChange(topicId) {
        const folders = GrammarStore.getMyFolders();
        let decks = [];
        for (const f of folders) {
            const topic = (f.topics || []).find(t => t.id === topicId);
            if (topic) {
                decks = topic.decks || [];
                break;
            }
        }

        const deckSelect = document.getElementById('bulkUploadDeckSelect');
        if (deckSelect) {
            deckSelect.innerHTML = decks.length === 0
                ? '<option value="">(Không có bộ đề)</option>'
                : decks.map(d => `<option value="${d.id}">${d.title}</option>`).join('');
        }
    },

    // -------------------------------------------------------------------------
    // HỖ TRỢ RENDER IN ĐẬM **TEXT** & XUỐNG DÒNG <BR> / \N
    // -------------------------------------------------------------------------
    formatBoldText(text) {
        if (!text) return '';
        let formatted = text.replace(/\\n/g, '<br/>').replace(/<br\s*[\/]?>/gi, '<br/>');
        return formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-pink-600 font-bold">$1</strong>');
    },

    // -------------------------------------------------------------------------
    // BỘ PHÂN TÍCH PARSER
    // -------------------------------------------------------------------------
    parseRawQuestions(rawText, deckId = "temp") {
        if (!rawText || !rawText.trim()) return [];

        const normalized = rawText.replace(/\r\n/g, '\n').trim();
        const tagRegex = /\[(MCQ|TL)\]/gi;
        
        const matches = [];
        let match;

        while ((match = tagRegex.exec(normalized)) !== null) {
            matches.push({
                type: match[1].toUpperCase(),
                index: match.index,
                tagLength: match[0].length
            });
        }

        if (matches.length === 0) return [];

        const result = [];

        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const startIndex = current.index + current.tagLength;
            const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : normalized.length;
            const blockContent = normalized.substring(startIndex, endIndex).trim();

            const lines = blockContent.split('\n');
            let questionLines = [];
            let options = [];
            let correctAnswer = "";
            let acceptedAnswers = [];
            let promptPrefix = "";
            let translation = "";
            let explanationLines = [];
            let currentField = "question";

            for (let line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (/^câu\s*hỏi\s*:/i.test(trimmed)) {
                    currentField = "question";
                    const val = trimmed.replace(/^câu\s*hỏi\s*:\s*/i, '');
                    if (val) questionLines.push(val);
                } else if (/^[A-D]\.\s+/i.test(trimmed)) {
                    currentField = "options";
                    options.push(trimmed);
                } else if (/^gợi\s*ý\s*:/i.test(trimmed)) {
                    currentField = "prompt";
                    promptPrefix = trimmed.replace(/^gợi\s*ý\s*:\s*/i, '').trim();
                } else if (/^đáp\s*án\s*:/i.test(trimmed)) {
                    currentField = "answer";
                    const ansStr = trimmed.replace(/^đáp\s*án\s*:\s*/i, '').trim();
                    if (current.type === 'MCQ') {
                        const m = ansStr.match(/[A-D]/i);
                        correctAnswer = m ? m[0].toUpperCase() : '';
                    } else {
                        acceptedAnswers = ansStr.split(',').map(s => s.trim()).filter(Boolean);
                    }
                } else if (/^dịch\s*:/i.test(trimmed)) {
                    currentField = "translation";
                    translation = trimmed.replace(/^dịch\s*:\s*/i, '').trim();
                } else if (/^giải\s*thích\s*:/i.test(trimmed)) {
                    currentField = "explanation";
                    const expVal = trimmed.replace(/^giải\s*thích\s*:\s*/i, '').trim();
                    if (expVal) explanationLines.push(expVal);
                } else {
                    if (currentField === "question") {
                        questionLines.push(trimmed);
                    } else if (currentField === "explanation") {
                        explanationLines.push(trimmed);
                    } else if (currentField === "translation") {
                        translation += (translation ? ' ' : '') + trimmed;
                    }
                }
            }

            const questionText = questionLines.join('\n').trim();
            const explanation = explanationLines.join('\n').trim();

            if (!questionText) continue;

            if (current.type === 'MCQ' && options.length >= 2) {
                result.push({
                    id: `q-gen-${Date.now()}-${result.length}`,
                    deckId: deckId,
                    type: "multiple_choice",
                    topic: "grammar",
                    subTopic: "all",
                    topicLabel: "Trắc nghiệm",
                    subTopicLabel: "Luyện tập",
                    question: questionText,
                    options: options,
                    correctAnswer: correctAnswer,
                    translation: translation,
                    explanation: explanation || "Chưa có giải thích chi tiết."
                });
            } else if (current.type === 'TL' && acceptedAnswers.length > 0) {
                result.push({
                    id: `q-gen-${Date.now()}-${result.length}`,
                    deckId: deckId,
                    type: "written",
                    topic: "grammar",
                    subTopic: "all",
                    topicLabel: "Tự luận",
                    subTopicLabel: "Luyện tập",
                    question: questionText,
                    promptPrefix: promptPrefix,
                    placeholder: "Nhập đáp án tự luận...",
                    acceptedAnswers: acceptedAnswers,
                    cleanTarget: acceptedAnswers[0],
                    translation: translation,
                    explanation: explanation || "Chưa có giải thích chi tiết."
                });
            }
        }

        return result;
    },

    // -------------------------------------------------------------------------
    // RENDER XEM TRƯỚC CÂU HỎI TRỰC TIẾP (LIVE PREVIEW)
    // -------------------------------------------------------------------------
    handleLivePreview(text, containerId, countElementId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const questions = this.parseRawQuestions(text);
        if (countElementId) {
            const countEl = document.getElementById(countElementId);
            if (countEl) countEl.innerText = `${questions.length} câu hỏi hợp lệ`;
        }

        if (questions.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2 py-16">
                    <div class="w-10 h-10 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center">
                        <i data-lucide="help-circle" class="w-5 h-5"></i>
                    </div>
                    <p class="text-xs">Chưa có câu hỏi hợp lệ nào được nhận diện.<br/>Hãy kiểm tra cú pháp [MCQ] hoặc [TL].</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = questions.map((q, idx) => `
            <div class="bg-white border border-pink-100/90 rounded-2xl p-4 shadow-sm space-y-3 text-xs transition hover:border-pink-200">
                <div class="flex items-center justify-between pb-2 border-b border-pink-50">
                    <span class="font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-lg border border-pink-100 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full ${q.type === 'multiple_choice' ? 'bg-pink-500' : 'bg-rose-500'}"></span>
                        Câu ${idx + 1} • ${q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                    </span>
                    <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                        ✓ Đáp án: ${q.type === 'multiple_choice' ? (q.correctAnswer || 'Chưa chọn') : (q.acceptedAnswers || []).join(' | ')}
                    </span>
                </div>

                <div class="font-medium text-slate-800 leading-relaxed text-sm whitespace-pre-line">${this.formatBoldText(q.question)}</div>

                ${q.type === 'multiple_choice' ? `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        ${q.options.map(opt => {
                            const isCorrect = q.correctAnswer && new RegExp('^' + q.correctAnswer + '\\.', 'i').test(opt.trim());
                            return `
                                <div class="px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${isCorrect ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold shadow-2xs' : 'bg-slate-50/70 border-slate-200/70 text-slate-600'}">
                                    <span class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}">
                                        ${isCorrect ? '✓' : opt.charAt(0)}
                                    </span>
                                    <span>${this.formatBoldText(opt.replace(/^[A-D]\.\s*/i, ''))}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="pt-1 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        ${q.promptPrefix ? `<div class="text-[11px] text-slate-500 font-medium italic">Gợi ý bắt đầu: <strong>${this.formatBoldText(q.promptPrefix)}</strong></div>` : ''}
                        <input type="text" disabled placeholder="${q.placeholder || 'Ô điền đáp án của học viên...'}" class="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-400">
                    </div>
                `}

                ${(q.translation || q.explanation) ? `
                    <div class="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                        ${q.translation ? `<div class="text-slate-600"><strong class="text-slate-700">Dịch nghĩa:</strong> ${this.formatBoldText(q.translation)}</div>` : ''}
                        ${q.explanation ? `<div class="text-pink-700 bg-pink-50/60 p-2 rounded-xl border border-pink-100/60"><strong class="text-pink-600">Giải thích:</strong> ${this.formatBoldText(q.explanation)}</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    },

    // -------------------------------------------------------------------------
    // NẠP DỮ LIỆU MẪU CÓ MINH HỌA XUỐNG DÒNG BẰNG <BR> VÀ \N
    // -------------------------------------------------------------------------
    loadSampleData() {
        const sample = `[MCQ]
Câu hỏi: Read the following dialogue and fill in the blank:<br>A: "Have you submitted your report yet?"<br>B: "No, I ______ it for **five hours** before the electricity went out."
A. has prepared
B. had been preparing
C. is preparing
D. prepares
Đáp án: B
Dịch: Đọc đoạn đối thoại sau và điền vào chỗ trống:<br>A: "Bạn đã nộp báo cáo chưa?"<br>B: "Chưa, tôi đã soạn thảo liên tục trong **5 tiếng** trước khi bị mất điện."
Giải thích: Diễn tả một hành động xảy ra và kéo dài liên tục trước một thời điểm/hành động khác trong quá khứ ("before the electricity went out") nên dùng thì **Quá khứ hoàn thành tiếp diễn**.

[TL]
Câu hỏi: Viết lại câu sau với cấu trúc câu điều kiện loại 2:\\n"Because I don't have enough money, I cannot buy this **laptop**."
Gợi ý: -> If I had
Đáp án: enough money, I could buy this laptop, enough money I could buy this laptop
Dịch: Nếu tôi có đủ tiền, tôi đã có thể mua chiếc **máy tính xách tay** này rồi.
Giải thích: Cấu trúc câu điều kiện loại 2 giả định điều không có thật ở hiện tại:\\nIf + S + V2/ed, S + could/would + V-inf.`;
        const textarea = document.getElementById('bulkUploadText');
        if (textarea) {
            textarea.value = sample;
            this.handleLivePreview(sample, 'bulk-preview-container', 'bulk-preview-count');
        }
    },

    processBulkUpload() {
        const deckId = document.getElementById('bulkUploadDeckSelect')?.value;
        if (!deckId) {
            alert("Vui lòng chọn Bộ đề hợp lệ để tải lên bài tập!");
            return;
        }

        const rawText = document.getElementById('bulkUploadText')?.value.trim();
        if (!rawText) {
            alert("Vui lòng dán nội dung bài tập!");
            return;
        }

        const newQuestions = this.parseRawQuestions(rawText, deckId);
        if (newQuestions.length === 0) {
            alert("Không trích xuất được câu hỏi nào hợp lệ. Vui lòng kiểm tra lại cấu trúc văn bản!");
            return;
        }

        GrammarStore.addQuestions(newQuestions);
        closeModal();
        if (typeof showToast === 'function') showToast(`Đã tải lên thành công ${newQuestions.length} câu hỏi!`);
        this.refresh();
    },

    startPractice(deckId) {
        if (!window.appState) window.appState = {};
        appState.grammarFilterDeck = deckId;
        navigateTo('grammarDrill');
    },

    startExam(deckId) {
        if (!window.appState) window.appState = {};
        appState.grammarFilterDeck = deckId;
        navigateTo('grammarExam');
    },

    refresh() {
        if (typeof navigateTo === 'function') navigateTo('grammarManager');
    },

    afterRender() {
        if (window.lucide) lucide.createIcons();
    }
};