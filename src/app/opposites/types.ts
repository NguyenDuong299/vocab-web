export type OppositePair = {
  id: string;
  leftText: string;
  rightText: string;
  pinyin: string;
  meaning: string;
  position: number;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
