import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DictionaryClient from "./dictionary-client";
import type { DictionaryReviewByItem, Lesson } from "./types";

type VocabItemRow = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string | null;
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
  is_correct: boolean;
};

const REVIEW_ANSWER_BATCH_SIZE = 100;

function mapLesson(row: LessonRow): Lesson {
  const vocabItems = [...(row.vocab_items ?? [])]
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .map((item, index) => ({
      id: item.id,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaning: item.meaning,
      example: item.example ?? "",
      position: item.position ?? index + 1,
    }));

  return {
    id: row.id,
    title: row.title,
    topic: row.topic ?? "Bài tự tạo",
    vocabItems,
  };
}

export default async function DictionaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dictionary");
  }

  const { data, error } = await supabase
    .from("vocab_lessons")
    .select("id,title,topic,position,vocab_items(id,hanzi,pinyin,meaning,example,position)")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main style={{ minHeight: "100vh", padding: 24 }}>
        Không tải được dữ liệu từ điển: {error.message}
      </main>
    );
  }

  const lessons = ((data ?? []) as LessonRow[]).map(mapLesson);
  const vocabItemIds = lessons.flatMap((lesson) => lesson.vocabItems.map((item) => item.id));
  const reviewByItem: DictionaryReviewByItem = {};

  if (vocabItemIds.length > 0) {
    const reviewAnswers: ReviewAnswerRow[] = [];
    let reviewErrorMessage = "";

    for (let index = 0; index < vocabItemIds.length; index += REVIEW_ANSWER_BATCH_SIZE) {
      const batchIds = vocabItemIds.slice(index, index + REVIEW_ANSWER_BATCH_SIZE);
      const { data: batchAnswers, error: batchError } = await supabase
        .from("vocab_review_answers")
        .select("vocab_item_id,answer,is_correct")
        .eq("user_id", user.id)
        .in("vocab_item_id", batchIds);

      if (batchError) {
        reviewErrorMessage = batchError.message;
        break;
      }

      reviewAnswers.push(...((batchAnswers ?? []) as ReviewAnswerRow[]));
    }

    if (reviewErrorMessage) {
      return (
        <main style={{ minHeight: "100vh", padding: 24 }}>
          Không tải được dữ liệu check: {reviewErrorMessage}
        </main>
      );
    }

    for (const row of reviewAnswers) {
      reviewByItem[row.vocab_item_id] = {
        answer: row.answer,
        isCorrect: row.is_correct,
      };
    }
  }

  return <DictionaryClient initialLessons={lessons} initialReviewByItem={reviewByItem} />;
}
