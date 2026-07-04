import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VocabularyClient from "./vocabulary-client";
import type { AnswersByLesson, Lesson } from "./types";

type VocabItemRow = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  position: number | null;
};

type LessonRow = {
  id: string;
  title: string;
  topic: string | null;
  position: number | null;
  vocab_items: VocabItemRow[] | null;
};

type ReviewAnswerRow = {
  vocab_item_id: string;
  answer: string;
};

function mapLesson(row: LessonRow): Lesson {
  const vocabItems = [...(row.vocab_items ?? [])]
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .map((item, index) => ({
      id: item.id,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaning: item.meaning,
      position: item.position ?? index + 1,
    }));

  return {
    id: row.id,
    title: row.title,
    topic: row.topic ?? "Bài tự tạo",
    vocabItems,
  };
}

export default async function VocabularyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/vocabulary")}`);
  }

  const { data, error } = await supabase
    .from("vocab_lessons")
    .select("id,title,topic,position,vocab_items(id,hanzi,pinyin,meaning,position)")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        Không tải được dữ liệu từ vựng: {error.message}
      </main>
    );
  }

  const lessons = ((data ?? []) as LessonRow[]).map(mapLesson);
  const lessonIdByItemId = new Map<string, string>();
  const vocabItemIds = lessons.flatMap((lesson) =>
    lesson.vocabItems.map((item) => {
      lessonIdByItemId.set(item.id, lesson.id);

      return item.id;
    }),
  );
  const initialAnswersByLesson: AnswersByLesson = {};

  if (vocabItemIds.length > 0) {
    const { data: reviewAnswers, error: reviewError } = await supabase
      .from("vocab_review_answers")
      .select("vocab_item_id,answer")
      .eq("user_id", user.id)
      .in("vocab_item_id", vocabItemIds);

    if (reviewError) {
      return (
        <main style={{ minHeight: "100vh", padding: 24 }}>
          Không tải được tiến độ luyện tập: {reviewError.message}
        </main>
      );
    }

    for (const row of (reviewAnswers ?? []) as ReviewAnswerRow[]) {
      const lessonId = lessonIdByItemId.get(row.vocab_item_id);

      if (!lessonId) continue;

      initialAnswersByLesson[lessonId] = {
        ...(initialAnswersByLesson[lessonId] ?? {}),
        [row.vocab_item_id]: row.answer,
      };
    }
  }

  return (
    <VocabularyClient
      initialLessons={lessons}
      initialAnswersByLesson={initialAnswersByLesson}
    />
  );
}
