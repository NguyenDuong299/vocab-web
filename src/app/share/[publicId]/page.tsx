import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PublicShareClient from "./public-share-client";

type VocabItemRow = {
  id: string;
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
  return {
    id: row.id,
    title: row.title,
    topic: row.topic ?? "Bài tự tạo",
    wordCount: row.vocab_items?.length ?? 0,
  };
}

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
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

  const { data: lessonsData, error: lessonsError } = await supabase
    .from("vocab_lessons")
    .select("id,title,topic,position,vocab_items(id)")
    .eq("user_id", shareSettings.user_id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (lessonsError) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
        Không tải được dữ liệu công khai: {lessonsError.message}
      </main>
    );
  }

  const { count: oppositePairCount, error: oppositePairsError } = await supabase
    .from("vocab_opposite_pairs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", shareSettings.user_id);

  if (oppositePairsError) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
        Không tải được từ đối lập công khai: {oppositePairsError.message}
      </main>
    );
  }

  return (
    <PublicShareClient
      initialLessons={((lessonsData ?? []) as LessonRow[]).map(mapLesson)}
      initialOppositePairCount={oppositePairCount ?? 0}
      publicId={publicId}
    />
  );
}
