import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, deleteDoc, onSnapshot } 
    from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Thông tin cấu hình chính xác từ dự án của bạn
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

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.getElementById('btn-login-google');
    const profileMenu = document.getElementById('user-profile-menu');
    const avatar = document.getElementById('user-avatar');

    if (user) {
        window.currentUser = user;
        if (loginBtn) loginBtn.classList.add('hidden');
        if (profileMenu) profileMenu.classList.remove('hidden');
        if (avatar) avatar.src = user.photoURL || '';

        if (typeof showToast === 'function') {
            showToast(`Chào mừng ${user.displayName || 'bạn'}! Đang đồng bộ...`);
        }
        await loadUserDataFromCloud(user.uid);
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

// Lưu dữ liệu từ máy lên Cloud Firestore
window.syncUserDataToCloud = async () => {
    if (!window.currentUser) return;
    try {
        const userId = window.currentUser.uid;
        const payload = {
            folders: JSON.parse(localStorage.getItem('bong_my_folders') || '[]'),
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
            if (data.folders) localStorage.setItem('bong_my_folders', JSON.stringify(data.folders));
            if (data.srsProgress) localStorage.setItem('bong_toeic_srs_progress', JSON.stringify(data.srsProgress));
            if (data.answeredQuestions) localStorage.setItem('bong_toeic_answered_questions', JSON.stringify(data.answeredQuestions));
            if (data.userActivity) localStorage.setItem('bong_toeic_user_activity', JSON.stringify(data.userActivity));

            // Chỉ cập nhật nếu không làm gián đoạn điều hướng khác
            if (typeof navigateTo === 'function') navigateTo('dashboard');
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

    // CHỈ LÀM MỚI KHI NGƯỜI DÙNG THỰC SỰ ĐANG MỞ TAB "KHO ĐỀ"
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