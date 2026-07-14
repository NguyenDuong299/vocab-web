export type VocabItem = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
  position: number;
};

export type Lesson = {
  id: string;
  title: string;
  topic: string;
  vocabItems: VocabItem[];
};

export type DictionaryReviewByItem = Record<
  string,
  {
    answer: string;
    isCorrect: boolean;
  }
>;
