const dashboardView = {
    // Hàm phụ trợ: Lấy chuỗi YYYY-MM-DD theo giờ địa phương (Local Time)
    getLocalDateString(dateInput = new Date()) {
        const d = new Date(dateInput);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Quản lý và tính toán Streak & Lịch sử hoạt động thực tế
    getActivityData() {
        const todayStr = this.getLocalDateString();
        let data = {
            currentStreak: 1,
            bestStreak: 1,
            lastActiveDate: todayStr,
            activeDates: [todayStr],
            dailyVocabCount: {}
        };

        try {
            const saved = localStorage.getItem('bong_toeic_user_activity');
            if (saved) {
                data = JSON.parse(saved);
                if (!Array.isArray(data.activeDates)) data.activeDates = [];
                if (!data.dailyVocabCount) data.dailyVocabCount = {};
            }
        } catch (e) {
            console.error('Lỗi đọc dữ liệu hoạt động:', e);
        }

        // Tính toán khoảng cách ngày để cập nhật streak
        if (data.lastActiveDate) {
            const lastDate = new Date(data.lastActiveDate);
            const today = new Date(todayStr);
            const diffTime = today.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

            if (diffDays === 0) {
                // Đã truy cập hôm nay, giữ nguyên chuỗi
            } else if (diffDays === 1) {
                // Truy cập ngày liên tiếp -> Tăng chuỗi
                data.currentStreak = (data.currentStreak || 0) + 1;
                data.lastActiveDate = todayStr;
                if (!data.activeDates.includes(todayStr)) data.activeDates.push(todayStr);
            } else if (diffDays > 1) {
                // Bỏ lỡ ít nhất 1 ngày -> Reset chuỗi về 1
                data.currentStreak = 1;
                data.lastActiveDate = todayStr;
                if (!data.activeDates.includes(todayStr)) data.activeDates.push(todayStr);
            }
        } else {
            data.currentStreak = 1;
            data.lastActiveDate = todayStr;
            data.activeDates = [todayStr];
        }

        if (data.currentStreak > (data.bestStreak || 0)) {
            data.bestStreak = data.currentStreak;
        }

        try {
            localStorage.setItem('bong_toeic_user_activity', JSON.stringify(data));
        } catch (e) {}

        return data;
    },

    // CẬP NHẬT TỨC THÌ CHO CẢ HAI VỊ TRÍ (NAVBAR Ở TRÊN VÀ WIDGET Ở DƯỚI)
    updateStreakRealtime() {
        const activity = this.getActivityData();
        const streakVal = activity.currentStreak || 0;

        // Cập nhật chuỗi ở thanh Header/Navbar phía trên
        const streakHeader = document.getElementById('streak-header-count');
        if (streakHeader) {
            streakHeader.textContent = streakVal;
        }

        // Cập nhật chuỗi ở widget Dashboard bên dưới
        const streakHome = document.getElementById('home-streak-num');
        if (streakHome) {
            streakHome.textContent = streakVal;
        }
    },

    // Lấy thống kê số từ vựng từ bộ nhớ SRS thực tế (chuẩn theo lịch tự nhiên)
    getVocabStats() {
        let srs = {};
        try {
            srs = JSON.parse(localStorage.getItem('bong_toeic_srs_progress') || '{}');
        } catch (e) {}

        const entries = Object.values(srs);
        const total = entries.length;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // Đầu tuần hiện tại (Thứ 2)
        const currentDayOfWeek = now.getDay(); // 0: CN, 1: T2, ...
        const daysSinceMonday = (currentDayOfWeek === 0 ? 7 : currentDayOfWeek) - 1;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday).getTime();

        // Đầu tháng hiện tại
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        // Đầu năm hiện tại
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

        const todayLearned = entries.filter(item => item.updatedAt && item.updatedAt >= startOfToday).length;
        const weekLearned = entries.filter(item => item.updatedAt && item.updatedAt >= startOfWeek).length;
        const monthLearned = entries.filter(item => item.updatedAt && item.updatedAt >= startOfMonth).length;
        const yearLearned = entries.filter(item => item.updatedAt && item.updatedAt >= startOfYear).length;

        return {
            today: todayLearned,
            week: weekLearned,
            month: monthLearned,
            totalYear: yearLearned || total
        };
    },

    // TÍNH TOÁN TIẾN ĐỘ LUYỆN ĐỀ HOÀN TOÀN THEO SỐ CÂU THỰC TẾ TRONG KHO ĐỀ
    getExamPartStats() {
        const totalQuestionsByPart = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

        if (window.ExamStore && typeof ExamStore.getAll === 'function') {
            const exams = ExamStore.getAll() || [];
            exams.forEach(exam => {
                (exam.questions || []).forEach(q => {
                    const p = Number(q.part);
                    if (totalQuestionsByPart[p] !== undefined) {
                        totalQuestionsByPart[p]++;
                    }
                });
            });
        }

        let answeredQuestions = {};
        try {
            answeredQuestions = JSON.parse(localStorage.getItem('bong_toeic_answered_questions') || '{}');
        } catch (e) {}

        const doneCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        Object.keys(answeredQuestions).forEach(key => {
            const item = answeredQuestions[key];
            const p = Number(item.part);
            if (doneCounts[p] !== undefined) {
                doneCounts[p]++;
            }
        });

        const p1Total = totalQuestionsByPart[1];
        const p1Done = Math.min(doneCounts[1], p1Total);

        const p2Total = totalQuestionsByPart[2];
        const p2Done = Math.min(doneCounts[2], p2Total);

        const p34Total = totalQuestionsByPart[3] + totalQuestionsByPart[4];
        const p34Done = Math.min(doneCounts[3] + doneCounts[4], p34Total);

        const p5Total = totalQuestionsByPart[5];
        const p5Done = Math.min(doneCounts[5], p5Total);

        const p6Total = totalQuestionsByPart[6];
        const p6Done = Math.min(doneCounts[6], p6Total);

        const p7Total = totalQuestionsByPart[7];
        const p7Done = Math.min(doneCounts[7], p7Total);

        const totalAll = p1Total + p2Total + p34Total + p5Total + p6Total + p7Total;
        const doneAll = p1Done + p2Done + p34Done + p5Done + p6Done + p7Done;
        const overallPercent = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

        const listeningTotal = p1Total + p2Total + p34Total;
        const listeningDone = p1Done + p2Done + p34Done;
        const readingTotal = p5Total + p6Total + p7Total;
        const readingDone = p5Done + p6Done + p7Done;

        const getPercent = (done, total) => total > 0 ? Math.round((done / total) * 100) : 0;

        return {
            overallPercent,
            totalAll,
            listening: {
                total: listeningTotal,
                done: listeningDone,
                percent: getPercent(listeningDone, listeningTotal)
            },
            reading: {
                total: readingTotal,
                done: readingDone,
                percent: getPercent(readingDone, readingTotal)
            },
            parts: [
                {
                    name: 'Part 1: Photographs',
                    total: p1Total,
                    done: p1Done,
                    percent: getPercent(p1Done, p1Total)
                },
                {
                    name: 'Part 2: Question-Response',
                    total: p2Total,
                    done: p2Done,
                    percent: getPercent(p2Done, p2Total)
                },
                {
                    name: 'Part 3 & 4: Conversations & Talks',
                    total: p34Total,
                    done: p34Done,
                    percent: getPercent(p34Done, p34Total)
                },
                {
                    name: 'Part 5: Incomplete Sentences',
                    total: p5Total,
                    done: p5Done,
                    percent: getPercent(p5Done, p5Total)
                },
                {
                    name: 'Part 6: Text Completion',
                    total: p6Total,
                    done: p6Done,
                    percent: getPercent(p6Done, p6Total)
                },
                {
                    name: 'Part 7: Reading Comprehension',
                    total: p7Total,
                    done: p7Done,
                    percent: getPercent(p7Done, p7Total)
                }
            ]
        };
    },

    // Tạo HTML cho lịch hiển thị đầy đủ ngày trong tháng
    renderFullMonthCalendar(activeDates) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const todayDate = now.getDate();

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const startOffset = (firstDayOfWeek === 0 ? 7 : firstDayOfWeek) - 1;

        let cellsHtml = '';

        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            cellsHtml += `<div class="py-1.5 text-pink-200 font-medium text-[11px]">${prevMonthDays - i}</div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isActive = activeDates.includes(formattedDate);
            const isToday = (d === todayDate);

            if (isToday) {
                cellsHtml += `
                    <div class="py-1.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-extrabold rounded-xl shadow-sm shadow-pink-200 text-xs relative">
                        ${d}
                        ${isActive ? '<span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>' : ''}
                    </div>
                `;
            } else if (isActive) {
                cellsHtml += `
                    <div class="py-1.5 bg-pink-50 text-pink-700 font-bold rounded-xl text-xs relative border border-pink-200/50">
                        ${d}
                        <span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-pink-500 rounded-full"></span>
                    </div>
                `;
            } else {
                cellsHtml += `
                    <div class="py-1.5 text-slate-600 font-medium text-xs hover:bg-pink-50/60 rounded-xl transition">
                        ${d}
                    </div>
                `;
            }
        }

        return `
            <div class="grid grid-cols-7 gap-1 text-center">
                <span class="font-semibold text-pink-400 py-1 text-xs">T2</span>
                <span class="font-semibold text-pink-400 py-1 text-xs">T3</span>
                <span class="font-semibold text-pink-400 py-1 text-xs">T4</span>
                <span class="font-semibold text-pink-400 py-1 text-xs">T5</span>
                <span class="font-semibold text-pink-400 py-1 text-xs">T6</span>
                <span class="font-semibold text-pink-400 py-1 text-xs">T7</span>
                <span class="font-semibold text-pink-400 py-1 text-xs">CN</span>
                ${cellsHtml}
            </div>
        `;
    },

    render() {
        const activity = this.getActivityData();
        const vocabStats = this.getVocabStats();
        const examStats = this.getExamPartStats();

        const currentStreak = activity.currentStreak || 0;
        const bestStreak = activity.bestStreak || currentStreak;
        const isBroken = currentStreak <= 0;

        const flameIconHtml = isBroken 
            ? `<span class="text-2xl grayscale opacity-40 inline-block filter" title="Đã mất chuỗi">🔥</span>`
            : `<span class="text-2xl animate-pulse inline-block">🔥</span>`;

        const streakStatusText = isBroken
            ? 'Chuỗi bị ngắt quãng! Hãy học ngay hôm nay để thắp lại ngọn lửa.'
            : (currentStreak > 1 ? 'Tuyệt vời! Bạn đang duy trì phong độ rất tốt.' : 'Bắt đầu ngày đầu tiên của chuỗi mới!');

        const now = new Date();
        const currentMonthYear = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

        // Lấy dữ liệu học thực tế từ LocalStorage theo từng ngày (tính theo giờ địa phương)
        let srsProgress = {};
        try {
            srsProgress = JSON.parse(localStorage.getItem('bong_toeic_srs_progress') || '{}');
        } catch (e) {}

        const actualDailyCounts = {};
        Object.values(srsProgress).forEach(item => {
            if (item.updatedAt) {
                const dateKey = this.getLocalDateString(new Date(item.updatedAt));
                actualDailyCounts[dateKey] = (actualDailyCounts[dateKey] || 0) + 1;
            }
        });

        // Tạo danh sách 7 ngày vừa qua theo giờ địa phương
        const daysMap = [];
        const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = this.getLocalDateString(d);
            const isToday = (i === 0);
            const dayOfWeek = dayNames[d.getDay()];
            // Đồng bộ: nếu là hôm nay thì lấy chuẩn theo vocabStats.today
            const count = isToday ? vocabStats.today : (actualDailyCounts[dateStr] || 0);
            const formattedDate = `${d.getDate()}/${d.getMonth() + 1}`;
            const label = isToday ? 'Hôm nay' : `${dayOfWeek} (${formattedDate})`;

            daysMap.push({
                label,
                val: count,
                isToday
            });
        }

        const sumCount = daysMap.reduce((acc, d) => acc + d.val, 0);
        const averagePerDay = Math.round(sumCount / 7);
        const maxVal = Math.max(...daysMap.map(d => d.val), 20);

        return `
            <div class="space-y-6">
                <!-- Banner & Streak Tracker -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-300 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-pink-200/50 relative overflow-hidden flex flex-col justify-between">
                        <div class="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div>
                            <div class="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-4 border border-white/20">
                                <span class="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
                                <span>Mục tiêu TOEIC 900+ năm 2026 (Pink Theme)</span>
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">Chào bạn! ✨</h1>
                            <p class="text-pink-50 text-sm sm:text-base max-w-xl">Chào mừng bạn trở lại! Tiếp tục hành trình luyện đề và ôn tập từ vựng hôm nay nhé.</p>
                        </div>
                        <div class="mt-6 flex flex-wrap gap-3">
                            <button onclick="navigateTo('exam')" class="bg-white text-pink-600 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-pink-900/10 hover:bg-pink-50 transition flex items-center space-x-2">
                                <i data-lucide="play-circle" class="w-4 h-4 text-pink-500"></i>
                                <span>Tiếp tục luyện đề</span>
                            </button>
                        </div>
                    </div>

                    <!-- Streak Tracker Widget -->
                    <div class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm shadow-pink-50 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-bold text-slate-800 flex items-center space-x-2">
                                    ${flameIconHtml}
                                    <span class="${isBroken ? 'text-slate-500' : 'text-slate-800'}">Chuỗi Streak</span>
                                </h3>
                                <span class="text-xs bg-pink-50 text-pink-700 font-semibold px-2.5 py-1 rounded-full border border-pink-200/70">Kỷ lục: <span>${bestStreak}</span> ngày</span>
                            </div>
                            <div class="flex items-center space-x-4 my-4">
                                <div class="w-16 h-16 rounded-2xl ${isBroken ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-pink-50 border-pink-200/70 text-pink-600'} border flex flex-col items-center justify-center font-extrabold text-2xl shadow-inner">
                                    <span id="home-streak-num">${currentStreak}</span>
                                    <span class="text-[10px] uppercase font-semibold ${isBroken ? 'text-slate-400' : 'text-pink-500'}">Ngày</span>
                                </div>
                                <div>
                                    <p class="text-sm font-bold ${isBroken ? 'text-slate-500' : 'text-slate-800'}">${isBroken ? 'Mất chuỗi' : 'Duy trì đều đặn!'}</p>
                                    <p class="text-xs text-slate-500 mt-0.5">${streakStatusText}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-pink-50/80 border border-pink-100 rounded-2xl p-3 text-xs text-pink-800 flex items-center space-x-2">
                            <i data-lucide="sparkles" class="w-4 h-4 text-pink-500 shrink-0"></i>
                            <span>Gợi ý: Hãy duy trì ôn ít nhất 10 từ hôm nay để giữ chuỗi ngọn lửa hồng rực!</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Access 4 Modes -->
                <div>
                    <h2 class="text-lg font-bold text-slate-800 mb-3 flex items-center space-x-2">
                        <i data-lucide="compass" class="w-5 h-5 text-pink-500"></i>
                        <span>Truy cập nhanh kỹ năng TOEIC</span>
                    </h2>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div onclick="navigateTo('exam')" class="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50/30 hover:shadow-md hover:border-pink-300 transition cursor-pointer group">
                            <div class="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-3 group-hover:bg-pink-500 group-hover:text-white transition">
                                <i data-lucide="headphones" class="w-6 h-6"></i>
                            </div>
                            <h3 class="font-bold text-slate-800 text-base">Nghe (Listening)</h3>
                            <p class="text-xs text-slate-500 mt-1">Part 1 đến Part 4</p>
                        </div>
                        <div onclick="navigateTo('exam')" class="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50/30 hover:shadow-md hover:border-pink-300 transition cursor-pointer group">
                            <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-500 group-hover:text-white transition">
                                <i data-lucide="book-open-check" class="w-6 h-6"></i>
                            </div>
                            <h3 class="font-bold text-slate-800 text-base">Đọc (Reading)</h3>
                            <p class="text-xs text-slate-500 mt-1">Part 5, 6, 7</p>
                        </div>
                        <div onclick="navigateTo('tutor')" class="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50/30 hover:shadow-md hover:border-pink-300 transition cursor-pointer group">
                            <div class="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-3 group-hover:bg-pink-500 group-hover:text-white transition">
                                <i data-lucide="mic" class="w-6 h-6"></i>
                            </div>
                            <h3 class="font-bold text-slate-800 text-base">Nói (Speaking)</h3>
                            <p class="text-xs text-slate-500 mt-1">AI chấm phát âm & ngữ điệu</p>
                        </div>
                        <div onclick="navigateTo('tutor')" class="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm shadow-pink-50/30 hover:shadow-md hover:border-pink-300 transition cursor-pointer group">
                            <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-500 group-hover:text-white transition">
                                <i data-lucide="pen-tool" class="w-6 h-6"></i>
                            </div>
                            <h3 class="font-bold text-slate-800 text-base">Viết (Writing)</h3>
                            <p class="text-xs text-slate-500 mt-1">AI nhận xét email & bài luận</p>
                        </div>
                    </div>
                </div>

                <!-- Detailed Part Progress & Calendar & Vocabulary Stats -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div class="lg:col-span-2 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm shadow-pink-50/50 flex flex-col justify-between h-full">
                        <div>
                            <div class="flex items-center justify-between pb-3 border-b border-pink-50 mb-5">
                                <h3 class="font-bold text-slate-800 flex items-center space-x-2 text-sm sm:text-base">
                                    <i data-lucide="bar-chart-3" class="w-5 h-5 text-pink-500"></i>
                                    <span>Tiến độ ôn tập chi tiết theo Part TOEIC</span>
                                </h3>
                                <span class="text-xs font-bold text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200/60">
                                    Hoàn thành: ${examStats.overallPercent}%
                                </span>
                            </div>

                            <div class="space-y-4 sm:space-y-5">
                                ${examStats.parts.map(p => {
                                    let textClass = 'text-pink-600';
                                    let barBgClass = 'bg-gradient-to-r from-pink-400 to-rose-400';

                                    if (p.total === 0) {
                                        textClass = 'text-slate-400';
                                        barBgClass = 'bg-slate-300';
                                    } else if (p.percent >= 90) {
                                        textClass = 'text-emerald-600';
                                        barBgClass = 'bg-emerald-500';
                                    } else if (p.percent >= 50) {
                                        textClass = 'text-amber-600';
                                        barBgClass = 'bg-amber-500';
                                    }

                                    return `
                                        <div>
                                            <div class="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                                <span>${p.name} (${p.total} câu)</span>
                                                <span class="${textClass} font-bold">${p.percent}% (Đã làm ${p.done}/${p.total})</span>
                                            </div>
                                            <div class="w-full bg-pink-50/80 h-3 rounded-full overflow-hidden border border-pink-100 p-0.5">
                                                <div class="${barBgClass} h-full rounded-full transition-all duration-500" style="width: ${p.percent}%"></div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div class="mt-6 pt-5 border-t border-pink-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div class="bg-pink-50/50 rounded-2xl p-3 border border-pink-100 flex items-center space-x-3">
                                <div class="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                                    <i data-lucide="headphones" class="w-4 h-4"></i>
                                </div>
                                <div class="min-w-0">
                                    <span class="text-[11px] text-slate-500 font-medium block truncate">Kỹ năng Nghe</span>
                                    <p class="text-xs font-bold text-slate-800">${examStats.listening.done}/${examStats.listening.total} câu <span class="text-pink-600 font-bold">(${examStats.listening.percent}%)</span></p>
                                </div>
                            </div>

                            <div class="bg-pink-50/50 rounded-2xl p-3 border border-pink-100 flex items-center space-x-3">
                                <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                    <i data-lucide="book-open" class="w-4 h-4"></i>
                                </div>
                                <div class="min-w-0">
                                    <span class="text-[11px] text-slate-500 font-medium block truncate">Kỹ năng Đọc</span>
                                    <p class="text-xs font-bold text-slate-800">${examStats.reading.done}/${examStats.reading.total} câu <span class="text-pink-600 font-bold">(${examStats.reading.percent}%)</span></p>
                                </div>
                            </div>

                            <button onclick="navigateTo('exam')" class="bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white font-bold p-3 rounded-2xl text-xs shadow-md shadow-pink-200 transition flex items-center justify-center space-x-2 group">
                                <span>Luyện đề ngay</span>
                                <i data-lucide="chevron-right" class="w-4 h-4 group-hover:translate-x-1 transition"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Calendar Widget & Vocab Milestones -->
                    <div class="space-y-6 flex flex-col justify-between">
                        <div class="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm shadow-pink-50/50">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="font-bold text-slate-800 text-sm flex items-center space-x-2">
                                    <i data-lucide="calendar" class="w-4 h-4 text-pink-500"></i>
                                    <span>Lịch hoạt động ${currentMonthYear}</span>
                                </h3>
                                <span class="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">Hôm nay</span>
                            </div>
                            ${this.renderFullMonthCalendar(activity.activeDates || [])}
                        </div>

                        <div class="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm shadow-pink-50/50">
                            <h3 class="font-bold text-slate-800 text-sm mb-3 flex items-center space-x-2">
                                <i data-lucide="book-marked" class="w-4 h-4 text-pink-500"></i>
                                <span>Thống kê từ vựng đã học</span>
                            </h3>
                            <div class="grid grid-cols-2 gap-3 text-center">
                                <div class="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                                    <span class="text-xs text-slate-500">Hôm nay</span>
                                    <p class="text-lg font-bold text-pink-600">${vocabStats.today} từ</p>
                                </div>
                                <div class="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                                    <span class="text-xs text-slate-500">Tuần này</span>
                                    <p class="text-lg font-bold text-pink-600">${vocabStats.week} từ</p>
                                </div>
                                <div class="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                                    <span class="text-xs text-slate-500">Tháng này</span>
                                    <p class="text-lg font-bold text-pink-600">${vocabStats.month} từ</p>
                                </div>
                                <div class="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                                    <span class="text-xs text-slate-500">Tổng năm</span>
                                    <p class="text-lg font-bold text-pink-600">${vocabStats.totalYear} từ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Vocabulary Bar Chart -->
                <div class="bg-white rounded-3xl p-4 sm:p-6 border border-pink-100 shadow-sm shadow-pink-50/50 overflow-hidden">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
                        <div>
                            <h3 class="font-bold text-slate-800 flex items-center space-x-2 text-sm sm:text-base">
                                <i data-lucide="trending-up" class="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 shrink-0"></i>
                                <span>Biểu đồ từ vựng 7 ngày qua</span>
                            </h3>
                            <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Thống kê số lượng từ thực tế nạp vào bộ nhớ.</p>
                        </div>
                        <span class="self-start sm:self-auto text-[11px] sm:text-xs bg-pink-50 text-pink-700 font-semibold px-2.5 py-1 rounded-full border border-pink-200/70">
                            Trung bình: ${averagePerDay} từ/ngày
                        </span>
                    </div>

                    <div class="w-full overflow-x-auto no-scrollbar">
                        <div class="h-44 sm:h-48 min-w-[320px] flex items-end justify-between pt-6 px-1 sm:px-6 border-b border-pink-100 gap-1.5 sm:gap-2">
                            ${daysMap.map((item) => {
                                const percent = item.val > 0 ? Math.min(100, Math.max(12, Math.round((item.val / maxVal) * 100))) : 4;
                                return `
                                    <div class="flex flex-col items-center space-y-1.5 sm:space-y-2 flex-1 h-full justify-end min-w-0">
                                        <span class="text-[11px] sm:text-xs font-bold ${item.isToday ? 'text-pink-600 font-extrabold text-xs sm:text-sm' : 'text-pink-400'}">
                                            ${item.val}
                                        </span>
                                        <div class="w-full max-w-[32px] sm:max-w-[44px] ${item.isToday ? 'bg-gradient-to-t from-rose-400 to-pink-400 shadow-md shadow-pink-200' : 'bg-pink-200/70 hover:bg-pink-300'} rounded-t-lg sm:rounded-t-xl transition-all duration-500 min-h-[6px]" style="height: ${percent}%;"></div>
                                        <span class="text-[9px] sm:text-xs ${item.isToday ? 'text-slate-800 font-bold' : 'text-slate-500'} text-center leading-tight truncate w-full px-0.5" title="${item.label}">
                                            ${item.isToday ? 'Hôm nay' : item.label.replace('Thứ ', 'T')}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }

        // Cập nhật giá trị chuỗi ngay lập tức khi render xong
        this.updateStreakRealtime();

        // Đăng ký sự kiện lắng nghe để cập nhật theo thời gian thực mỗi khi có thay đổi dữ liệu
        if (!this._hasBoundStreakListeners) {
            this._hasBoundStreakListeners = true;

            // 1. Đồng bộ khi các tab hoặc module khác ghi vào LocalStorage
            window.addEventListener('storage', (e) => {
                if (['bong_toeic_user_activity', 'bong_toeic_srs_progress', 'bong_toeic_answered_questions'].includes(e.key)) {
                    this.updateStreakRealtime();
                }
            });

            // 2. Đồng bộ khi có CustomEvent được dispatch trong cùng một ứng dụng
            window.addEventListener('activityUpdated', () => {
                this.updateStreakRealtime();
            });
        }
    }
};

// Đảm bảo chạy ngay khi trang tải xong lần đầu để thanh chuỗi ở trên luôn chuẩn xác
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboardView.updateStreakRealtime();
    });
    // Gọi ngay lập tức nếu DOM đã sẵn sàng
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        dashboardView.updateStreakRealtime();
    }
}