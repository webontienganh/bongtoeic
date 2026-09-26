// js/services/grammarStore.js
const GrammarStore = {
    KEYS: {
        MY_FOLDERS: 'bong_grammar_my_folders',
        COMMUNITY_FOLDERS: 'bong_grammar_community_folders',
        QUESTIONS: 'bong_grammar_questions',
        USER_ANSWERS: 'bong_grammar_user_answers'
    },

    // --- CẤU TRÚC 3 CẤP: Folder -> Topics -> Decks ---
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

    // HÀM MỚI BỔ SUNG: Lấy danh sách thư mục (hỗ trợ getFolders mà grammarExamView yêu cầu)
    getFolders(source = 'all') {
        if (source === 'my') return this.getMyFolders();
        if (source === 'community') return this.getCommunityFolders();
        return [...this.getCommunityFolders(), ...this.getMyFolders()];
    },

    // Lấy phẳng toàn bộ Decks (phục vụ lọc & làm bài)
    getDecks(source = 'all') {
        const folders = this.getFolders(source);
        
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

    // --- CÂU HỎI ---
    getQuestions() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.QUESTIONS) || '[]');
        } catch (e) {
            return [];
        }
    },

    saveQuestions(questions) {
        localStorage.setItem(this.KEYS.QUESTIONS, JSON.stringify(questions));
    },

    addQuestions(newQuestions) {
        const list = this.getQuestions();
        const merged = [...list, ...newQuestions];
        this.saveQuestions(merged);
        return merged;
    },

    deleteQuestionsByDeck(deckId) {
        const list = this.getQuestions().filter(q => q.deckId !== deckId);
        this.saveQuestions(list);
    },

    // --- TIẾN ĐỘ LÀM BÀI ---
    getUserAnswers() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.USER_ANSWERS) || '{}');
        } catch (e) {
            return {};
        }
    },

    setUserAnswer(qId, answerData) {
        const answers = this.getUserAnswers();
        answers[qId] = answerData;
        localStorage.setItem(this.KEYS.USER_ANSWERS, JSON.stringify(answers));
    },

    removeUserAnswer(qId) {
        const answers = this.getUserAnswers();
        delete answers[qId];
        localStorage.setItem(this.KEYS.USER_ANSWERS, JSON.stringify(answers));
    },

    resetUserAnswers() {
        localStorage.removeItem(this.KEYS.USER_ANSWERS);
    }
};

window.GrammarStore = GrammarStore;