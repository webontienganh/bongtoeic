// js/examView.js
const examView = {
    searchQuery: '',

    render() {
        const exams = window.ExamStore ? ExamStore.getAll() : [];
        const query = (this.searchQuery || '').trim().toLowerCase();

        // Lọc danh sách đề thi theo từ khóa tìm kiếm
        const filteredExms = exams.filter(exam => {
            if (!query) return true;
            const titleMatch = (exam.title || '').toLowerCase().includes(query);
            const idMatch = (exam.examId || '').toLowerCase().includes(query);
            const typeMatch = (exam.type || '').toLowerCase().includes(query);
            return titleMatch || idMatch || typeMatch;
        });

        return `
            <div class="space-y-6">
                <!-- Header & Action Bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                            Kho Đề Thi &amp; Luyện Tập <span class="text-pink-500">TOEIC</span>
                        </h1>
                        <p class="text-sm text-slate-500 mt-0.5">
                            Được đồng bộ từ kho dữ liệu JSON hệ thống. Hỗ trợ Audio mốc thời gian và Split-Screen.
                        </p>
                    </div>
                    <button onclick="navigateTo('testBuilder')" class="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-pink-200 transition flex items-center justify-center space-x-2 shrink-0">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>+ Soạn đề / Bulk Import</span>
                    </button>
                </div>

                <!-- Thanh tìm kiếm bộ đề thi -->
                <div class="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="relative flex-1">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-pink-400">
                            <i data-lucide="search" class="w-4 h-4"></i>
                        </span>
                        <input 
                            type="text" 
                            id="examSearchInput"
                            value="${this.searchQuery || ''}"
                            placeholder="Tìm kiếm bộ đề theo tên, mã đề thi..."
                            oninput="examView.handleSearch(this.value)"
                            class="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#fffafb] border border-pink-200/70 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-300 transition"
                        />
                        ${this.searchQuery ? `
                            <button onclick="examView.clearSearch()" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-rose-500 transition">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200/60 shrink-0">
                            Tổng số đề: <strong class="text-pink-600">${filteredExms.length}</strong>/${exams.length}
                        </span>
                    </div>
                </div>

                <!-- Danh sách thẻ Đề thi dạng Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${filteredExms.length === 0 ? `
                        <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-white rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50">
                            <div class="w-12 h-12 mx-auto rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 mb-3">
                                <i data-lucide="search-x" class="w-6 h-6"></i>
                            </div>
                            <p class="text-slate-700 font-semibold text-base mb-1">Không tìm thấy bộ đề phù hợp</p>
                            <p class="text-slate-400 text-xs">
                                ${exams.length === 0 
                                    ? 'Chưa có đề thi nào trong kho. Hãy bấm nút "+ Soạn đề" để nhập đề mới.' 
                                    : 'Thử kiểm tra lại từ khóa tìm kiếm hoặc bấm xóa tìm kiếm.'}
                            </p>
                            ${this.searchQuery ? `
                                <button onclick="examView.clearSearch()" class="mt-3 text-xs font-semibold text-pink-500 hover:text-pink-700 underline">
                                    Xóa tìm kiếm
                                </button>
                            ` : ''}
                        </div>
                    ` : filteredExms.map(exam => `
                        <div class="bg-white rounded-3xl border border-pink-100 hover:border-pink-200 shadow-sm shadow-pink-50 hover:shadow-md hover:shadow-pink-100/50 transition-all p-6 flex flex-col justify-between space-y-4">
                            <div>
                                <div class="flex items-center justify-between mb-2.5">
                                    <span class="text-xs font-bold px-3 py-1 bg-pink-50 text-pink-700 rounded-full border border-pink-200/70">
                                        ${exam.type || 'Full Test'}
                                    </span>
                                    <span class="text-xs text-slate-400 font-mono flex items-center gap-1">
                                        <i data-lucide="clock" class="w-3.5 h-3.5 text-pink-400"></i>
                                        ${exam.duration || 120} phút
                                    </span>
                                </div>
                                <h3 class="font-bold text-slate-900 text-lg mb-1 line-clamp-2 leading-snug">${exam.title}</h3>
                                <p class="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                                    Quy mô: <strong>${exam.questions ? exam.questions.length : 0}</strong> câu hỏi • Audio tích hợp
                                </p>
                            </div>

                            <div class="pt-4 border-t border-pink-50 flex items-center justify-between">
                                <span class="text-xs font-mono text-slate-400 bg-[#fffafb] px-2.5 py-1 rounded-md border border-pink-100">
                                    ID: ${exam.examId}
                                </span>
                                <button onclick="navigateTo('examPlayer', { examId: '${exam.examId}' })" class="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-pink-200 transition flex items-center gap-1.5">
                                    <span>Vào thi ngay</span>
                                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    handleSearch(val) {
        this.searchQuery = val;
        this.refreshView();
    },

    clearSearch() {
        this.searchQuery = '';
        this.refreshView();
    },

    refreshView() {
        const appContainer = document.getElementById('app') || document.getElementById('mainContent');
        if (appContainer) {
            appContainer.innerHTML = this.render();
            this.afterRender();
            // Đặt lại con trỏ chuột vào ô tìm kiếm nếu đang gõ
            const input = document.getElementById('examSearchInput');
            if (input) {
                input.focus();
                input.selectionStart = input.selectionEnd = input.value.length;
            }
        }
    },

    afterRender() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }
};