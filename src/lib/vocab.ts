export type VocabItem = {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
};

export type Lesson = {
  id: number;
  title: string;
  topic: string;
  vocabItems: VocabItem[];
};

export const lessonsStorageKey = "vocab-web-lessons";

export const initialLessons: Lesson[] = [
  {
    id: 1,
    title: "BÀI 1: 你好",
    topic: "HSK 1 - Chào hỏi",
    vocabItems: [
      { id: 1, hanzi: "我", pinyin: "wǒ", meaning: "Tôi" },
      { id: 2, hanzi: "你", pinyin: "nǐ", meaning: "Bạn" },
      { id: 3, hanzi: "您", pinyin: "nín", meaning: "Bạn" },
      { id: 4, hanzi: "也", pinyin: "yě", meaning: "Mà còn" },
      { id: 5, hanzi: "他", pinyin: "tā", meaning: "Anh ta" },
      { id: 6, hanzi: "她", pinyin: "tā", meaning: "Cô ấy" },
      { id: 7, hanzi: "们", pinyin: "men", meaning: "Họ" },
      { id: 8, hanzi: "好", pinyin: "hǎo", meaning: "Tốt" },
      { id: 9, hanzi: "是", pinyin: "shì", meaning: "Đúng" },
      { id: 10, hanzi: "吗", pinyin: "ma", meaning: "Ma" },
      { id: 11, hanzi: "老师", pinyin: "lǎo shī", meaning: "Giáo viên" },
      { id: 12, hanzi: "学生", pinyin: "xué sheng", meaning: "Học sinh" },
      { id: 13, hanzi: "留学生", pinyin: "liú xué sheng", meaning: "Sinh viên quốc tế" },
      { id: 14, hanzi: "不", pinyin: "bù", meaning: "KHÔNG" },
      { id: 15, hanzi: "不是", pinyin: "bú shì", meaning: "KHÔNG" },
      { id: 16, hanzi: "叫", pinyin: "jiào", meaning: "Gọi" },
      { id: 17, hanzi: "什么", pinyin: "shén me", meaning: "Cái gì" },
      { id: 18, hanzi: "名字", pinyin: "míng zi", meaning: "Tên" },
      { id: 19, hanzi: "谢谢", pinyin: "xiè xie", meaning: "Cảm ơn" },
    ],
  },
  {
    id: 2,
    title: "BÀI 2: 国家",
    topic: "HSK 1 - Quốc gia",
    vocabItems: [
      { id: 1, hanzi: "中国", pinyin: "zhōng guó", meaning: "Trung Quốc" },
      { id: 2, hanzi: "越南", pinyin: "yuè nán", meaning: "Việt Nam" },
      { id: 3, hanzi: "人", pinyin: "rén", meaning: "Người" },
      { id: 4, hanzi: "朋友", pinyin: "péng you", meaning: "Bạn bè" },
      { id: 5, hanzi: "家", pinyin: "jiā", meaning: "Nhà" },
      { id: 6, hanzi: "学校", pinyin: "xué xiào", meaning: "Trường học" },
    ],
  },
];

export function readStoredLessons() {
  const rawLessons = window.localStorage.getItem(lessonsStorageKey);

  if (!rawLessons) return initialLessons;

  const parsedLessons = JSON.parse(rawLessons) as Lesson[];

  if (!Array.isArray(parsedLessons) || parsedLessons.length === 0) {
    return initialLessons;
  }

  return parsedLessons;
}
