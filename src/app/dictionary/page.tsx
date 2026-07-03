"use client";

import { useEffect, useMemo, useState } from "react";
import { initialLessons, readStoredLessons, type Lesson } from "@/lib/vocab";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function DictionaryPage() {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        setLessons(readStoredLessons());
      } catch {
        setLessons(initialLessons);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const dictionaryRows = useMemo(
    () =>
      lessons.flatMap((lesson) =>
        lesson.vocabItems.map((item) => ({
          ...item,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonTopic: lesson.topic,
        })),
      ),
    [lessons],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) return dictionaryRows;

    return dictionaryRows.filter((row) => {
      const searchableText = [
        row.hanzi,
        row.pinyin,
        row.meaning,
        row.lessonTitle,
        row.lessonTopic,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [dictionaryRows, query]);

  return (
    <main className="min-h-screen bg-[#f3f6ef] px-3 py-4 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-3 border border-slate-300 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Tổng hợp tất cả bài
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950">
              Từ điển từ vựng
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="border border-slate-300 bg-slate-50 px-3 py-2">
              <p className="text-xs font-bold uppercase text-slate-500">Số bài</p>
              <p className="text-2xl font-black">{lessons.length}</p>
            </div>
            <div className="border border-slate-300 bg-sky-50 px-3 py-2">
              <p className="text-xs font-bold uppercase text-slate-500">Tổng từ</p>
              <p className="text-2xl font-black">{dictionaryRows.length}</p>
            </div>
            <div className="border border-slate-300 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-bold uppercase text-slate-500">Đang hiện</p>
              <p className="text-2xl font-black text-emerald-700">{filteredRows.length}</p>
            </div>
          </div>
        </div>

        <div className="border border-slate-300 bg-white p-3 shadow-sm">
          <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            Tìm kiếm
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 border border-slate-300 px-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              placeholder="Nhập chữ Hán, pinyin, nghĩa, hoặc tên bài"
            />
          </label>
        </div>

        <div className="overflow-hidden border border-slate-950 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-center text-sm">
              <thead>
                <tr className="bg-[#fff4c7] text-slate-950">
                  <th colSpan={6} className="border border-slate-950 px-3 py-2 text-xl font-black">
                    TỪ ĐIỂN TỔNG HỢP
                  </th>
                </tr>
                <tr>
                  <th className="w-16 border border-slate-950 bg-white px-3 py-2 font-bold">STT</th>
                  <th className="w-44 border border-slate-950 bg-orange-400 px-3 py-2 font-bold">BÀI</th>
                  <th className="w-32 border border-slate-950 bg-orange-400 px-3 py-2 font-bold">
                    CHỮ HÁN
                  </th>
                  <th className="w-44 border border-slate-950 bg-white px-3 py-2 font-bold">PINYIN</th>
                  <th className="w-64 border border-slate-950 bg-white px-3 py-2 font-bold">NGHĨA</th>
                  <th className="w-48 border border-slate-950 bg-white px-3 py-2 font-bold">CHỦ ĐỀ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={`${row.lessonId}-${row.id}`} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-950 px-3 py-1 font-medium">{index + 1}</td>
                    <td className="border border-slate-950 px-3 py-1 font-bold text-slate-800">
                      {row.lessonTitle}
                    </td>
                    <td className="border border-slate-950 px-3 py-1 text-xl font-semibold">{row.hanzi}</td>
                    <td className="border border-slate-950 px-3 py-1 font-mono">{row.pinyin}</td>
                    <td className="border border-slate-950 px-3 py-1">{row.meaning}</td>
                    <td className="border border-slate-950 px-3 py-1">{row.lessonTopic}</td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-slate-950 bg-slate-50 px-3 py-8 font-bold text-slate-500">
                      Không có từ vựng phù hợp.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
