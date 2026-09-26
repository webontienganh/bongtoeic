// --- QUẢN LÝ DỮ LIỆU BỘ TỪ CỦA TÔI (LOCALSTORAGE & CLOUD) ---
function getMyFolders() {
    const saved = localStorage.getItem('bong_my_folders');
    let allMyFolders = saved ? JSON.parse(saved) : [];

    // Nếu người dùng đã đăng nhập, chỉ lấy các thư mục do chính user đó tạo
    if (window.currentUser && window.currentUser.uid) {
        return allMyFolders.filter(f => f.createdBy === window.currentUser.uid);
    }
    
    // Nếu chưa đăng nhập, trả về các thư mục không có chủ sở hữu hoặc lưu tạm cho khách
    return allMyFolders.filter(f => !f.createdBy);
}

function saveMyFolders(folders) {
    const saved = localStorage.getItem('bong_my_folders');
    let allMyFolders = saved ? JSON.parse(saved) : [];

    if (window.currentUser && window.currentUser.uid) {
        // Gán userId cho các thư mục mới chưa có chủ sở hữu
        folders.forEach(f => {
            if (!f.createdBy) f.createdBy = window.currentUser.uid;
        });

        // Loại bỏ các thư mục cũ của user này và thay bằng danh sách mới
        const otherUsersFolders = allMyFolders.filter(f => f.createdBy !== window.currentUser.uid);
        allMyFolders = [...otherUsersFolders, ...folders];
    } else {
        allMyFolders = folders;
    }

    localStorage.setItem('bong_my_folders', JSON.stringify(allMyFolders));
    if (window.syncUserDataToCloud) {
        window.syncUserDataToCloud(); // Tự động đồng bộ lên Firebase
    }
}

// --- NẠP DỮ LIỆU BỘ TỪ CỘNG ĐỒNG (TỪ CÁC FILE JS RIÊNG) ---
function getCommunityFolders() {
    // Tự động gom tất cả các file từ vựng đã tự đăng ký
    if (window.ALL_COMMUNITY_VOCABS && Array.isArray(window.ALL_COMMUNITY_VOCABS)) {
        return window.ALL_COMMUNITY_VOCABS;
    }
    return [];
}

// --- TÌM BỘ TỪ THEO ID ---
function findVocabularySetById(setId) {
    const allFolders = [...getCommunityFolders(), ...getMyFolders()];
    for (const folder of allFolders) {
        const foundSet = (folder.sets || []).find(s => s.id === setId);
        if (foundSet) return { folder, set: foundSet };
    }
    return null;
}

// --- STATE CHUNG CỦA ỨNG DỤNG ---
const appState = {
    streak: 15,
    currentCardIndex: 0,
    vocabTab: 'community', // 'community' | 'my-vocab'
    openedFolderId: null,  // null: danh sách thư mục; id: danh sách bộ từ trong thư mục
    viewingSetId: null,    // null: không xem bảng từ; id: đang xem bảng 7 cột của bộ từ đó
    currentStudySet: null,
    flashcards: []
};

// --- HÀM LẤY VIEW ĐỘNG ---
function getView(viewName) {
    const map = {
        dashboard: typeof dashboardView !== 'undefined' ? dashboardView : null,
        vocabularySets: typeof vocabularySetsView !== 'undefined' ? vocabularySetsView : null,
        studyVocabulary: typeof studyVocabularyView !== 'undefined' ? studyVocabularyView : null,
        exam: typeof examView !== 'undefined' ? examView : null,
        examPlayer: typeof examPlayerView !== 'undefined' ? examPlayerView : null,
        testBuilder: typeof testBuilderView !== 'undefined' ? testBuilderView : null,
        examResult: typeof examResultView !== 'undefined' ? examResultView : null,
        grammarDrill: typeof grammarDrillView !== 'undefined' ? grammarDrillView : null,
        grammarExam: typeof grammarExamView !== 'undefined' ? grammarExamView : null,
        grammarManager: typeof grammarManagerView !== 'undefined' ? grammarManagerView : null
    };
    return map[viewName];
}

// --- ĐIỀU HƯỚNG TRANG ---
function navigateTo(viewName, params = {}) {
    const view = getView(viewName);
    if (!view) return;

    const mainApp = document.getElementById('main-app');
    mainApp.innerHTML = view.render(params);
    if (typeof view.afterRender === 'function') {
        view.afterRender();
    }

    // Reset trạng thái active của cả navbar laptop và mobile
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-rose-50', 'text-rose-600');
        if (btn.id && btn.id.startsWith('bottom-nav-')) {
            btn.classList.remove('text-rose-600', 'font-bold');
            btn.classList.add('text-slate-500');
        }
    });

    // Active cho Navbar Laptop
    const currentNav = document.getElementById('nav-' + viewName);
    if (currentNav) {
        currentNav.classList.add('bg-rose-50', 'text-rose-600');
    }

    // Active cho Bottom Nav Mobile
    const currentBottomNav = document.getElementById('bottom-nav-' + viewName);
    if (currentBottomNav) {
        currentBottomNav.classList.remove('text-slate-500');
        currentBottomNav.classList.add('text-rose-600', 'font-bold');
    }

    // Khởi tạo lại Lucide icons nếu cần
    if (window.lucide) lucide.createIcons();
}

// --- TOAST THÔNG BÁO ---
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    if (!toast) return;
    toastMsg.innerText = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
}

// --- QUẢN LÝ MODAL POPUP ---
function openModal(htmlContent) {
    const container = document.getElementById('modal-container');
    if (!container) return;
    container.innerHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            ${htmlContent}
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function closeModal() {
    const container = document.getElementById('modal-container');
    if (container) container.innerHTML = '';
}

// --- KHỞI CHẠY ---
window.addEventListener('DOMContentLoaded', () => {
    navigateTo('dashboard');
});
// ========================================================
// QUẢN LÝ DỮ LIỆU NGỮ PHÁP (GRAMMAR STORE - 3 CẤP & 2 KHO)
// ========================================================
window.GrammarStore = {
    KEYS: {
        MY_FOLDERS: 'bong_grammar_my_folders',
        COMMUNITY_FOLDERS: 'bong_grammar_community_folders',
        QUESTIONS: 'bong_grammar_questions',
        USER_ANSWERS: 'bong_grammar_user_answers'
    },

    // 1. Kho đề của tôi (My Folders)
    getMyFolders() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.MY_FOLDERS) || '[]');
        } catch (e) {
            return [];
        }
    },
    saveMyFolders(folders) {
        localStorage.setItem(this.KEYS.MY_FOLDERS, JSON.stringify(folders));
    },

    // 2. Kho đề cộng đồng (Community Folders)
    getCommunityFolders() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.COMMUNITY_FOLDERS) || '[]');
        } catch (e) {
            return [];
        }
    },
    saveCommunityFolders(folders) {
        localStorage.setItem(this.KEYS.COMMUNITY_FOLDERS, JSON.stringify(folders));
    },

    // 3. Lấy phẳng toàn bộ Bộ đề (Decks) từ cả 3 cấp: Thư mục ➔ Chuyên đề ➔ Bộ đề
    getDecks(source = 'all') {
        let folders = [];
        if (source === 'my') {
            folders = this.getMyFolders();
        } else if (source === 'community') {
            folders = this.getCommunityFolders();
        } else {
            folders = [...this.getCommunityFolders(), ...this.getMyFolders()];
        }

        const decks = [];
        folders.forEach(f => {
            (f.topics || []).forEach(t => {
                (t.decks || []).forEach(d => {
                    decks.push({
                        ...d,
                        topicId: t.id,
                        topicName: t.name,
                        folderId: f.id,
                        folderName: f.name
                    });
                });
            });
        });
        return decks;
    },

    // 4. Ngân hàng câu hỏi
    getQuestions() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.QUESTIONS) || '[]');
        } catch (e) {
            return [];
        }
    },
    saveQuestions(qList) {
        localStorage.setItem(this.KEYS.QUESTIONS, JSON.stringify(qList));
    },
    addQuestions(newQuestions) {
        const current = this.getQuestions();
        current.push(...newQuestions);
        this.saveQuestions(current);
    },
    deleteQuestionsByDeck(deckId) {
        const list = this.getQuestions().filter(q => q.deckId !== deckId);
        this.saveQuestions(list);
    },

    // 5. Tiến độ & Kết quả làm bài
    getUserAnswers() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.USER_ANSWERS) || '{}');
        } catch (e) {
            return {};
        }
    },
    setUserAnswer(qId, answerData) {
        const current = this.getUserAnswers();
        current[qId] = answerData;
        localStorage.setItem(this.KEYS.USER_ANSWERS, JSON.stringify(current));
    },
    removeUserAnswer(qId) {
        const current = this.getUserAnswers();
        delete current[qId];
        localStorage.setItem(this.KEYS.USER_ANSWERS, JSON.stringify(current));
    },
    resetUserAnswers() {
        localStorage.removeItem(this.KEYS.USER_ANSWERS);
    }
};