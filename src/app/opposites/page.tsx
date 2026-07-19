import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import OppositesClient from "./opposites-client";
import type { OppositePair } from "./types";

type OppositePairRow = {
  id: string;
  left_text: string;
  right_text: string;
  pinyin: string;
  meaning: string;
  position: number | null;
};

export default async function OppositesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/opposites");
  }

  const { data, error } = await supabase
    .from("vocab_opposite_pairs")
    .select("id,left_text,right_text,pinyin,meaning,position")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-4 text-sm text-red-500 sm:p-6">
        Không tải được cặp từ trái nghĩa: {error.message}
      </main>
    );
  }

  const oppositePairs: OppositePair[] = ((data ?? []) as OppositePairRow[]).map(
    (pair, index) => ({
      id: pair.id,
      leftText: pair.left_text,
      rightText: pair.right_text,
      pinyin: pair.pinyin,
      meaning: pair.meaning,
      position: pair.position ?? index + 1,
    }),
  );

  return <OppositesClient initialOppositePairs={oppositePairs} />;
}
