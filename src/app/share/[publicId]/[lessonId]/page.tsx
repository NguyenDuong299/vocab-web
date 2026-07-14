import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PublicLessonClient from "./public-lesson-client";

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

type ShareSettingsRow = {
  user_id: string;
};

function mapLesson(row: LessonRow) {
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

export default async function PublicLessonPage({
  params,
}: {
  params: Promise<{ publicId: string; lessonId: string }>;
}) {
  const { lessonId, publicId } = await params;
  const supabase = await createClient();
  const { data: shareSettings, error: settingsError } = await supabase
    .from("vocab_share_settings")
    .select("user_id")
    .eq("public_id", publicId)
    .eq("is_public", true)
    .maybeSingle<ShareSettingsRow>();

  if (settingsError || !shareSettings) {
    notFound();
  }

  const { data, error } = await supabase
    .from("vocab_lessons")
    .select("id,title,topic,position,vocab_items(id,hanzi,pinyin,meaning,example,position)")
    .eq("id", lessonId)
    .eq("user_id", shareSettings.user_id)
    .maybeSingle<LessonRow>();

  if (error || !data) {
    notFound();
  }

  return <PublicLessonClient lesson={mapLesson(data)} publicId={publicId} />;
}
