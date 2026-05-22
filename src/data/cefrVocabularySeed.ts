export interface SeedVocabularyEntry {
  word: string;
  meaning_vi: string;
  meaning_en: string;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb';
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  example_sentence: string;
  example_vi: string;
}

export const CEFR_VOCABULARY_SEED: SeedVocabularyEntry[] = [
  // A1 Level
  {
    word: 'family',
    meaning_vi: 'gia đình',
    meaning_en: 'a group of people who are related to each other',
    part_of_speech: 'noun',
    cefr_level: 'A1',
    topic: 'family',
    example_sentence: 'I love spending time with my family.',
    example_vi: 'Tôi thích dành thời gian bên gia đình mình.'
  },
  {
    word: 'happy',
    meaning_vi: 'vui vẻ, hạnh phúc',
    meaning_en: 'feeling or showing pleasure or contentment',
    part_of_speech: 'adjective',
    cefr_level: 'A1',
    topic: 'feelings',
    example_sentence: 'She was very happy to see her friend.',
    example_vi: 'Cô ấy rất vui khi được gặp người bạn của mình.'
  },
  {
    word: 'study',
    meaning_vi: 'học tập, nghiên cứu',
    meaning_en: 'devote time and attention to acquiring knowledge',
    part_of_speech: 'verb',
    cefr_level: 'A1',
    topic: 'school',
    example_sentence: 'We need to study for the English test tomorrow.',
    example_vi: 'Chúng ta cần học bài cho bài kiểm tra tiếng Anh ngày mai.'
  },
  {
    word: 'beautiful',
    meaning_vi: 'đẹp, xinh đẹp',
    meaning_en: 'pleasing the senses or mind aesthetically',
    part_of_speech: 'adjective',
    cefr_level: 'A1',
    topic: 'appearance',
    example_sentence: 'The flowers in the park are beautiful.',
    example_vi: 'Những bông hoa trong công viên thật xinh đẹp.'
  },
  {
    word: 'school',
    meaning_vi: 'trường học',
    meaning_en: 'an institution for educating children',
    part_of_speech: 'noun',
    cefr_level: 'A1',
    topic: 'school',
    example_sentence: 'I walk to school every morning.',
    example_vi: 'Tôi đi bộ đến trường mỗi sáng.'
  },
  {
    word: 'teacher',
    meaning_vi: 'giáo viên',
    meaning_en: 'a person who teaches, especially in a school',
    part_of_speech: 'noun',
    cefr_level: 'A1',
    topic: 'jobs',
    example_sentence: 'Our English teacher is very kind and patient.',
    example_vi: 'Giáo viên tiếng Anh của chúng tôi rất tốt bụng và kiên nhẫn.'
  },
  {
    word: 'friend',
    meaning_vi: 'người bạn',
    meaning_en: 'a person whom one knows and with whom one has a bond of mutual affection',
    part_of_speech: 'noun',
    cefr_level: 'A1',
    topic: 'people',
    example_sentence: 'He is playing soccer with his best friend.',
    example_vi: 'Cậu ấy đang chơi đá bóng với người bạn thân nhất của mình.'
  },
  {
    word: 'weather',
    meaning_vi: 'thời tiết',
    meaning_en: 'the state of the atmosphere at a place and time',
    part_of_speech: 'noun',
    cefr_level: 'A1',
    topic: 'weather',
    example_sentence: 'The weather is hot and sunny today.',
    example_vi: 'Thời tiết hôm nay nóng và nhiều nắng.'
  },
  {
    word: 'animal',
    meaning_vi: 'động vật',
    meaning_en: 'a living organism that feeds on organic matter',
    part_of_speech: 'noun',
    cefr_level: 'A1',
    topic: 'animals',
    example_sentence: 'The lion is a wild animal.',
    example_vi: 'Sư tử là một loài động vật hoang dã.'
  },
  {
    word: 'doctor',
    meaning_vi: 'bác sĩ',
    meaning_en: 'a qualified practitioner of medicine',
    part_of_speech: 'noun',
    cefr_level: 'A1',
    topic: 'jobs',
    example_sentence: 'You should see a doctor if you feel sick.',
    example_vi: 'Bạn nên đi khám bác sĩ nếu cảm thấy bị bệnh.'
  },
  {
    word: 'delicious',
    meaning_vi: 'ngon miệng',
    meaning_en: 'highly pleasant to the taste',
    part_of_speech: 'adjective',
    cefr_level: 'A1',
    topic: 'food',
    example_sentence: 'My mother made a delicious chocolate cake.',
    example_vi: 'Mẹ tôi đã làm một chiếc bánh sô-cô-la ngon tuyệt.'
  },
  {
    word: 'green',
    meaning_vi: 'màu xanh lá cây',
    meaning_en: 'of the color between blue and yellow in the spectrum',
    part_of_speech: 'adjective',
    cefr_level: 'A1',
    topic: 'colors',
    example_sentence: 'The grass is green in the spring.',
    example_vi: 'Cỏ có màu xanh lá vào mùa xuân.'
  },

  // A2 Level
  {
    word: 'journey',
    meaning_vi: 'chuyến hành trình',
    meaning_en: 'an act of traveling from one place to another',
    part_of_speech: 'noun',
    cefr_level: 'A2',
    topic: 'travel',
    example_sentence: 'Their journey across the country took three days.',
    example_vi: 'Hành trình băng qua đất nước của họ mất ba ngày.'
  },
  {
    word: 'modern',
    meaning_vi: 'hiện đại',
    meaning_en: 'relating to the present or recent times',
    part_of_speech: 'adjective',
    cefr_level: 'A2',
    topic: 'technology',
    example_sentence: 'The city has many modern buildings.',
    example_vi: 'Thành phố có nhiều tòa nhà hiện đại.'
  },
  {
    word: 'popular',
    meaning_vi: 'phổ biến, được yêu thích',
    meaning_en: 'liked or admired by many people',
    part_of_speech: 'adjective',
    cefr_level: 'A2',
    topic: 'culture',
    example_sentence: 'Soccer is the most popular sport in Vietnam.',
    example_vi: 'Bóng đá là môn thể thao phổ biến nhất ở Việt Nam.'
  },
  {
    word: 'simple',
    meaning_vi: 'đơn giản',
    meaning_en: 'easy to understand or do; not complicated',
    part_of_speech: 'adjective',
    cefr_level: 'A2',
    topic: 'general',
    example_sentence: 'The rules of the game are very simple.',
    example_vi: 'Quy tắc của trò chơi rất đơn giản.'
  },
  {
    word: 'tradition',
    meaning_vi: 'truyền thống',
    meaning_en: 'a custom or belief passed down through generations',
    part_of_speech: 'noun',
    cefr_level: 'A2',
    topic: 'culture',
    example_sentence: 'Giving lucky money is a Tet tradition.',
    example_vi: 'Lì xì là một truyền thống trong ngày Tết.'
  },
  {
    word: 'translate',
    meaning_vi: 'dịch, biên dịch',
    meaning_en: 'express the sense of words in another language',
    part_of_speech: 'verb',
    cefr_level: 'A2',
    topic: 'language',
    example_sentence: 'Can you translate this letter into English?',
    example_vi: 'Bạn có thể dịch lá thư này sang tiếng Anh không?'
  },
  {
    word: 'healthy',
    meaning_vi: 'khỏe mạnh, lành mạnh',
    meaning_en: 'in a good physical or mental condition',
    part_of_speech: 'adjective',
    cefr_level: 'A2',
    topic: 'health',
    example_sentence: 'Eating fruits and vegetables helps you stay healthy.',
    example_vi: 'Ăn trái cây và rau giúp bạn luôn khỏe mạnh.'
  },
  {
    word: 'activity',
    meaning_vi: 'hoạt động',
    meaning_en: 'a thing that a person or group does or has done',
    part_of_speech: 'noun',
    cefr_level: 'A2',
    topic: 'leisure',
    example_sentence: 'Swimming is a fun summer activity.',
    example_vi: 'Bơi lội là một hoạt động mùa hè vui vẻ.'
  },
  {
    word: 'active',
    meaning_vi: 'năng động, chủ động',
    meaning_en: 'engaging or ready to engage in physically energetic pursuits',
    part_of_speech: 'adjective',
    cefr_level: 'A2',
    topic: 'personality',
    example_sentence: 'Children are usually very active and full of energy.',
    example_vi: 'Trẻ em thường rất năng động và tràn đầy năng lượng.'
  },
  {
    word: 'language',
    meaning_vi: 'ngôn ngữ',
    meaning_en: 'the system of communication used by a community',
    part_of_speech: 'noun',
    cefr_level: 'A2',
    topic: 'education',
    example_sentence: 'Learning a foreign language takes time.',
    example_vi: 'Học một ngoại ngữ cần có thời gian.'
  },
  {
    word: 'customer',
    meaning_vi: 'khách hàng',
    meaning_en: 'a person who buys goods or services from a shop or business',
    part_of_speech: 'noun',
    cefr_level: 'A2',
    topic: 'business',
    example_sentence: 'The shop assistant is helping a customer.',
    example_vi: 'Nhân viên cửa hàng đang giúp đỡ một khách hàng.'
  },
  {
    word: 'celebrate',
    meaning_vi: 'kỷ niệm, ăn mừng',
    meaning_en: 'acknowledge a significant event with a social gathering',
    part_of_speech: 'verb',
    cefr_level: 'A2',
    topic: 'culture',
    example_sentence: 'We will celebrate my birthday tonight.',
    example_vi: 'Chúng ta sẽ ăn mừng sinh nhật tôi tối nay.'
  },

  // B1 Level
  {
    word: 'achieve',
    meaning_vi: 'đạt được, giành được',
    meaning_en: 'successfully bring about or reach a desired objective',
    part_of_speech: 'verb',
    cefr_level: 'B1',
    topic: 'success',
    example_sentence: 'You can achieve your goals if you work hard.',
    example_vi: 'Bạn có thể đạt được mục tiêu của mình nếu làm việc chăm chỉ.'
  },
  {
    word: 'believe',
    meaning_vi: 'tin tưởng',
    meaning_en: 'accept that something is true or trust someone',
    part_of_speech: 'verb',
    cefr_level: 'B1',
    topic: 'feelings',
    example_sentence: 'I believe that honesty is the best policy.',
    example_vi: 'Tôi tin rằng trung thực là chính sách tốt nhất.'
  },
  {
    word: 'challenging',
    meaning_vi: 'thử thách, khó khăn',
    meaning_en: 'testing one\'s abilities; demanding',
    part_of_speech: 'adjective',
    cefr_level: 'B1',
    topic: 'work',
    example_sentence: 'The final exam was very challenging.',
    example_vi: 'Bài thi cuối kỳ rất khó khăn và đầy thử thách.'
  },
  {
    word: 'environment',
    meaning_vi: 'môi trường',
    meaning_en: 'the surroundings or conditions in which a person, animal, or plant lives',
    part_of_speech: 'noun',
    cefr_level: 'B1',
    topic: 'nature',
    example_sentence: 'We should protect the environment by planting trees.',
    example_vi: 'Chúng ta nên bảo vệ môi trường bằng cách trồng cây.'
  },
  {
    word: 'focus',
    meaning_vi: 'tập trung',
    meaning_en: 'pay particular attention to one thing',
    part_of_speech: 'verb',
    cefr_level: 'B1',
    topic: 'mind',
    example_sentence: 'Please focus on your homework.',
    example_vi: 'Làm ơn hãy tập trung vào bài tập về nhà của bạn.'
  },
  {
    word: 'influence',
    meaning_vi: 'ảnh hưởng, tác động',
    meaning_en: 'the capacity to have an effect on the character or behavior of someone',
    part_of_speech: 'noun',
    cefr_level: 'B1',
    topic: 'relationships',
    example_sentence: 'Parents have a major influence on their kids.',
    example_vi: 'Cha mẹ có sức ảnh hưởng lớn đến con cái.'
  },
  {
    word: 'natural',
    meaning_vi: 'tự nhiên, thiên nhiên',
    meaning_en: 'existing in or caused by nature; not made by humankind',
    part_of_speech: 'adjective',
    cefr_level: 'B1',
    topic: 'nature',
    example_sentence: 'This juice contains only natural ingredients.',
    example_vi: 'Nước ép này chỉ chứa các thành phần tự nhiên.'
  },
  {
    word: 'typical',
    meaning_vi: 'điển hình, tiêu biểu',
    meaning_en: 'having the distinctive qualities of a particular type of person or thing',
    part_of_speech: 'adjective',
    cefr_level: 'B1',
    topic: 'general',
    example_sentence: 'It is typical of him to be late for meetings.',
    example_vi: 'Việc anh ta đi làm muộn trong các cuộc họp là chuyện điển hình.'
  },
  {
    word: 'solve',
    meaning_vi: 'giải quyết, tìm ra lời giải',
    meaning_en: 'find an answer to, explanation for, or means of effectively dealing with a problem',
    part_of_speech: 'verb',
    cefr_level: 'B1',
    topic: 'mind',
    example_sentence: 'She managed to solve the math puzzle quickly.',
    example_vi: 'Cô ấy đã giải quyết được câu đố toán học một cách nhanh chóng.'
  },
  {
    word: 'decorate',
    meaning_vi: 'trang trí',
    meaning_en: 'make something look more attractive by adding extra items',
    part_of_speech: 'verb',
    cefr_level: 'B1',
    topic: 'home',
    example_sentence: 'They decorate their house with lights for Christmas.',
    example_vi: 'Họ trang trí ngôi nhà của mình bằng đèn nháy cho ngày Giáng sinh.'
  },
  {
    word: 'volunteer',
    meaning_vi: 'tình nguyện viên, tình nguyện',
    meaning_en: 'a person who freely offers to take part in an enterprise or task',
    part_of_speech: 'noun',
    cefr_level: 'B1',
    topic: 'society',
    example_sentence: 'He works as a volunteer at the local hospital.',
    example_vi: 'Anh ấy làm việc như một tình nguyện viên tại bệnh viện địa phương.'
  },
  {
    word: 'encourage',
    meaning_vi: 'khuyến khích, động viên',
    meaning_en: 'give support, confidence, or hope to someone',
    part_of_speech: 'verb',
    cefr_level: 'B1',
    topic: 'society',
    example_sentence: 'Teachers always encourage students to ask questions.',
    example_vi: 'Giáo viên luôn khuyến khích học sinh đặt câu hỏi.'
  },

  // B2 Level
  {
    word: 'beneficial',
    meaning_vi: 'có lợi, mang lại lợi ích',
    meaning_en: 'resulting in good; favorable or advantageous',
    part_of_speech: 'adjective',
    cefr_level: 'B2',
    topic: 'advantage',
    example_sentence: 'Regular exercise is highly beneficial for health.',
    example_vi: 'Tập thể dục đều đặn rất có lợi cho sức khỏe.'
  },
  {
    word: 'consequence',
    meaning_vi: 'hậu quả, hệ quả',
    meaning_en: 'a result or effect of an action or condition',
    part_of_speech: 'noun',
    cefr_level: 'B2',
    topic: 'result',
    example_sentence: 'Unemployment is a direct consequence of the economic crisis.',
    example_vi: 'Thất nghiệp là hệ quả trực tiếp của cuộc khủng hoảng kinh tế.'
  },
  {
    word: 'dynamic',
    meaning_vi: 'năng động, đầy động lực',
    meaning_en: 'characterized by constant change, activity, or progress',
    part_of_speech: 'adjective',
    cefr_level: 'B2',
    topic: 'personality',
    example_sentence: 'She is a dynamic leader who inspires her team.',
    example_vi: 'Cô ấy là một nhà lãnh đạo năng động, truyền cảm hứng cho đội ngũ của mình.'
  },
  {
    word: 'emphasize',
    meaning_vi: 'nhấn mạnh, làm nổi bật',
    meaning_en: 'give special importance or prominence to something in speaking or writing',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    topic: 'communication',
    example_sentence: 'The report emphasizes the need for immediate reforms.',
    example_vi: 'Bản báo cáo nhấn mạnh sự cần thiết phải cải cách ngay lập tức.'
  },
  {
    word: 'guarantee',
    meaning_vi: 'bảo hành, cam kết, bảo đảm',
    meaning_en: 'provide a formal assurance, especially that certain conditions will be fulfilled',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    topic: 'business',
    example_sentence: 'The company guarantees a full refund within 30 days.',
    example_vi: 'Công ty cam kết hoàn tiền đầy đủ trong vòng 30 ngày.'
  },
  {
    word: 'hesitate',
    meaning_vi: 'do dự, ngập ngừng',
    meaning_en: 'pause before saying or doing something, especially through uncertainty',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    topic: 'behavior',
    example_sentence: 'Do not hesitate to contact me if you need help.',
    example_vi: 'Đừng do dự liên hệ với tôi nếu bạn cần giúp đỡ.'
  },
  {
    word: 'inspect',
    meaning_vi: 'thanh tra, kiểm tra kỹ',
    meaning_en: 'look at something closely, typically to assess its condition',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    topic: 'work',
    example_sentence: 'The health officials came to inspect the restaurant kitchen.',
    example_vi: 'Các quan chức y tế đã đến kiểm tra bếp của nhà hàng.'
  },
  {
    word: 'negotiate',
    meaning_vi: 'đàm phán, thương lượng',
    meaning_en: 'obtain or bring about by discussion with others',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    topic: 'business',
    example_sentence: 'They managed to negotiate a better price for the house.',
    example_vi: 'Họ đã thương lượng được một mức giá tốt hơn cho ngôi nhà.'
  },
  {
    word: 'significant',
    meaning_vi: 'quan trọng, đáng kể',
    meaning_en: 'sufficiently great or important to be worthy of attention',
    part_of_speech: 'adjective',
    cefr_level: 'B2',
    topic: 'general',
    example_sentence: 'There has been a significant increase in online sales.',
    example_vi: 'Đã có một sự gia tăng đáng kể trong doanh số bán hàng trực tuyến.'
  },
  {
    word: 'predict',
    meaning_vi: 'dự đoán',
    meaning_en: 'say or estimate that a specified thing will happen in the future',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    topic: 'mind',
    example_sentence: 'It is difficult to predict the weather accurately.',
    example_vi: 'Rất khó để dự đoán thời tiết một cách chính xác.'
  },
  {
    word: 'alternative',
    meaning_vi: 'phương án thay thế, luân phiên',
    meaning_en: 'one of two or more available possibilities',
    part_of_speech: 'noun',
    cefr_level: 'B2',
    topic: 'choice',
    example_sentence: 'Solar energy is a clean alternative to fossil fuels.',
    example_vi: 'Năng lượng mặt trời là một giải pháp sạch thay thế cho nhiên liệu hóa thạch.'
  },
  {
    word: 'maintain',
    meaning_vi: 'duy trì, bảo dưỡng',
    meaning_en: 'cause or enable a state or condition to continue',
    part_of_speech: 'verb',
    cefr_level: 'B2',
    topic: 'general',
    example_sentence: 'You must maintain a healthy balance in your life.',
    example_vi: 'Bạn phải duy trì một sự cân bằng lành mạnh trong cuộc sống.'
  },

  // C1 Level
  {
    word: 'advocate',
    meaning_vi: 'ủng hộ, bào chữa, người ủng hộ',
    meaning_en: 'publicly recommend or support a particular cause or policy',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    topic: 'society',
    example_sentence: 'He advocates for the rights of disabled children.',
    example_vi: 'Anh ấy ủng hộ quyền lợi cho trẻ em khuyết tật.'
  },
  {
    word: 'collaborate',
    meaning_vi: 'hợp tác, cộng tác',
    meaning_en: 'work jointly on an activity or project, especially to produce something',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    topic: 'work',
    example_sentence: 'The two research departments collaborated on the study.',
    example_vi: 'Hai phòng nghiên cứu đã hợp tác với nhau trong đề tài này.'
  },
  {
    word: 'evaluate',
    meaning_vi: 'đánh giá, định giá',
    meaning_en: 'form an idea of the amount, number, or value of; assess',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    topic: 'mind',
    example_sentence: 'We need to evaluate the results of the marketing campaign.',
    example_vi: 'Chúng ta cần đánh giá kết quả của chiến dịch tiếp thị.'
  },
  {
    word: 'facilitate',
    meaning_vi: 'tạo điều kiện, làm cho dễ dàng',
    meaning_en: 'make an action or process easy or easier',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    topic: 'general',
    example_sentence: 'The new system will facilitate better communication.',
    example_vi: 'Hệ thống mới sẽ tạo điều kiện cho sự giao tiếp tốt hơn.'
  },
  {
    word: 'hierarchy',
    meaning_vi: 'hệ thống phân cấp, thứ bậc',
    meaning_en: 'a system in which members of an organization are ranked according to status',
    part_of_speech: 'noun',
    cefr_level: 'C1',
    topic: 'society',
    example_sentence: 'She climbed the corporate hierarchy to become the CEO.',
    example_vi: 'Cô ấy đã leo lên các bậc thang phân cấp của công ty để trở thành CEO.'
  },
  {
    word: 'justify',
    meaning_vi: 'biện hộ, chứng minh là đúng',
    meaning_en: 'show or prove to be right or reasonable',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    topic: 'mind',
    example_sentence: 'How do you justify your decision to quit the job?',
    example_vi: 'Làm thế nào bạn biện minh cho quyết định thôi việc của mình?'
  },
  {
    word: 'naive',
    meaning_vi: 'ngây thơ, chất phác',
    meaning_en: 'showing a lack of experience, wisdom, or judgment',
    part_of_speech: 'adjective',
    cefr_level: 'C1',
    topic: 'personality',
    example_sentence: 'It was naive of her to believe their empty promises.',
    example_vi: 'Thật ngây thơ khi cô ấy tin những lời hứa suông của họ.'
  },
  {
    word: 'aesthetic',
    meaning_vi: 'mang tính thẩm mỹ',
    meaning_en: 'concerned with beauty or the appreciation of beauty',
    part_of_speech: 'adjective',
    cefr_level: 'C1',
    topic: 'appearance',
    example_sentence: 'The room was designed for both comfort and aesthetic appeal.',
    example_vi: 'Căn phòng được thiết kế vì cả sự tiện nghi và sức hút thẩm mỹ.'
  },
  {
    word: 'trigger',
    meaning_vi: 'gây ra, kích hoạt',
    meaning_en: 'cause an event or situation to happen or exist',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    topic: 'result',
    example_sentence: 'The high stress levels triggered his illness.',
    example_vi: 'Mức độ căng thẳng cao đã kích hoạt/gây ra căn bệnh của anh ấy.'
  },
  {
    word: 'feasible',
    meaning_vi: 'khả thi',
    meaning_en: 'possible to do easily or conveniently',
    part_of_speech: 'adjective',
    cefr_level: 'C1',
    topic: 'general',
    example_sentence: 'It is not economically feasible to build a bridge here.',
    example_vi: 'Xây dựng một cây cầu ở đây là không khả thi về mặt kinh tế.'
  },
  {
    word: 'ambiguous',
    meaning_vi: 'mơ hồ, nước đôi',
    meaning_en: 'open to more than one interpretation; not clear',
    part_of_speech: 'adjective',
    cefr_level: 'C1',
    topic: 'communication',
    example_sentence: 'The instructions she gave were highly ambiguous.',
    example_vi: 'Các chỉ dẫn mà cô ấy đưa ra rất mơ hồ, khó hiểu.'
  },
  {
    word: 'accumulate',
    meaning_vi: 'tích lũy, gom góp',
    meaning_en: 'gather together or acquire an increasing number or quantity of',
    part_of_speech: 'verb',
    cefr_level: 'C1',
    topic: 'wealth',
    example_sentence: 'Dust quickly accumulates on books in this room.',
    example_vi: 'Bụi bặm nhanh chóng tích tụ trên sách vở trong căn phòng này.'
  }
];
