import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import RulesNotepad from "./rules-notepad";

type RulesNoteRow = {
  content: string;
};

export default async function RulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/rules");
  }

  const { data, error } = await supabase
    .from("vocab_rules_notes")
    .select("content")
    .eq("user_id", user.id)
    .maybeSingle<RulesNoteRow>();

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6 text-sm text-red-500 sm:px-10 sm:py-8">
        Không tải được ghi chú quy tắc: {error.message}
      </main>
    );
  }

  return <RulesNotepad initialNote={data?.content ?? ""} />;
}
