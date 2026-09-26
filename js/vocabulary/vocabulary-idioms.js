// Khởi tạo kho chung nếu chưa có
window.ALL_COMMUNITY_VOCABS = window.ALL_COMMUNITY_VOCABS || [];

// Tự đăng ký chính nó vào kho
window.ALL_COMMUNITY_VOCABS.push({
    id: 'idioms',
    name: 'Idioms',
    description: 'Danh sách các thành ngữ tiếng Anh thông dụng theo từng bài học/session',
    sets: [
        {
            id: 'idioms-session-1',
            name: 'Idioms - Session 1',
            desc: 'Thành ngữ dùng cho Exercise 1 (Session 1)',
            words: [
                { en: 'Take someone/ something for granted', vn: 'cho là điều dĩ nhiên, coi nhẹ, không biết quý trọng', pronun: '/teɪk ... fɔːr ˈɡrɑːn.tɪd/', type: 'idiom', example: 'Never take your family or friends for granted.', synonym: 'undervalue, fail to appreciate, assume', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take something into account/ consideration', vn: 'tính đến cái gì, kể đến cái gì, cân nhắc', pronun: '/teɪk ... ˈɪn.tuː əˈkaʊnt / kənˌsɪd.əˈreɪ.ʃən/', type: 'idiom', example: 'You must take other people’s feelings into account when deciding.', synonym: 'consider, bear in mind, factor in', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Take it easy', vn: 'không làm việc quá căng thẳng, thư giãn, bình tĩnh', pronun: '/teɪk ɪt ˈiː.zi/', type: 'idiom', example: 'The doctor told him to take it easy for a few days after the surgery.', synonym: 'relax, unwind, calm down, chill out', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Keep an eye on someone/ something', vn: 'để mắt đến, trông chừng ai/cái gì', pronun: '/kiːp ən aɪ ɒn/', type: 'idiom', example: 'Could you please keep an eye on my luggage while I buy a ticket?', synonym: 'watch over, monitor, look after, supervise', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Lose touch with someone', vn: 'mất liên lạc với ai', pronun: '/luːz tʌtʃ wɪð/', type: 'idiom', example: 'I lost touch with most of my high school classmates after graduation.', synonym: 'lose contact with, drift apart from', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Pay attention to someone/ something', vn: 'chú ý đến ai/cái gì', pronun: '/peɪ əˈten.ʃən tuː/', type: 'idiom', example: 'Please pay attention to what the teacher is explaining.', synonym: 'take notice of, focus on, heed', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Catch sight of someone/ something', vn: 'nhìn thấy trong chốc lát, thoáng thấy', pronun: '/kætʃ saɪt ɒv/', type: 'idiom', example: 'She caught sight of him in the crowded railway station.', synonym: 'catch a glimpse of, spot briefly', srsLevel: 0, nextReviewTime: 0 },
                { en: "At someone's disposal", vn: 'có sẵn cho ai sử dụng tùy ý', pronun: '/æt ... dɪˈspəʊ.zəl/', type: 'idiom', example: 'A car and driver were placed at the director’s disposal.', synonym: 'available, on hand, at sb’s service', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Splitting headache', vn: 'đau đầu như búa bổ, nhức đầu dữ dội', pronun: '/ˌsplɪt.ɪŋ ˈhed.eɪk/', type: 'idiom', example: 'I have had a splitting headache all morning.', synonym: 'severe headache, pounding headache, migraine', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Beat about the bush', vn: 'nói vòng vo tam quốc, không đi thẳng vào vấn đề', pronun: '/biːt əˈbaʊt ðə bʊʃ/', type: 'idiom', example: 'Stop beating about the bush and tell me what really happened.', synonym: 'equivocate, prevaricate, hem and haw', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Off the peg', vn: '(quần áo) may sẵn (không may đo)', pronun: '/ɒf ðə peɡ/', type: 'idiom', example: 'He bought a cheap suit off the peg for the interview.', synonym: 'ready-to-wear, off-the-rack, ready-made', srsLevel: 0, nextReviewTime: 0 },
                { en: 'On the house', vn: 'miễn phí, quán chiêu đãi (không phải trả tiền)', pronun: '/ɒn ðə haʊs/', type: 'idiom', example: 'Have another drink—this one is on the house!', synonym: 'free of charge, complimentary, gratuitous', srsLevel: 0, nextReviewTime: 0 },
                { en: 'On the shelf', vn: '(đồ vật) bị xếp xó, bỏ đi, không còn dùng đến', pronun: '/ɒn ðə ʃelf/', type: 'idiom', example: 'The whole research project has been put on the shelf for now.', synonym: 'shelved, discarded, out of use, sidelined', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Hit the roof', vn: 'nổi cơn thịnh nộ, giận dữ dữ dội', pronun: '/hɪt ðə ruːf/', type: 'idiom', example: 'Dad will hit the roof when he discovers the scratch on his car.', synonym: 'hit the ceiling, go ballistic, blow a fuse, lose one’s temper', srsLevel: 0, nextReviewTime: 0 },
                { en: "Make someone's blood boil", vn: 'làm cho ai tức sôi máu, giận điên người', pronun: '/meɪk ... blʌd bɔɪl/', type: 'idiom', example: 'The way animals are treated in that farm makes my blood boil.', synonym: 'infuriate, enrage, madden, exasperate', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Bring down the house', vn: 'khiến cả khán phòng/rạp hát vỗ tay nhiệt liệt', pronun: '/brɪŋ daʊn ðə haʊs/', type: 'idiom', example: 'The comedian’s hilarious jokes completely brought down the house.', synonym: 'draw thunderous applause, receive standing ovation', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Pay through the nose', vn: 'trả một cái giá quá đắt, mua hớ', pronun: '/peɪ θruː ðə nəʊz/', type: 'idiom', example: 'We had to pay through the nose for last-minute flight tickets.', synonym: 'overpay, pay dearly, spend a fortune', srsLevel: 0, nextReviewTime: 0 },
                { en: 'By the skin of one’s teeth', vn: 'suýt soát, vừa kịp, sát nút', pronun: '/baɪ ðə skɪn ɒv wʌnz tiːθ/', type: 'idiom', example: 'He passed the final driving exam by the skin of his teeth.', synonym: 'narrowly, just barely, by a whisker', srsLevel: 0, nextReviewTime: 0 },
                { en: "Pull someone's leg", vn: 'trêu chọc ai, nói đùa lừa ai cho vui', pronun: '/pʊl ... leɡ/', type: 'idiom', example: 'Don’t take it seriously, he was just pulling your leg.', synonym: 'tease, joke with, kid, poke fun at', srsLevel: 0, nextReviewTime: 0 }
            ]
        },
        {
            id: 'idioms-session-2',
            name: 'Idioms - Session 2',
            desc: 'Thành ngữ dùng cho Exercise 2 (Session 2)',
            words: [
                { en: "Get butterflies in one's stomach", vn: 'cảm thấy bồn chồn, lo lắng', pronun: '/ɡet ˈbʌt.ə.flaɪz ɪn wʌnz ˈstʌm.ək/', type: 'idiom', example: 'I always get butterflies in my stomach before going on stage.', synonym: 'feel nervous, be on edge, have jitters', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Sell like hot cakes', vn: 'bán đắt như tôm tươi', pronun: '/sel laɪk hɒt keɪks/', type: 'idiom', example: 'His new book is selling like hot cakes all over the country.', synonym: 'fly off the shelves, sell out rapidly', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Shooting star', vn: 'sao băng', pronun: '/ˈʃuː.tɪŋ stɑːr/', type: 'idiom', example: 'We sat on the hill watching a shooting star streak across the night sky.', synonym: 'falling star, meteor', srsLevel: 0, nextReviewTime: 0 },
                { en: "Sow one's wild oats", vn: 'trải qua thời kì đeo đuổi những thú vị bừa bãi, ăn chơi phóng túng khi còn trẻ', pronun: '/səʊ wʌnz waɪld əʊts/', type: 'idiom', example: 'He decided to settle down after years of sowing his wild oats.', synonym: 'live wildly, sow wild oats, philander', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Close shave', vn: 'lần thoát hiểm trong gang tấc, sự suýt chết/suýt bị nạn', pronun: '/ˌkləʊs ˈʃeɪv/', type: 'idiom', example: 'He had a close shave when a speeding lorry nearly knocked him down.', synonym: 'narrow escape, near miss, close call', srsLevel: 0, nextReviewTime: 0 },
                { en: "Have a bee in one's bonnet about something", vn: 'hay chú trọng, ám ảnh, đặt nặng vấn đề gì', pronun: '/hæv ə biː ɪn wʌnz ˈbɒn.ɪt əˈbaʊt/', type: 'idiom', example: 'She has a bee in her bonnet about punctuality and hates anyone being late.', synonym: 'be obsessed with, harp on about, fixate on', srsLevel: 0, nextReviewTime: 0 },
                { en: "Blow one's own trumpet", vn: 'huênh hoang, tự khoe khoang về bản thân', pronun: '/bləʊ wʌnz əʊn ˈtrʌm.pɪt/', type: 'idiom', example: 'Without wishing to blow my own trumpet, I was the one who solved the issue.', synonym: 'toot one’s own horn, boast, brag', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Fight tooth and nail', vn: 'chiến đấu ác liệt, đánh nhau ác liệt, đấu tranh hết sức mình', pronun: '/faɪt tuːθ ənd neɪl/', type: 'idiom', example: 'The local community fought tooth and nail to save the old library.', synonym: 'fight fiercely, struggle fiercely, strive with all one’s might', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Head over heels', vn: 'lăn lông lốc, hoàn toàn (thường dùng: say đắm trong tình yêu)', pronun: '/ˌhed əʊ.və ˈhiːlz/', type: 'idiom', example: 'He fell head over heels in love with her the first time they met.', synonym: 'completely, utterly, deeply in love', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Smell a rat', vn: 'nghi ngờ có âm mưu, nghi ngờ có sự dối trá', pronun: '/smel ə ræt/', type: 'idiom', example: 'When they refused to show the signed contract, I began to smell a rat.', synonym: 'suspect foul play, suspect something wrong, be suspicious', srsLevel: 0, nextReviewTime: 0 },
                { en: "Know something like the back of one's hand", vn: 'biết rõ điều gì, nắm rõ như lòng bàn tay', pronun: '/nəʊ ... laɪk ðə bæk ɒv wʌnz hænd/', type: 'idiom', example: 'Having lived here for thirty years, she knows this town like the back of her hand.', synonym: 'know inside out, be intimately familiar with', srsLevel: 0, nextReviewTime: 0 },
                { en: 'The last straw', vn: 'giọt nước tràn ly (sự việc cuối cùng làm mất hết kiên nhẫn)', pronun: '/ðə lɑːst strɔː/', type: 'idiom', example: 'Arriving two hours late was the last straw, and his boss fired him on the spot.', synonym: 'final straw, limit of one’s patience', srsLevel: 0, nextReviewTime: 0 },
                { en: 'Fly off the handle', vn: 'mất bình tĩnh, thình lình nổi nóng/nổi giận', pronun: '/flaɪ ɒf ðə ˈhæn.dəl/', type: 'idiom', example: 'He tends to fly off the handle whenever someone criticizes his work.', synonym: 'lose one’s temper, blow up, go ballistic', srsLevel: 0, nextReviewTime: 0 }
            ]
        }
    ]
});