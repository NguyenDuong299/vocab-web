"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult } from "@/app/vocabulary/types";

function toMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function saveRulesNoteAction(
  content: string,
): Promise<ActionResult<{ content: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để lưu quy tắc." };
    }

    const { error } = await supabase.from("vocab_rules_notes").upsert(
      {
        user_id: user.id,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/rules");

    return { ok: true, data: { content } };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không lưu được quy tắc.") };
  }
}
