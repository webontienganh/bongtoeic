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
                                <button onclick="grammarManagerView.openBulkUploadModal('${topic.id}')" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white text-xs font-bold transition shadow-md shadow-pink-200 flex items-center gap-1.5">
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
                                                <button onclick="grammarManagerView.deleteDeck('${deck.id}')" title="Xóa đề" class="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition">
                                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                </button>
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
                                            <button onclick="grammarManagerView.deleteTopic('${folder.id}', '${topic.id}')" title="Xóa chuyên đề" class="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
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
                <!-- Header Banner -->
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
                        <!-- Nút chuyển Tab Kho đề -->
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
                                            <button onclick="grammarManagerView.deleteFolder('${folder.id}')" title="Xóa thư mục" class="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
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

    // Chuyển đổi linh hoạt emoji cũ sang Lucide icon
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

    // ==========================================
    // MODAL CẤP 1: TẠO THƯ MỤC LỚN
    // ==========================================
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
                    <select id="input-grammar-folder-icon" class="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none">
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

    deleteFolder(folderId) {
        if (!confirm("Xóa thư mục sẽ xóa tất cả chuyên đề và bộ đề bên trong. Tiếp tục?")) return;
        let folders = GrammarStore.getMyFolders().filter(f => f.id !== folderId);
        GrammarStore.saveMyFolders(folders);
        this.refresh();
    },

    // ==========================================
    // MODAL CẤP 2: TẠO CHUYÊN ĐỀ
    // ==========================================
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

    // ==========================================
    // MODAL CẤP 3: TẠO BỘ ĐỀ
    // ==========================================
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
    // BULK UPLOAD CÂU HỎI
    // ==========================================
    openBulkUploadModal(topicId = null) {
        const myDecks = GrammarStore.getDecks('my');
        if (myDecks.length === 0) {
            alert("Vui lòng tạo ít nhất 1 bộ đề trước khi tải lên bài tập!");
            return;
        }

        const filteredDecks = topicId ? myDecks.filter(d => d.topicId === topicId) : myDecks;
        const useDecks = filteredDecks.length > 0 ? filteredDecks : myDecks;

        const html = `
            <div class="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-4">
                <div class="flex justify-between items-center border-b border-pink-100 pb-3">
                    <div>
                        <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
                            <i data-lucide="upload-cloud" class="w-5 h-5 text-pink-500"></i>
                            <span>Tải Lên Bài Tập Hàng Loạt (Bulk Upload)</span>
                        </h3>
                        <p class="text-xs text-slate-500">Hỗ trợ trắc nghiệm [MCQ] và tự luận [TL].</p>
                    </div>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-pink-50/40 p-3 rounded-2xl border border-pink-100">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nạp vào Bộ đề:</label>
                        <select id="bulkUploadDeckSelect" class="w-full text-xs px-3 py-2 rounded-xl border border-pink-200 bg-white font-medium focus:outline-none">
                            ${useDecks.map(d => `<option value="${d.id}">${d.folderName} ➔ ${d.topicName} ➔${d.title}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex items-center justify-end gap-2 sm:pt-4">
                        <button onclick="grammarManagerView.loadSampleData()" class="px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold text-xs transition flex items-center gap-1.5">
                            <i data-lucide="clipboard-copy" class="w-3.5 h-3.5"></i>
                            <span>Nạp mẫu</span>
                        </button>
                    </div>
                </div>

                <div class="bg-[#fffafb] border border-pink-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                    <div class="font-bold text-pink-700 flex items-center gap-1.5">
                        <i data-lucide="sparkles" class="w-4 h-4 text-pink-500"></i>
                        <span>Quy tắc chuẩn:</span>
                    </div>
                    <ul class="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600">
                        <li>Dùng <code>[MCQ]</code> cho trắc nghiệm, <code>[TL]</code> cho tự luận.</li>
                        <li>Trắc nghiệm: <code>A. ...</code>, <code>B. ...</code>, <code>C. ...</code>, <code>D. ...</code>.</li>
                        <li>Tự luận: dòng <code>Gợi ý:</code> và <code>Đáp án:</code> (các đáp án cách nhau bằng dấu phẩy).</li>
                    </ul>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi:</label>
                    <textarea id="bulkUploadText" rows="10" placeholder="Dán nội dung bài tập tại đây..." class="w-full font-mono text-xs p-3.5 rounded-2xl border border-pink-200 focus:outline-none leading-relaxed bg-[#fdfdfe]"></textarea>
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t border-pink-100">
                    <button onclick="closeModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100">Hủy</button>
                    <button onclick="grammarManagerView.processBulkUpload()" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-pink-500 text-white hover:bg-pink-600 shadow-md shadow-pink-200 flex items-center gap-1.5">
                        <i data-lucide="file-check" class="w-4 h-4"></i>
                        <span>Phân tích & Tải lên</span>
                    </button>
                </div>
            </div>
        `;
        openModal(html);
        if (window.lucide) lucide.createIcons();
    },

    loadSampleData() {
        const sample = `[MCQ]
Câu hỏi: She ______ in this company for **five years** before she decided to resign.
A. has worked
B. had worked
C. is working
D. works
Đáp án: B
Dịch: Cô ấy đã làm việc ở công ty này được **5 năm** trước khi quyết định từ chức.
Giải thích: Hành động xảy ra trước thời điểm quá khứ ("before she decided") nên dùng thì **Quá khứ hoàn thành**.

[TL]
Câu hỏi: Viết lại câu sau với cấu trúc câu điều kiện loại 2:
"Because I don't have enough money, I cannot buy this **laptop**."
Gợi ý: -> If I had
Đáp án: enough money, I could buy this laptop, enough money I could buy this laptop
Dịch: Nếu tôi có đủ tiền, tôi đã có thể mua chiếc **máy tính xách tay** này rồi.
Giải thích: Điều kiện loại 2 giả định trái ngược với hiện tại: If + S + V2/ed, S + could/would + V-inf.`;
        const textarea = document.getElementById('bulkUploadText');
        if (textarea) textarea.value = sample;
    },

    processBulkUpload() {
        const deckId = document.getElementById('bulkUploadDeckSelect')?.value;
        const rawText = document.getElementById('bulkUploadText')?.value.trim();

        if (!rawText) {
            alert("Vui lòng dán nội dung bài tập!");
            return;
        }

        const blocks = rawText.split(/(?=\[(?:MCQ\vert{}TL)\])/i).filter(b => b.trim().length > 0);
        let parsedCount = 0;
        const newQuestions = [];

        blocks.forEach(block => {
            const isMCQ = /^\[MCQ\]/i.test(block.trim());
            const isTL = /^\[TL\]/i.test(block.trim());
            if (!isMCQ && !isTL) return;

            const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let questionText = "";
            let options = [];
            let correctAnswer = "";
            let acceptedAnswers = [];
            let promptPrefix = "";
            let translation = "";
            let explanation = "";

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (/^câu\s*hỏi\s*:/i.test(line)) {
                    questionText = line.replace(/^câu\s*hỏi\s*:\s*/i, "");
                } else if (/^[A-D]\.\s+/i.test(line)) {
                    options.push(line);
                } else if (/^gợi\s*ý\s*:/i.test(line)) {
                    promptPrefix = line.replace(/^gợi\s*ý\s*:\s*/i, "");
                } else if (/^đáp\s*án\s*:/i.test(line)) {
                    const ansStr = line.replace(/^đáp\s*án\s*:\s*/i, "").trim();
                    if (isMCQ) {
                        correctAnswer = ansStr.charAt(0).toUpperCase();
                    } else {
                        acceptedAnswers = ansStr.split(',').map(s => s.trim()).filter(Boolean);
                    }
                } else if (/^dịch\s*:/i.test(line)) {
                    translation = line.replace(/^dịch\s*:\s*/i, "");
                } else if (/^giải\s*thích\s*:/i.test(line)) {
                    explanation = line.replace(/^giải\s*thích\s*:\s*/i, "");
                } else {
                    if (!options.length && !correctAnswer && !acceptedAnswers.length) {
                        if (questionText) questionText += "\n" + line;
                        else questionText = line;
                    } else if (explanation) {
                        explanation += "\n" + line;
                    }
                }
            }

            if (!questionText) return;

            if (isMCQ && options.length >= 2 && correctAnswer) {
                newQuestions.push({
                    id: `q-bulk-${Date.now()}-${parsedCount}`,
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
                    explanation: explanation || "Chưa có lời giải chi tiết."
                });
                parsedCount++;
            } else if (isTL && acceptedAnswers.length > 0) {
                newQuestions.push({
                    id: `q-bulk-${Date.now()}-${parsedCount}`,
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
                    explanation: explanation || "Chưa có lời giải chi tiết."
                });
                parsedCount++;
            }
        });

        if (parsedCount === 0) {
            alert("Không trích xuất được câu hỏi nào. Vui lòng kiểm tra lại cấu trúc!");
            return;
        }

        GrammarStore.addQuestions(newQuestions);
        closeModal();
        if (typeof showToast === 'function') showToast(`Đã tải lên thành công ${parsedCount} câu hỏi!`);
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