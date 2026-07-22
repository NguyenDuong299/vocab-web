import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PublicOppositesClient from "./public-opposites-client";

type ShareSettingsRow = {
  user_id: string;
};

type OppositePairRow = {
  id: string;
  left_text: string;
  right_text: string;
  pinyin: string;
  meaning: string;
  position: number | null;
};

function mapOppositePair(row: OppositePairRow, index: number) {
  return {
    id: row.id,
    leftText: row.left_text,
    rightText: row.right_text,
    pinyin: row.pinyin,
    meaning: row.meaning,
    position: row.position ?? index + 1,
  };
}

export default async function PublicOppositesPage({
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

  const { data, error } = await supabase
    .from("vocab_opposite_pairs")
    .select("id,left_text,right_text,pinyin,meaning,position")
    .eq("user_id", shareSettings.user_id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
        Không tải được từ đối lập công khai: {error.message}
      </main>
    );
  }

  return (
    <PublicOppositesClient
      initialOppositePairs={((data ?? []) as OppositePairRow[]).map(
        mapOppositePair,
      )}
      publicId={publicId}
    />
  );
}
