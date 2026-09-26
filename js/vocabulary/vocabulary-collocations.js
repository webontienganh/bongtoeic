// Khởi tạo kho chung nếu chưa có
window.ALL_COMMUNITY_VOCABS = window.ALL_COMMUNITY_VOCABS || [];

// Tự đăng ký chính nó vào kho
window.ALL_COMMUNITY_VOCABS.push({
    id: 'collocations',
    name: 'Collocations',
    description: 'Sự kết hợp từ thông dụng với động từ DO & MAKE',
    sets: [
        {
            id: 'collocations-do',
            name: 'DO Collocations',
            desc: 'Danh sách 20 cụm từ đi với động từ DO thông dụng nhất',
            words: [
                { en: 'Do an assignment', vn: 'làm một nhiệm vụ được giao', pronun: '/duː ən əˈsaɪnmənt/', type: 'collocation', example: 'Students have to do an assignment on climate change.', synonym: 'carry out a task, complete an assignment', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do business (with)', vn: 'kinh doanh, làm ăn (với)', pronun: '/duː ˈbɪznəs/', type: 'collocation', example: 'It is a pleasure to do business with your company.', synonym: 'trade with, deal with', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do one’s best', vn: 'cố gắng hết sức', pronun: '/duː wʌnz bɛst/', type: 'collocation', example: 'Don’t worry about the result, just do your best.', synonym: 'try one’s hardest, make every effort', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do a crossword', vn: 'chơi ô chữ, giải ô chữ', pronun: '/duː ə ˈkrɒswɜːd/', type: 'collocation', example: 'My grandfather likes to do a crossword every morning.', synonym: 'solve a puzzle, complete a crossword', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do damage', vn: 'gây thiệt hại', pronun: '/duː ˈdæmɪʤ/', type: 'collocation', example: 'The storm did severe damage to the local crops.', synonym: 'cause harm, inflict damage', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do a course', vn: 'theo một khóa học', pronun: '/duː ə kɔːs/', type: 'collocation', example: 'I decided to do a course in digital marketing.', synonym: 'take a course, enroll in a class', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do history/economics', vn: 'học lịch sử / kinh tế học...', pronun: '/duː ˈhɪstəri / ˌiːkəˈnɒmɪks/', type: 'collocation', example: 'She is doing history at Oxford University.', synonym: 'study, major in', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do an experiment', vn: 'làm thí nghiệm', pronun: '/duː ən ɪksˈpɛrɪmənt/', type: 'collocation', example: 'The scientists are doing an experiment on plant growth.', synonym: 'conduct an experiment, carry out tests', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do good', vn: 'bổ ích, có lợi, làm việc tốt', pronun: '/duː ɡʊd/', type: 'collocation', example: 'A little fresh air will do you good.', synonym: 'be beneficial, bring benefit', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do harm', vn: 'gây hại', pronun: '/duː hɑːm/', type: 'collocation', example: 'Eating too much sugar can do serious harm to your teeth.', synonym: 'cause damage, hurt', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do a job', vn: 'làm một công việc', pronun: '/duː ə ʤɒb/', type: 'collocation', example: 'He did a great job renovating the house.', synonym: 'perform a task, execute work', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do one’s duty', vn: 'làm nghĩa vụ, thực hiện bổn phận', pronun: '/duː wʌnz ˈdjuːti/', type: 'collocation', example: 'The soldiers were proud to do their duty.', synonym: 'fulfill obligation, discharge responsibility', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do one’s hair', vn: 'làm tóc, chải chuốt tạo kiểu tóc', pronun: '/duː wʌnz heə/', type: 'collocation', example: 'She spent an hour doing her hair before the party.', synonym: 'style one’s hair, fix one’s hair', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do one’s homework', vn: 'làm bài tập về nhà', pronun: '/duː wʌnz ˈhəʊmˌwɜːk/', type: 'collocation', example: 'Have you finished doing your homework yet?', synonym: 'complete assignments, study at home', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do research', vn: 'nghiên cứu', pronun: '/duː rɪˈsɜːʧ/', type: 'collocation', example: 'They are doing research into renewable energy sources.', synonym: 'conduct research, investigate', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do someone a favour', vn: 'làm giúp ai điều gì, giúp đỡ ai', pronun: '/duː ˈsʌmwʌn ə ˈfeɪvə/', type: 'collocation', example: 'Could you do me a favour and lend me your pen?', synonym: 'help someone out, give a hand', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do the shopping', vn: 'mua sắm (đặc biệt là đồ tạp hóa/sinh hoạt)', pronun: '/duː ðə ˈʃɒpɪŋ/', type: 'collocation', example: 'I usually do the shopping on Saturday mornings.', synonym: 'buy groceries, go shopping', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do wonders/miracles', vn: 'mang lại kết quả kì diệu', pronun: '/duː ˈwʌndəz / ˈmɪrəklz/', type: 'collocation', example: 'A good night’s sleep can do wonders for your health.', synonym: 'work wonders, produce miraculous results', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do without', vn: 'làm/sống mà không có cái gì', pronun: '/duː wɪˈðaʊt/', type: 'phr.v', example: 'There is no coffee left, so we will have to do without.', synonym: 'manage without, forgo', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Do wrong', vn: 'làm sai, phạm lỗi', pronun: '/duː rɒŋ/', type: 'collocation', example: 'He apologized sincerely when he realized he had done wrong.', synonym: 'make a mistake, err, commit a fault', srsLevel: 0, nextReviewTime: 0 }
            ]
        },
        {
            id: 'collocations-make',
            name: 'MAKE Collocations',
            desc: 'Danh sách các cụm từ đi với động từ MAKE thông dụng',
            words: [
                { en: 'Make an appointment', vn: 'thu xếp một cuộc hẹn', pronun: '/meɪk ən əˈpɔɪnt.mənt/', type: 'collocation', example: 'I need to make an appointment with the doctor.', synonym: 'schedule a meeting, book an appointment', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make an attempt', vn: 'cố gắng, nỗ lực', pronun: '/meɪk ən əˈtempt/', type: 'collocation', example: 'They made an attempt to finish the project on time.', synonym: 'try, strive, endeavor', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make an announcement', vn: 'thông báo', pronun: '/meɪk ən əˈnaʊns.mənt/', type: 'collocation', example: 'The principal will make an announcement after lunch.', synonym: 'declare, broadcast, proclaim', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make the bed', vn: 'dọn giường', pronun: '/meɪk ðə bed/', type: 'collocation', example: 'He makes the bed every morning right after waking up.', synonym: 'tidy the bed, arrange the sheets', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a cake', vn: 'làm bánh', pronun: '/meɪk ə keɪk/', type: 'collocation', example: 'She made a chocolate cake for her brother’s birthday.', synonym: 'bake a cake', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make changes', vn: 'thay đổi', pronun: '/meɪk ˈtʃeɪn.dʒɪz/', type: 'collocation', example: 'We need to make some changes to the current schedule.', synonym: 'alter, modify, adjust', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a choice', vn: 'chọn lựa', pronun: '/meɪk ə tʃɔɪs/', type: 'collocation', example: 'You have to make a choice between the two offers.', synonym: 'choose, select, pick', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a decision', vn: 'quyết định', pronun: '/meɪk ə dɪˈsɪʒ.ən/', type: 'collocation', example: 'It took them a long time to make a decision.', synonym: 'decide, resolve, settle on', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a comment', vn: 'nhận xét', pronun: '/meɪk ə ˈkɒm.ent/', type: 'collocation', example: 'The manager declined to make a comment on the rumor.', synonym: 'remark, observe, state', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a complaint', vn: 'phàn nàn, than phiền', pronun: '/meɪk ə kəmˈpleɪnt/', type: 'collocation', example: 'Customers can make a complaint via the online portal.', synonym: 'complain, protest, object', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a comparison', vn: 'so sánh', pronun: '/meɪk ə kəmˈpær.ɪ.sən/', type: 'collocation', example: 'It is difficult to make a direct comparison between the two cities.', synonym: 'compare, draw a parallel', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a contribution', vn: 'đóng góp vào', pronun: '/meɪk ə ˌkɒn.trɪˈbjuː.ʃən/', type: 'collocation', example: 'She made a major contribution to the research team.', synonym: 'contribute, donate, pitch in', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a difference', vn: 'tạo sự khác biệt', pronun: '/meɪk ə ˈdɪf.ər.əns/', type: 'collocation', example: 'Small acts of kindness can make a huge difference.', synonym: 'have an impact, matter, count', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a distinction', vn: 'tạo sự khác biệt/sự tương phản', pronun: '/meɪk ə dɪˈstɪŋk.ʃən/', type: 'collocation', example: 'You must make a distinction between fact and opinion.', synonym: 'differentiate, distinguish, discriminate', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make an effort', vn: 'nỗ lực', pronun: '/meɪk ən ˈef.ət/', type: 'collocation', example: 'He is making an effort to improve his English pronunciation.', synonym: 'try hard, strive, endeavor', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make an excuse', vn: 'viện cớ', pronun: '/meɪk ən ɪkˈskjuːs/', type: 'collocation', example: 'Stop making excuses and start taking responsibility.', synonym: 'rationalize, justify, feign', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a law', vn: 'thông qua đạo luật', pronun: '/meɪk ə lɔː/', type: 'collocation', example: 'Parliament voted to make a new law regarding traffic safety.', synonym: 'pass a law, enact legislation, legislate', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a mistake', vn: 'mắc sai lầm', pronun: '/meɪk ə mɪˈsteɪk/', type: 'collocation', example: 'Everyone makes a mistake from time to time.', synonym: 'blunder, slip up, err', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make money', vn: 'kiếm tiền', pronun: '/meɪk ˈmʌn.i/', type: 'collocation', example: 'He started an online store to make extra money.', synonym: 'earn money, generate income, turn a profit', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make progress', vn: 'tiến bộ', pronun: '/meɪk ˈprəʊ.ɡres/', type: 'collocation', example: 'She has made great progress in learning piano.', synonym: 'advance, improve, develop', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a plan', vn: 'lập kế hoạch', pronun: '/meɪk ə plæn/', type: 'collocation', example: 'We need to make a plan before starting the project.', synonym: 'devise a plan, map out, strategize', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a phone call', vn: 'gọi điện thoại', pronun: '/meɪk ə fəʊn kɔːl/', type: 'collocation', example: 'Excuse me for a moment, I need to make a phone call.', synonym: 'dial, place a call, ring someone up', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make preparations for', vn: 'chuẩn bị cho', pronun: '/meɪk ˌprep.ərˈeɪ.ʃənz fɔːr/', type: 'collocation', example: 'The team is busy making preparations for the exhibition.', synonym: 'prepare for, get ready for, arrange for', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a profit', vn: 'thu lợi nhuận', pronun: '/meɪk ə ˈprɒf.ɪt/', type: 'collocation', example: 'The company managed to make a profit in its second quarter.', synonym: 'gain profit, yield returns, earn a margin', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a promise', vn: 'hứa hẹn', pronun: '/meɪk ə ˈprɒm.ɪs/', type: 'collocation', example: 'Never make a promise if you are not sure you can keep it.', synonym: 'pledge, vow, commit', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a speech', vn: 'đọc bài diễn văn', pronun: '/meɪk ə spiːtʃ/', type: 'collocation', example: 'The CEO will make a speech at the opening ceremony.', synonym: 'give a speech, deliver an address, speak publicly', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make noise', vn: 'làm ồn', pronun: '/meɪk nɔɪz/', type: 'collocation', example: 'Please try not to make noise while the baby is sleeping.', synonym: 'cause a racket, be loud, clamor', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a start', vn: 'khởi hành', pronun: '/meɪk ə stɑːt/', type: 'collocation', example: 'We must make an early start tomorrow morning to beat traffic.', synonym: 'set off, embark, commence', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a suggestion', vn: 'đề nghị', pronun: '/meɪk ə səˈdʒes.tʃən/', type: 'collocation', example: 'Can I make a suggestion regarding our marketing campaign?', synonym: 'propose, put forward, recommend', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make a will', vn: 'làm di chúc', pronun: '/meɪk ə wɪl/', type: 'collocation', example: 'He went to a solicitor to make a will.', synonym: 'draw up a will, draft a testament', srsLevel: 0, nextReviewTime: 0 },
                { en: "Make up one's mind", vn: 'quyết định', pronun: '/meɪk ʌp wʌnz maɪnd/', type: 'idiom', example: 'She finally made up her mind to study abroad.', synonym: 'reach a decision, resolve, determine', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Make use of', vn: 'sử dụng', pronun: '/meɪk juːs ɒv/', type: 'collocation', example: 'We should make use of the resources available to us.', synonym: 'utilize, leverage, exploit', srsLevel: 0, nextReviewTime: 0 },
            ]
        },
        {
            id: 'collocations-take',
            name: 'TAKE Collocations',
            desc: 'Danh sách các cụm từ đi với động từ TAKE thông dụng',
            words: [
                { en: 'Take sb/sth for granted', vn: 'xem ai/ cái gì là tất nhiên', pronun: '/teɪk fɔːr ˈɡrɑːn.tɪd/', type: 'idiom', example: 'Never take your health or your family for granted.', synonym: 'undervalue, assume, fail to appreciate', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take place', vn: 'xảy ra, diễn ra', pronun: '/teɪk pleɪs/', type: 'idiom', example: 'The conference will take place in Geneva next month.', synonym: 'occur, happen, transpire', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take part in', vn: 'tham gia vào', pronun: '/teɪk pɑːt ɪn/', type: 'collocation', example: 'Over 500 athletes took part in the marathon.', synonym: 'participate in, join, engage in', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take effect', vn: 'có hiệu lực', pronun: '/teɪk ɪˈfekt/', type: 'collocation', example: 'The new regulations will take effect from next Monday.', synonym: 'come into force, become operational, activate', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take advantage of', vn: 'tận dụng / lợi dụng cái gì', pronun: '/teɪk ədˈvɑːn.tɪdʒ ɒv/', type: 'idiom', example: 'You should take advantage of this great opportunity.', synonym: 'make use of, exploit, capitalize on', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take notice of', vn: 'chú ý đến cái gì', pronun: '/teɪk ˈnəʊ.tɪs ɒv/', type: 'idiom', example: 'Don’t take any notice of what he says.', synonym: 'pay attention to, heed, note', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take responsibility for', vn: 'chịu trách nhiệm về cái gì', pronun: '/teɪk rɪˌspɒn.sɪˈbɪl.ə.ti fɔːr/', type: 'collocation', example: 'No one was willing to take responsibility for the error.', synonym: 'accept blame, take charge of, account for', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take interest in', vn: 'quan tâm đến', pronun: '/teɪk ˈɪn.trəst ɪn/', type: 'collocation', example: 'She began to take an interest in landscape painting.', synonym: 'care about, show concern for, be interested in', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take offence', vn: 'thất vọng, phật ý, tự ái', pronun: '/teɪk əˈfens/', type: 'collocation', example: 'Please don’t take offence, but I think your idea needs work.', synonym: 'take umbrage, get offended, resent', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take powder/office', vn: 'nhận chức', pronun: '/teɪk ˈɒf.ɪs/', type: 'collocation', example: 'The newly elected president will take office in January.', synonym: 'assume power, step into office, inaugurate', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take pity on', vn: 'thông cảm, thương hại ai', pronun: '/teɪk ˈpɪt.i ɒn/', type: 'idiom', example: 'She took pity on the stray dog and brought it home.', synonym: 'sympathize with, feel sorry for, have compassion for', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take a view/attitude', vn: 'có quan điểm/thái độ', pronun: '/teɪk ə vjuː / ˈæt.ɪ.tʃuːd/', type: 'collocation', example: 'He takes a critical view towards the new company policy.', synonym: 'hold an opinion, adopt a stance, perceive', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take sth as a compliment', vn: 'xem cái gì như lời khen tặng', pronun: '/teɪk æz ə ˈkɒm.plɪ.mənt/', type: 'idiom', example: 'When they called me perfectionist, I took it as a compliment.', synonym: 'flattered by, interpret positively', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take sth as an insult', vn: 'xem cái gì như lời sỉ nhục', pronun: '/teɪk æz ən ˈɪn.sʌlt/', type: 'idiom', example: 'You shouldn’t take constructive criticism as an insult.', synonym: 'take offence, feel offended', srsLevel: 0, nextReviewTime: 0 },
                ]
        },
        {
            id: 'collocations-have',
            name: 'HAVE Collocations',
            desc: 'Danh sách các cụm từ đi với động từ HAVE thông dụng',
            words: [
                { en: 'Have difficulty (in) doing sth', vn: 'gặp khó khăn khi làm cái gì', pronun: '/hæv ˈdɪf.ɪ.kəl.ti ˈduː.ɪŋ/', type: 'collocation', example: 'She had great difficulty finding a suitable job.', synonym: 'struggle with, find hard, have trouble', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Have a problem', vn: 'có vấn đề, gặp khó khăn', pronun: '/hæv ə ˈprɒb.ləm/', type: 'collocation', example: 'If you have a problem with the software, contact support.', synonym: 'encounter an issue, face difficulty', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Have a go / try', vn: 'thử làm cái gì', pronun: '/hæv ə ɡəʊ / traɪ/', type: 'idiom', example: 'I am not sure I can fix the car, but I will have a go.', synonym: 'give it a shot, make an attempt, try out', srsLevel: 0, nextReviewTime: 0 },
            ]
        },
        {
            id: 'collocations-pay',
            name: 'PAY Collocations',
            desc: 'Danh sách các cụm từ đi với động từ PAY thông dụng',
            words: [
                { en: 'Pay attention to', vn: 'chú ý đến', pronun: '/peɪ əˈten.ʃən tuː/', type: 'collocation', example: 'Please pay attention to the safety instructions.', synonym: 'take notice of, heed, focus on', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Pay a compliment', vn: 'khen ngợi', pronun: '/peɪ ə ˈkɒm.plɪ.mənt/', type: 'collocation', example: 'He paid her a nice compliment on her presentation.', synonym: 'praise, commend, flatter', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Pay a visit to sb', vn: 'đến thăm ai', pronun: '/peɪ ə ˈvɪz.ɪt tuː/', type: 'collocation', example: 'We decided to pay a visit to our grandparents this weekend.', synonym: 'call on, drop in on, visit', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Pay tribute to', vn: 'bày tỏ lòng kính trọng, tưởng nhớ', pronun: '/peɪ ˈtrɪb.juːt tuː/', type: 'collocation', example: 'The entire nation paid tribute to the fallen soldiers.', synonym: 'honor, salute, commemorate', srsLevel: 0, nextReviewTime: 0 },
            ]
        },
    ]
});