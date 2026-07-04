export type VocabItem = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  position: number;
};

export type Lesson = {
  id: string;
  title: string;
  topic: string;
  vocabItems: VocabItem[];
};

export type AnswersByLesson = Record<string, Record<string, string>>;

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
