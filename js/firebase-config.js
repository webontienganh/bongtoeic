// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, deleteDoc, onSnapshot } 
    from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgiIZV6_5t5F6YZoRTpuRINmPeWaPs0N4",
  authDomain: "bong-toeic.firebaseapp.com",
  projectId: "bong-toeic",
  storageBucket: "bong-toeic.firebasestorage.app",
  messagingSenderId: "124854772521",
  appId: "1:124854772521:web:c4261749830cc9bb444d38"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

window.currentUser = null;
let unsubscribeUserDoc = null; // Biến hủy lắng nghe cũ khi đổi tài khoản

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.getElementById('btn-login-google');
    const profileMenu = document.getElementById('user-profile-menu');
    const avatar = document.getElementById('user-avatar');

    // Hủy lắng nghe dữ liệu cũ nếu có
    if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
    }

    if (user) {
        window.currentUser = user;
        if (loginBtn) loginBtn.classList.add('hidden');
        if (profileMenu) profileMenu.classList.remove('hidden');
        if (avatar) avatar.src = user.photoURL || '';

        if (typeof showToast === 'function') {
            showToast(`Chào mừng ${user.displayName || 'bạn'}! Đang đồng bộ...`);
        }
        
        // 1. Tải dữ liệu lần đầu khi đăng nhập
        await loadUserDataFromCloud(user.uid);

        // 2. LẮNG NGHE THAY ĐỔI THỜI GIAN THỰC TỪ FIREBASE (Giúp điện thoại tự cập nhật khi laptop thay đổi)
        unsubscribeUserDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                let hasChanges = false;

                // Đồng bộ Thư mục Ngữ pháp (Dùng chung khóa bong_my_folders hoặc bong_grammar_my_folders)
                const cloudFolders = JSON.stringify(data.grammarFolders || data.folders || []);
                const localFolders = localStorage.getItem('bong_my_folders') || '[]';
                if (cloudFolders !== localFolders) {
                    localStorage.setItem('bong_my_folders', cloudFolders);
                    localStorage.setItem('bong_grammar_my_folders', cloudFolders);
                    hasChanges = true;
                }

                // Đồng bộ Câu hỏi Ngữ pháp
                const cloudQuestions = JSON.stringify(data.grammarQuestions || []);
                const localQuestions = localStorage.getItem('bong_grammar_questions') || '[]';
                if (cloudQuestions !== localQuestions) {
                    localStorage.setItem('bong_grammar_questions', cloudQuestions);
                    hasChanges = true;
                }

                // Nếu có thay đổi dữ liệu từ thiết bị khác gửi lên, tự động làm mới giao diện đang mở
                if (hasChanges && typeof navigateTo === 'function') {
                    const currentView = window.appState && appState.currentView ? appState.currentView : 'dashboard';
                    // Chỉ refresh nếu đang ở trang quản lý hoặc luyện ngữ pháp để tránh làm gián đoạn bài thi
                    if (currentView.startsWith('grammar') || currentView === 'dashboard') {
                        navigateTo(currentView);
                    }
                }
            }
        });

    } else {
        window.currentUser = null;
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (profileMenu) profileMenu.classList.add('hidden');
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
});

// Hàm gọi popup đăng nhập Google
window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        alert("Đăng nhập thất bại: " + error.message);
    }
};

// Đăng xuất
window.logoutGoogle = async () => {
    if (confirm("Bạn có muốn đăng xuất khỏi tài khoản không?")) {
        await signOut(auth);
        location.reload();
    }
};

// ========================================================
// ĐỒNG BỘ DỮ LIỆU LÊN CLOUD FIRESTORE
// ========================================================
window.syncUserDataToCloud = async () => {
    if (!window.currentUser) return;
    try {
        const userId = window.currentUser.uid;
        // Lấy dữ liệu từ cả 2 nguồn khóa để đảm bảo không bị sót
        const foldersData = localStorage.getItem('bong_my_folders') || localStorage.getItem('bong_grammar_my_folders') || '[]';
        const questionsData = localStorage.getItem('bong_grammar_questions') || '[]';
        
        const payload = {
            folders: JSON.parse(foldersData),
            grammarFolders: JSON.parse(foldersData),
            grammarQuestions: JSON.parse(questionsData),
            grammarAnswers: JSON.parse(localStorage.getItem('bong_grammar_user_answers') || '{}'),
            
            srsProgress: JSON.parse(localStorage.getItem('bong_toeic_srs_progress') || '{}'),
            answeredQuestions: JSON.parse(localStorage.getItem('bong_toeic_answered_questions') || '{}'),
            userActivity: JSON.parse(localStorage.getItem('bong_toeic_user_activity') || '{}'),
            updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", userId), payload, { merge: true });
        console.log("Đã đồng bộ lên Cloud thành công!");
    } catch (e) {
        console.error("Lỗi lưu lên Cloud:", e);
    }
};

// Nạp dữ liệu từ Cloud về máy khi đăng nhập
async function loadUserDataFromCloud(userId) {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const cloudFolders = data.grammarFolders || data.folders;
            
            if (cloudFolders) {
                localStorage.setItem('bong_my_folders', JSON.stringify(cloudFolders));
                localStorage.setItem('bong_grammar_my_folders', JSON.stringify(cloudFolders));
            }
            if (data.grammarQuestions) localStorage.setItem('bong_grammar_questions', JSON.stringify(data.grammarQuestions));
            if (data.grammarAnswers) localStorage.setItem('bong_grammar_user_answers', JSON.stringify(data.grammarAnswers));

            if (data.srsProgress) localStorage.setItem('bong_toeic_srs_progress', JSON.stringify(data.srsProgress));
            if (data.answeredQuestions) localStorage.setItem('bong_toeic_answered_questions', JSON.stringify(data.answeredQuestions));
            if (data.userActivity) localStorage.setItem('bong_toeic_user_activity', JSON.stringify(data.userActivity));

            if (typeof navigateTo === 'function') {
                const currentView = window.appState && appState.currentView ? appState.currentView : 'dashboard';
                navigateTo(currentView);
            }
        } else {
            window.syncUserDataToCloud();
        }
    } catch (e) {
        console.error("Lỗi tải dữ liệu Cloud:", e);
    }
}

// ========================================================
// QUẢN LÝ KHO ĐỀ DÙNG CHUNG TRÊN CLOUD FIRESTORE
// ========================================================
window.ExamStore = {
    _cache: [],

    getAll() {
        if (this._cache.length > 0) return this._cache;
        const local = localStorage.getItem('bong_toeic_exams_cache');
        return local ? JSON.parse(local) : [];
    },

    getById(id) {
        return this.getAll().find(e => e.examId === id) || null;
    },

    async save(examData) {
        const idx = this._cache.findIndex(e => e.examId === examData.examId);
        if (idx >= 0) this._cache[idx] = examData;
        else this._cache.unshift(examData);
        localStorage.setItem('bong_toeic_exams_cache', JSON.stringify(this._cache));

        try {
            await setDoc(doc(db, "exams", examData.examId), examData, { merge: true });
            console.log("Đã lưu đề thi lên Firestore:", examData.examId);
        } catch (e) {
            console.error("Lỗi lưu đề thi lên Firestore:", e);
        }
    },

    async delete(examId) {
        this._cache = this._cache.filter(e => e.examId !== examId);
        localStorage.setItem('bong_toeic_exams_cache', JSON.stringify(this._cache));

        try {
            await deleteDoc(doc(db, "exams", examId));
            console.log("Đã xóa đề thi khỏi Firestore:", examId);
        } catch (e) {
            console.error("Lỗi xóa đề thi trên Firestore:", e);
        }
    }
};

// Lắng nghe dữ liệu đề thi thời gian thực
const examsColRef = collection(db, "exams");
onSnapshot(examsColRef, (snapshot) => {
    const examsList = [];
    snapshot.forEach(docSnap => {
        examsList.push(docSnap.data());
    });
    window.ExamStore._cache = examsList;
    localStorage.setItem('bong_toeic_exams_cache', JSON.stringify(examsList));

    const currentNavTestBuilder = document.getElementById('nav-testBuilder');
    const isAtTestBuilder = currentNavTestBuilder && currentNavTestBuilder.classList.contains('bg-rose-50');

    if (isAtTestBuilder && typeof testBuilderView !== 'undefined' && testBuilderView.mode === 'list') {
        testBuilderView.refresh();
    } else if (typeof examView !== 'undefined' && document.getElementById('main-app')) {
        const currentNavExam = document.getElementById('nav-exam');
        if (currentNavExam && currentNavExam.classList.contains('bg-rose-50')) {
            navigateTo('exam');
        }
    }
});
