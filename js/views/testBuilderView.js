// js/views/testBuilderView.js
const testBuilderView = {
    mode: 'list', // 'list' | 'editor'
    currentExam: null,
    activePart: 1,
    uploadedImages: [], // [{ name, url, qNums }]
    previewAudioElement: null,
    rawTimelineText: '', // Lưu trữ văn bản mốc thời gian đã nhập

    partTemplates: {
        1: [
            {
                "qNum": 1,
                "part": 1,
                "audioStartTime": 12,
                "audioEndTime": 34,
                "image": "",
                "questionText": "",
                "options": [
                    "(A) A woman is holding an umbrella.",
                    "(B) A woman is walking down the street.",
                    "(C) A woman is getting into a car.",
                    "(D) A woman is sitting on a bench."
                ],
                "correctAnswer": "B",
                "explanation": "Mô tả người phụ nữ đang đi bộ.",
                "translation": "Một người phụ nữ đang đi bộ trên phố."
            }
        ],
        2: [
            {
                "qNum": 7,
                "part": 2,
                "audioStartTime": 150,
                "audioEndTime": 175,
                "questionText": "Where is the new printer located?",
                "options": [
                    "(A) On the second floor, next to room 204.",
                    "(B) Yes, it was printed yesterday.",
                    "(C) Mr. Tanaka ordered it."
                ],
                "correctAnswer": "A",
                "explanation": "Câu hỏi vị trí Where chọn A.",
                "translation": "Máy in ở đâu?"
            }
        ],
        3: [
            {
                "qNum": 32,
                "part": 3,
                "audioStartTime": 450,
                "audioEndTime": 490,
                "image": "", // Chỉ điền nếu bài có kèm biểu đồ/tranh
                "questionText": "What problem does the woman mention?",
                "options": [
                    "(A) A delivery was delayed.",
                    "(B) A client cancelled an appointment.",
                    "(C) A budget report has errors.",
                    "(D) The computer software needs an update."
                ],
                "correctAnswer": "A",
                "explanation": "Giao hàng bị trễ."
            }
        ],
        4: [
            {
                "qNum": 71,
                "part": 4,
                "audioStartTime": 1100,
                "audioEndTime": 1140,
                "image": "",
                "questionText": "What is the purpose of the announcement?",
                "options": [
                    "(A) To announce a flight delay",
                    "(B) To introduce a guest speaker",
                    "(C) To explain safety procedures",
                    "(D) To promote a new airline route"
                ],
                "correctAnswer": "A",
                "explanation": "Thông báo hoãn chuyến bay."
            }
        ],
        5: [
            {
                "qNum": 101,
                "part": 5,
                "questionText": "All visitors must register at the reception desk before _______ the building.",
                "options": ["(A) enters", "(B) entered", "(C) entering", "(D) entry"],
                "correctAnswer": "C",
                "explanation": "Trong câu có động từ \"held\" đang được chia ở thì quá khứ đơn → Cần chọn động từ ở thì quá khứ đơn (encouraged).",
                "translation": "Khi tổ chức cuộc họp cuối cùng, bà Toba đã khuyến khích nhân viên bán hàng của mình thực hiện tốt hơn nữa trong quý tới.",
            }
        ],
        6: [
            {
                "qNum": 131,
                "part": 6,
                "passage": "Dear Employees, We are pleased to announce...",
                "questionText": "Questions 131-134 refer to the following email.",
                "options": ["(A) greatly", "(B) great", "(C) greatness", "(D) greatest"],
                "correctAnswer": "A"
            }
        ],
        7: [
            {
                "qNum": 147,
                "part": 7,
                "image": "", // Điền nếu tài liệu là file scan/ảnh
                "passage": "<strong>MEMORANDUM</strong><br>Subject: Office Maintenance...",
                "questionText": "What is the memo mainly about?",
                "options": [
                    "(A) New parking permits",
                    "(B) Facility maintenance",
                    "(C) Change in office hours",
                    "(D) A holiday schedule"
                ],
                "correctAnswer": "B"
            }
        ]
    },

    render() {
        if (this.mode === 'editor') {
            return this.renderEditorPage();
        }
        return this.renderListPage();
    },

    // MÀN HÌNH 1: DANH SÁCH ĐỀ THI
    renderListPage() {
        const exams = window.ExamStore ? ExamStore.getAll() : [];
        return `
            <div class="space-y-6 max-w-7xl mx-auto">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Quản Lý Kho Đề & Soạn Thảo Đề Thi</h1>
                        <p class="text-sm text-slate-500">Soạn đề TOEIC 7 Parts, quản lý mốc thời gian Audio và gán hình ảnh thông minh.</p>
                    </div>
                    <button onclick="testBuilderView.startCreateNew()" class="bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm shadow-md shadow-pink-200 transition flex items-center space-x-2">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                        <span>+ Soạn đề thi mới</span>
                    </button>
                </div>

                <div class="bg-white rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm text-slate-600">
                            <thead class="bg-pink-50/60 text-xs uppercase text-slate-500 font-semibold border-b border-pink-100">
                                <tr>
                                    <th class="px-6 py-4">Mã Đề</th>
                                    <th class="px-6 py-4">Tên Đề Thi</th>
                                    <th class="px-6 py-4">Số Câu Hỏi</th>
                                    <th class="px-6 py-4">Thời Gian</th>
                                    <th class="px-6 py-4">File Audio</th>
                                    <th class="px-6 py-4 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-pink-50">
                                ${exams.length === 0 ? `
                                    <tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 text-xs">Chưa có đề nào trong kho. Bấm "+ Soạn đề thi mới" để tạo.</td></tr>
                                ` : exams.map(exam => `
                                    <tr class="hover:bg-pink-50/40 transition">
                                        <td class="px-6 py-4 font-mono font-bold text-xs text-pink-600">${exam.examId}</td>
                                        <td class="px-6 py-4 font-bold text-slate-800">${exam.title}</td>
                                        <td class="px-6 py-4"><span class="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold border border-pink-200">${exam.questions ? exam.questions.length : 0} câu</span></td>
                                        <td class="px-6 py-4 text-xs font-mono">${exam.duration || 120} phút</td>
                                        <td class="px-6 py-4 text-xs font-mono">
                                            ${exam.audioUrl ? '<span class="text-emerald-600 font-semibold">✓ Đã có Audio</span>' : '<span class="text-amber-500">Chưa có</span>'}
                                        </td>
                                        <td class="px-6 py-4 text-right space-x-2">
                                            <button onclick="testBuilderView.startEdit('${exam.examId}')" class="p-2 text-slate-500 hover:text-pink-600 rounded-xl hover:bg-pink-50 transition" title="Chỉnh sửa"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                                            <button onclick="testBuilderView.deleteExam('${exam.examId}')" class="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition" title="Xóa"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    // MÀN HÌNH 2: TRANG SOẠN ĐỀ
    renderEditorPage() {
        const exam = this.currentExam;
        const currentPartQuestions = (exam.questions || []).filter(q => Number(q.part) === this.activePart);

        return `
            <div class="space-y-6 max-w-7xl mx-auto pb-20">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50">
                    <div class="flex items-center space-x-3">
                        <button onclick="testBuilderView.backToList()" class="p-2 rounded-2xl bg-slate-100 hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <h1 class="text-xl font-bold text-slate-800">${exam.examId ? 'Chỉnh Sửa: ' + exam.title : 'Tạo Đề Thi Mới'}</h1>
                            <p class="text-xs text-slate-400">Tự động nhận diện ảnh đã gán, hỗ trợ căn chỉnh mốc giây Audio và 7 Part riêng biệt.</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button onclick="testBuilderView.backToList()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition">Hủy bỏ</button>
                        <button onclick="testBuilderView.saveExam()" class="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-pink-200 transition flex items-center space-x-2">
                            <i data-lucide="save" class="w-4 h-4"></i>
                            <span>Lưu & Xuất Bản Đề</span>
                        </button>
                    </div>
                </div>

                <!-- KHU VỰC 1: CẤU HÌNH & AUDIO + CÔNG CỤ ĐO GIÂY -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 space-y-4">
                        <h2 class="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-pink-50 pb-3">
                            <i data-lucide="sliders" class="w-4 h-4 text-pink-500"></i>
                            <span>1. Cấu hình chung & File Audio bài thi</span>
                        </h2>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">Mã đề (Exam ID)</label>
                                <input id="editor-exam-id" type="text" value="${exam.examId || ''}" class="w-full bg-[#fffafb] border border-pink-200 rounded-2xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-pink-400 focus:outline-hidden">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">Tên đề thi</label>
                                <input id="editor-title" type="text" value="${exam.title || ''}" class="w-full bg-[#fffafb] border border-pink-200 rounded-2xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-pink-400 focus:outline-hidden">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 mb-1">Thời gian làm bài (phút)</label>
                                <input id="editor-duration" type="number" value="${exam.duration || 120}" class="w-full bg-[#fffafb] border border-pink-200 rounded-2xl px-3 py-2 text-xs focus:ring-2 focus:ring-pink-400 focus:outline-hidden">
                            </div>
                        </div>

                        <!-- GẮN FILE AUDIO TỪ GOOGLE DRIVE / LINK TRỰC TUYẾN -->
                        <div class="pt-2 space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-xs font-semibold text-slate-700">Đường dẫn Audio (Dán link Google Drive hoặc URL MP3):</label>
                                <span class="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">✓ Tiết kiệm bộ nhớ (Online Stream)</span>
                            </div>
                            
                            <div class="flex items-center space-x-2">
                                <input id="editor-audio-url" type="text" value="${exam.audioUrl || ''}" 
                                    placeholder="Dán link Drive (VD: https://drive.google.com/file/d/.../view?usp=sharing)" 
                                    oninput="testBuilderView.handleDriveLinkInput(this.value)" 
                                    class="flex-1 bg-[#fffafb] border border-pink-200 rounded-2xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-pink-400 focus:outline-hidden">
                                
                                <button type="button" onclick="testBuilderView.applyDriveLinkNow()" class="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl text-xs font-semibold shadow-md shadow-pink-200 transition flex items-center space-x-1.5">
                                    <i data-lucide="link" class="w-4 h-4"></i>
                                    <span>Tải Link</span>
                                </button>
                            </div>

                            <!-- Trình phát Audio mini để nghe và lấy mốc giây -->
                            <div class="bg-pink-50/40 p-3 rounded-2xl border border-pink-100 flex flex-wrap items-center justify-between gap-3">
                                <audio id="builder-audio-player" src="${exam.audioUrl || ''}" controls class="h-9 max-w-sm"></audio>
                                <div class="flex items-center space-x-2">
                                    <span class="text-xs text-slate-500">Mốc đang nghe: <strong id="builder-current-second" class="text-pink-600 font-mono">0s</strong></span>
                                    <button type="button" onclick="testBuilderView.copyCurrentSecond()" class="px-3 py-1 bg-pink-100 hover:bg-pink-200 text-pink-800 text-[11px] font-bold rounded-xl transition">
                                        Sao chép giây
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- KHỐI MỚI: NHẬP MỐC THỜI GIAN DẠNG CHỮ TỰ ĐỘNG HIỂU -->
                    <div class="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 flex flex-col justify-between space-y-3">
                        <div>
                            <div class="flex items-center justify-between border-b border-pink-50 pb-2">
                                <h2 class="text-sm font-bold text-slate-800 flex items-center space-x-2">
                                    <i data-lucide="clock" class="w-4 h-4 text-pink-500"></i>
                                    <span>Nhập Mốc Audio (Tự Động Phân Tích)</span>
                                </h2>
                                <button type="button" onclick="testBuilderView.pasteSampleTimeline()" class="text-[11px] text-pink-600 font-bold hover:underline">Dán mẫu thử</button>
                            </div>
                            <p class="text-xs text-slate-500 mt-2">Dán danh sách mốc thời gian dạng chữ (hệ thống tự tính ra giây cho cả câu đơn và chùm câu):</p>
                        </div>

                        <div>
                            <textarea id="raw-timeline-input" rows="7" placeholder="Ví dụ:&#10;Câu 1: 00:01:37 - 00:02:02&#10;Câu 2: 00:02:02 - 00:02:27&#10;Câu 32 - 34: 00:14:00 - 00:15:13" class="w-full bg-[#fffafb] border border-pink-200 rounded-2xl p-3 text-xs font-mono focus:ring-2 focus:ring-pink-400 focus:outline-hidden leading-relaxed">${this.rawTimelineText || ''}</textarea>
                        </div>

                        <button type="button" onclick="testBuilderView.applyRawTimelineText()" class="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 shadow-md shadow-pink-200 transition">
                            <i data-lucide="check-circle" class="w-4 h-4"></i>
                            <span>Cập Nhật Mốc Giờ Cho Đề</span>
                        </button>
                    </div>
                </div>

                <!-- KHU VỰC 2: QUẢN LÝ ẢNH & HIỂN THỊ CÂU ĐÃ GÁN (SỬA ĐƯỢC KHI VÀO LẠI) -->
                <div class="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-3">
                        <div>
                            <h2 class="text-sm font-bold text-slate-800 flex items-center space-x-2">
                                <i data-lucide="images" class="w-4 h-4 text-pink-500"></i>
                                <span>2. Quản lý hình ảnh câu hỏi (Đã gán: ${this.uploadedImages.length} ảnh)</span>
                            </h2>
                            <p class="text-xs text-slate-500">Xem lại các ảnh đã đính kèm. Bạn có thể sửa lại số câu (VD: 1 hoặc 147-148) hoặc gỡ ảnh nếu gán nhầm.</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button type="button" onclick="testBuilderView.updateAllImageAssignments()" class="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-2xl text-xs font-semibold text-white shadow-md transition">
                                <i data-lucide="check-check" class="w-4 h-4"></i>
                                <span>Lưu tất cả ảnh</span>
                            </button>
                            <input type="file" id="multi-image-uploader" accept="image/*" multiple class="hidden" onchange="testBuilderView.handleMultiImages(event)">
                            <label for="multi-image-uploader" class="cursor-pointer inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 px-4 py-2 rounded-2xl text-xs font-semibold text-white shadow-md shadow-pink-200 transition">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                                <span>+ Chọn thêm ảnh mới</span>
                            </label>
                        </div>
                    </div>

                    <!-- Grid hiển thị toàn bộ ảnh hiện có trong đề -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
                        ${this.uploadedImages.length === 0 ? `
                            <div class="col-span-full py-8 text-center bg-pink-50/30 border border-dashed border-pink-200 rounded-3xl">
                                <p class="text-xs text-slate-400">Đề chưa có hình ảnh nào. Nhấn "+ Chọn thêm ảnh mới" để đưa vào.</p>
                            </div>
                        ` : this.uploadedImages.map((img, index) => `
                            <div class="bg-white p-3 rounded-2xl border border-pink-100 shadow-2xs space-y-2 relative group flex flex-col justify-between">
                                <div>
                                    <div class="w-full h-28 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center mb-1 border border-slate-100">
                                        <img src="${img.url}" class="w-full h-full object-cover">
                                    </div>
                                    <p class="text-[11px] truncate text-slate-500 font-mono" title="${img.name}">${img.name}</p>
                                </div>
                                <div class="space-y-1.5 pt-1">
                                    <div class="text-[10px] text-slate-500 font-semibold">Gán cho câu:</div>
                                    <input type="text" id="img-qnum-${index}" value="${img.qNums || ''}" placeholder="VD: 1 hoặc 147-148" class="w-full bg-[#fffafb] border border-pink-200 rounded-xl px-2 py-1 text-xs text-center font-bold text-pink-700 focus:outline-hidden">
                                    <button onclick="testBuilderView.updateImageAssignment(${index})" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-1 text-[11px] font-semibold transition">
                                        Cập nhật câu
                                    </button>
                                </div>
                                <button onclick="testBuilderView.removeImageAssignment(${index})" class="absolute top-1 right-1 bg-slate-900/60 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition" title="Xóa ảnh khỏi đề">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- KHU VỰC 3: DỮ LIỆU CÂU HỎI THEO PART -->
                <div class="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm shadow-pink-50/50 space-y-5">
                    <div class="border-b border-pink-50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 class="text-sm font-bold text-slate-800 flex items-center space-x-2">
                                <i data-lucide="layers" class="w-4 h-4 text-pink-500"></i>
                                <span>3. Soạn nội dung & Mốc Audio từng Part (Part 1 ➔ Part 7)</span>
                            </h2>
                            <p class="text-xs text-slate-500">Mốc giây âm thanh: <code>audioStartTime</code> (bắt đầu) và <code>audioEndTime</code> (kết thúc). Để 0 nếu không có nghe.</p>
                        </div>
                        <button onclick="testBuilderView.loadPartTemplate()" class="bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 font-semibold px-4 py-2 rounded-2xl text-xs transition flex items-center space-x-1.5">
                            <i data-lucide="code" class="w-3.5 h-3.5"></i>
                            <span>Nạp Mẫu Gợi Ý Part ${this.activePart}</span>
                        </button>
                    </div>

                    <!-- 7 Tab Part -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        ${[1, 2, 3, 4, 5, 6, 7].map(part => {
                            const count = (exam.questions || []).filter(q => Number(q.part) === part).length;
                            const isActive = this.activePart === part;
                            return `
                                <button onclick="testBuilderView.switchPart(${part})" class="py-3 px-2 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1 ${isActive ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md shadow-pink-200' : 'bg-slate-50 hover:bg-pink-50/50 text-slate-700 border border-pink-100'}">
                                    <span class="text-sm">Part ${part}</span>
                                    <span class="text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-pink-100/60 text-pink-700'}">${count} câu</span>
                                </button>
                            `;
                        }).join('')}
                    </div>

                    <!-- Khung Nhập JSON -->
                    <div class="space-y-2">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-bold text-slate-700">Dữ liệu JSON câu hỏi <span class="text-pink-600">Part ${this.activePart}</span>:</span>
                            <span class="text-[11px] text-slate-400">Các trường: qNum, audioStartTime, audioEndTime, questionText, options, correctAnswer</span>
                        </div>
                        <textarea id="part-json-content" rows="14" class="w-full bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-pink-400 focus:outline-hidden leading-relaxed">${JSON.stringify(currentPartQuestions.length > 0 ? currentPartQuestions : this.partTemplates[this.activePart], null, 2)}</textarea>
                    </div>

                    <div class="flex justify-between items-center pt-2">
                        <p class="text-xs text-slate-400">Tổng cộng toàn đề: <strong class="text-pink-600 font-bold">${(exam.questions || []).length}</strong> / 200 câu</p>
                        <button onclick="testBuilderView.applyCurrentPartJson()" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-md">
                            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
                            <span>Cập nhật Part ${this.activePart}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // --- XỬ LÝ LOGIC ---

    // Đồng bộ và trích xuất danh sách ảnh từ các câu hỏi hiện có trong đề
    syncUploadedImagesFromQuestions() {
        const imageMap = new Map(); // url -> [qNums]
        (this.currentExam.questions || []).forEach(q => {
            const img = q.image || (typeof q.passage === 'string' && (q.passage.startsWith('data:image') || q.passage.startsWith('http')) ? q.passage : null);
            if (img) {
                if (!imageMap.has(img)) {
                    imageMap.set(img, []);
                }
                imageMap.get(img).push(Number(q.qNum));
            }
        });

        this.uploadedImages = [];
        let index = 1;
        imageMap.forEach((qList, url) => {
            qList.sort((a, b) => a - b);
            // Format dải câu ví dụ: "1" hoặc "147-148"
            let qStr = qList.length > 1 && qList[qList.length - 1] - qList[0] === qList.length - 1
                ? `${qList[0]}-${qList[qList.length - 1]}`
                : qList.join(', ');

            this.uploadedImages.push({
                name: `Ảnh minh họa ${index++}`,
                url: url,
                qNums: qStr
            });
        });
    },

    startCreateNew() {
        this.currentExam = {
            examId: "ets-2026-test-" + Math.floor(Math.random() * 1000),
            title: "ETS 2026 - Test 01",
            duration: 120,
            audioUrl: "",
            questions: []
        };
        this.uploadedImages = [];
        this.activePart = 1;
        this.mode = 'editor';
        this.refresh();
    },

    startEdit(examId) {
        const exam = ExamStore.getById(examId);
        if (!exam) return;
        this.currentExam = JSON.parse(JSON.stringify(exam));
        this.syncUploadedImagesFromQuestions(); // Nạp lại toàn bộ ảnh đang có trong đề
        this.activePart = 1;
        this.mode = 'editor';
        this.refresh();
    },

    backToList() {
        this.mode = 'list';
        this.refresh();
    },

    switchPart(partNum) {
        this.applyCurrentPartJson(false);
        this.activePart = partNum;
        this.refresh();
    },

    loadPartTemplate() {
        const textarea = document.getElementById('part-json-content');
        if (textarea) {
            textarea.value = JSON.stringify(this.partTemplates[this.activePart], null, 2);
            showToast(`Đã nạp mẫu code gợi ý Part ${this.activePart}`);
        }
    },

    applyCurrentPartJson(showAlert = true) {
        const textarea = document.getElementById('part-json-content');
        if (!textarea) return;

        try {
            const parsed = JSON.parse(textarea.value);
            const partQuestions = Array.isArray(parsed) ? parsed : [parsed];

            partQuestions.forEach(q => {
                q.part = Number(q.part) || this.activePart;
            });

            this.currentExam.questions = (this.currentExam.questions || []).filter(q => Number(q.part) !== this.activePart);
            this.currentExam.questions.push(...partQuestions);
            this.currentExam.questions.sort((a, b) => a.qNum - b.qNum);

            if (showAlert) {
                this.syncUploadedImagesFromQuestions();
                showToast(`Đã cập nhật câu hỏi Part ${this.activePart}`);
                this.refresh();
            }
        } catch (err) {
            alert(`Lỗi cú pháp JSON ở Part ${this.activePart}: ` + err.message);
        }
    },

    // Quản lý Audio & Tua mốc giây
    handleAudioFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target.result;
            document.getElementById('editor-audio-url').value = url;
            this.currentExam.audioUrl = url;
            this.updateAudioSrc(url);
            showToast(`Đã nạp file audio: ${file.name}`);
        };
        reader.readAsDataURL(file);
    },

    // Tự động nhận diện và chuyển link Google Drive thành Direct Stream
    formatDriveAudioUrl(url) {
        if (!url) return '';
        url = url.trim();
        if (url.startsWith('js/') || url.startsWith('./') || url.endsWith('.mp3')) {
            return url;
        }
        const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/uc\?export=download&id=)([a-zA-Z0-9_-]+)/;
        const match = url.match(driveRegex);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=open&id=${match[1]}`;
        }
        return url;
    },

    // Bắt sự kiện khi bạn gõ hoặc dán link Drive vào ô
    handleDriveLinkInput(val) {
        const directUrl = this.formatDriveAudioUrl(val);
        this.currentExam.audioUrl = directUrl;
        this.updateAudioSrc(directUrl);
    },

    // Nút "Tải Link" khi bấm vào
    applyDriveLinkNow() {
        const input = document.getElementById('editor-audio-url');
        if (!input || !input.value.trim()) {
            alert('Vui lòng dán link Google Drive vào ô!');
            return;
        }
        const directUrl = this.formatDriveAudioUrl(input.value);
        input.value = directUrl;
        this.currentExam.audioUrl = directUrl;
        this.updateAudioSrc(directUrl);
        showToast('Đã nhận diện link Google Drive thành công!');
    },

    updateAudioSrc(url) {
        this.currentExam.audioUrl = url;
        const player = document.getElementById('builder-audio-player');
        if (player) {
            player.src = url;
            player.load();
        }
    },
    copyCurrentSecond() {
        const player = document.getElementById('builder-audio-player');
        const sec = Math.floor(player ? player.currentTime : 0);
        navigator.clipboard.writeText(sec.toString());
        showToast(`Đã chép mốc giây: ${sec}s (dán vào audioStartTime hoặc audioEndTime)`);
    },

    // Quản lý ảnh
    handleMultiImages(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        let loaded = 0;
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedImages.push({
                    name: file.name,
                    url: e.target.result,
                    qNums: ''
                });
                loaded++;
                if (loaded === files.length) {
                    showToast(`Đã thêm ${files.length} ảnh vào danh sách`);
                    this.refresh();
                }
            };
            reader.readAsDataURL(file);
        });
    },

    // Cập nhật toàn bộ các ô nhập câu hỏi của tất cả ảnh đang có
    updateAllImageAssignments() {
        let updatedCount = 0;

        this.uploadedImages.forEach((imgItem, index) => {
            const input = document.getElementById(`img-qnum-${index}`);
            const val = input ? input.value.trim() : '';

            // Bỏ qua nếu ô để trống
            if (!val) return;

            // Gỡ ảnh này khỏi các câu cũ
            (this.currentExam.questions || []).forEach(q => {
                if (q.image === imgItem.url) q.image = "";
                if (q.passage === imgItem.url) q.passage = "";
            });

            // Phân tích dải số câu (VD: 147-148, hoặc 1,2,3 hoặc câu đơn)
            let targetQNums = [];
            if (val.includes('-')) {
                const [start, end] = val.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) targetQNums.push(i);
                }
            } else if (val.includes(',')) {
                targetQNums = val.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
            } else {
                const single = Number(val);
                if (!isNaN(single)) targetQNums.push(single);
            }

            // Gán ảnh vào các câu hỏi tương ứng
            targetQNums.forEach(qNum => {
                let found = this.currentExam.questions.find(q => Number(q.qNum) === qNum);
                if (found) {
                    found.image = imgItem.url;
                } else {
                    let part = 1;
                    if (qNum >= 7 && qNum <= 31) part = 2;
                    else if (qNum >= 32 && qNum <= 70) part = 3;
                    else if (qNum >= 71 && qNum <= 100) part = 4;
                    else if (qNum >= 101 && qNum <= 130) part = 5;
                    else if (qNum >= 131 && qNum <= 146) part = 6;
                    else if (qNum >= 147) part = 7;

                    this.currentExam.questions.push({
                        qNum: qNum,
                        part: part,
                        audioStartTime: 0,
                        audioEndTime: 30,
                        image: imgItem.url,
                        questionText: "",
                        options: ["(A)", "(B)", "(C)", "(D)"],
                        correctAnswer: "A"
                    });
                }
            });

            imgItem.qNums = val;
            updatedCount++;
        });

        if (updatedCount > 0) {
            this.currentExam.questions.sort((a, b) => a.qNum - b.qNum);
            showToast(`Thành công! Đã cập nhật câu hỏi cho ${updatedCount} hình ảnh.`);
            this.refresh();
        } else {
            alert('Vui lòng điền số câu cho ít nhất 1 ảnh trước khi cập nhật!');
        }
    },

    removeImageAssignment(index) {
        if (!confirm('Bạn có chắc muốn xóa ảnh này khỏi bài thi?')) return;
        const imgItem = this.uploadedImages[index];
        (this.currentExam.questions || []).forEach(q => {
            if (q.image === imgItem.url) q.image = "";
            if (q.passage === imgItem.url) q.passage = "";
        });
        this.uploadedImages.splice(index, 1);
        showToast('Đã xóa ảnh và gỡ liên kết khỏi câu hỏi');
        this.refresh();
    },

    handleFullJsonUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (Array.isArray(parsed)) {
                    this.currentExam.questions = parsed;
                } else {
                    this.currentExam = parsed;
                }
                this.syncUploadedImagesFromQuestions();
                showToast(`Nạp thành công đề từ ${file.name}`);
                this.refresh();
            } catch (err) {
                alert('Lỗi nạp file JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    },

    // 1. Phân tích văn bản thành mốc giây (Hỗ trợ Câu 1, Câu 32-34, mm:ss, hh:mm:ss)
    parseTimelineText(rawText) {
        const timeToSeconds = (str) => {
            const parts = str.trim().split(':').map(Number);
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            return Number(str) || 0;
        };

        // Nhận diện: Câu 1, Câu 32 - 34, Question 1... kèm mốc 00:01:37 - 00:02:02 hoặc 01:37-02:02
        const lineRegex = /(?:câu|question)?\s*(\d+)(?:\s*[-–]\s*(\d+))?[:\s\t|]+(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*(\d{1,2}:\d{2}(?::\d{2})?)/gi;
        
        const lines = rawText.split('\n');
        let count = 0;

        lines.forEach(line => {
            lineRegex.lastIndex = 0;
            const match = lineRegex.exec(line.trim());
            if (match) {
                const startQ = parseInt(match[1]);
                const endQ = match[2] ? parseInt(match[2]) : startQ;
                const startSec = timeToSeconds(match[3]);
                const endSec = timeToSeconds(match[4]);

                for (let qNum = startQ; qNum <= endQ; qNum++) {
                    let q = this.currentExam.questions.find(item => Number(item.qNum) === qNum);
                    if (!q) {
                        let part = 1;
                        if (qNum >= 7 && qNum <= 31) part = 2;
                        else if (qNum >= 32 && qNum <= 70) part = 3;
                        else if (qNum >= 71 && qNum <= 100) part = 4;
                        q = {
                            qNum: qNum,
                            part: part,
                            options: part === 2 ? ["(A)", "(B)", "(C)"] : ["(A)", "(B)", "(C)", "(D)"],
                            correctAnswer: "A"
                        };
                        this.currentExam.questions.push(q);
                    }
                    q.audioStartTime = startSec;
                    q.audioEndTime = endSec;
                    count++;
                }
            }
        });

        this.currentExam.questions.sort((a, b) => a.qNum - b.qNum);
        return count;
    },

    // 2. Nút kích hoạt cập nhật trực tiếp trên Web
    applyRawTimelineText() {
        const textarea = document.getElementById('raw-timeline-input');
        if (!textarea || !textarea.value.trim()) {
            alert("Vui lòng dán danh sách mốc thời gian vào ô!");
            return;
        }

        // Lưu lại văn bản hiện tại để không bị mất khi giao diện re-render
        this.rawTimelineText = textarea.value;

        const count = this.parseTimelineText(textarea.value);
        if (count > 0) {
            showToast(`Thành công! Đã tự động cập nhật mốc nghe cho ${count} câu hỏi.`);
            this.refresh();
        } else {
            alert("Không tìm thấy cú pháp hợp lệ. Vui lòng nhập theo mẫu:\nCâu 1: 00:01:37 - 00:02:02\nCâu 32 - 34: 00:14:00 - 00:15:13");
        }
    },

    // 3. Dán nhanh mẫu để kiểm tra
    pasteSampleTimeline() {
        const sample = `Câu 1: 00:01:37 - 00:02:02
Câu 2: 00:02:02 - 00:02:27
Câu 3: 00:02:34 - 00:03:01
Câu 7: 00:04:54 - 00:05:09
Câu 32 - 34: 00:14:00 - 00:15:13
Câu 71 - 73: 00:32:07 - 00:33:22`;
        const textarea = document.getElementById('raw-timeline-input');
        if (textarea) textarea.value = sample;
    },

    saveExam() {
        this.applyCurrentPartJson(false);

        const examId = (document.getElementById('editor-exam-id')?.value || this.currentExam.examId).trim();
        const title = (document.getElementById('editor-title')?.value || this.currentExam.title).trim();
        const duration = parseInt(document.getElementById('editor-duration')?.value) || 120;
        const audioUrl = (document.getElementById('editor-audio-url')?.value || this.currentExam.audioUrl).trim();

        if (!examId || !title) {
            alert('Vui lòng nhập Mã Đề và Tên Đề Thi!');
            return;
        }

        this.currentExam.examId = examId;
        this.currentExam.title = title;
        this.currentExam.duration = duration;
        this.currentExam.audioUrl = audioUrl;
        this.currentExam.type = this.currentExam.questions.length >= 100 ? 'Full Test (200 câu)' : 'Luyện tập theo Part';

        ExamStore.save(this.currentExam);
        showToast('Đã lưu đề thi thành công vào hệ thống!');
        this.mode = 'list';
        this.refresh();
    },

    deleteExam(examId) {
        if (confirm(`Bạn có chắc chắn muốn xóa đề thi [${examId}]?`)) {
            ExamStore.delete(examId);
            showToast('Đã xóa bài thi');
            this.refresh();
        }
    },

    refresh() {
        const app = document.getElementById('app') || document.getElementById('main-app');
        if (app) {
            app.innerHTML = this.render();
            this.afterRender();
        }
    },

    afterRender() {
        if (window.lucide) lucide.createIcons();
        const player = document.getElementById('builder-audio-player');
        const secDisplay = document.getElementById('builder-current-second');
        if (player && secDisplay) {
            player.ontimeupdate = () => {
                secDisplay.innerText = `${Math.floor(player.currentTime)}s`;
            };
        }
    }
};