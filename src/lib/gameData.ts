// ===== SCRAMBLE: Câu chúc Tết bị xáo trộn =====
export const SCRAMBLE_SENTENCES = [
  'Chúc Mừng Năm Mới',
  'An Khang Thịnh Vượng',
  'Vạn Sự Như Ý',
  'Phát Tài Phát Lộc',
  'Sức Khỏe Dồi Dào',
  'Năm Mới Bình An',
  'Tấn Tài Tấn Lộc',
  'Sung Túc Viên Mãn',
  'Mã Đáo Thành Công',
  'Cung Chúc Tân Xuân',
  'Đắc Lộc Đắc Tài',
  'Hạnh Phúc Tràn Đầy',
  'Xuân Sang Phú Quý',
  'Tài Lộc Đầy Nhà',
  'Vui Vẻ Hạnh Phúc',
];

// ===== QUIZ: Câu hỏi đố vui Tết =====
export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index of correct answer
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Tết Nguyên Đán còn gọi là gì?',
    options: ['Tết Trung Thu', 'Tết Âm Lịch', 'Tết Dương Lịch', 'Tết Đoan Ngọ'],
    correct: 1,
  },
  {
    question: 'Hoa nào là đặc trưng của Tết miền Bắc?',
    options: ['Hoa mai', 'Hoa đào', 'Hoa cúc', 'Hoa lan'],
    correct: 1,
  },
  {
    question: 'Hoa nào là đặc trưng của Tết miền Nam?',
    options: ['Hoa đào', 'Hoa mai vàng', 'Hoa hồng', 'Hoa ly'],
    correct: 1,
  },
  {
    question: 'Bánh chưng tượng trưng cho điều gì?',
    options: ['Trời tròn', 'Đất vuông', 'Mặt trời', 'Mặt trăng'],
    correct: 1,
  },
  {
    question: 'Năm 2025 là năm con gì?',
    options: ['Mèo', 'Rồng', 'Rắn', 'Ngựa'],
    correct: 2,
  },
  {
    question: 'Mùng 1 Tết thường đi đâu?',
    options: ['Nhà bạn', 'Nhà cha', 'Nhà ngoại', 'Đi chơi'],
    correct: 1,
  },
  {
    question: 'Mùng 2 Tết thường đi đâu?',
    options: ['Nhà cha', 'Nhà mẹ (ngoại)', 'Nhà thầy', 'Đi du lịch'],
    correct: 1,
  },
  {
    question: 'Mùng 3 Tết thường đi đâu?',
    options: ['Nhà ngoại', 'Nhà bạn', 'Nhà thầy', 'Nhà cha'],
    correct: 2,
  },
  {
    question: '"Mứt Tết" phổ biến nhất là loại nào?',
    options: ['Mứt dâu', 'Mứt dừa', 'Mứt táo', 'Mứt nho'],
    correct: 1,
  },
  {
    question: 'Tục "xông đất" có nghĩa là gì?',
    options: ['Dọn nhà', 'Người đầu tiên vào nhà năm mới', 'Trồng cây', 'Đốt pháo'],
    correct: 1,
  },
  {
    question: 'Cây nêu ngày Tết có ý nghĩa gì?',
    options: ['Trang trí', 'Xua đuổi tà ma', 'Cầu mưa', 'Đánh dấu lãnh thổ'],
    correct: 1,
  },
  {
    question: 'Trong 12 con giáp, con nào đứng đầu?',
    options: ['Rồng', 'Tý (Chuột)', 'Hổ', 'Trâu'],
    correct: 1,
  },
  {
    question: 'Lì xì thường được bỏ trong bao màu gì?',
    options: ['Vàng', 'Đỏ', 'Xanh', 'Trắng'],
    correct: 1,
  },
  {
    question: 'Câu đối Tết thường viết trên giấy màu gì?',
    options: ['Trắng', 'Vàng', 'Đỏ', 'Xanh'],
    correct: 2,
  },
  {
    question: 'Món ăn nào KHÔNG phải truyền thống ngày Tết?',
    options: ['Bánh chưng', 'Thịt kho hột vịt', 'Pizza', 'Dưa hành'],
    correct: 2,
  },
  {
    question: 'Tết Nguyên Đán thường rơi vào tháng nào dương lịch?',
    options: ['Tháng 12', 'Tháng 1 hoặc 2', 'Tháng 3', 'Tháng 4'],
    correct: 1,
  },
];

// ===== Game type definitions =====
export const GAME_TYPES = [
  { id: 'shake', name: 'Lắc điện thoại', emoji: '📱', description: 'Lắc điện thoại thật mạnh' },
  { id: 'shake-stick', name: 'Lắc que xin lộc', emoji: '🥢', description: 'Lắc hũ que như xin quẻ' },
  { id: 'scramble', name: 'Xếp chữ Tết', emoji: '🔤', description: 'Sắp xếp từ thành câu chúc Tết' },
  { id: 'quiz', name: 'Đố vui Tết', emoji: '❓', description: 'Trả lời câu hỏi về Tết' },
] as const;

export type GameType = typeof GAME_TYPES[number]['id'];

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
