"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult, OppositePair } from "./types";

type OppositePairRow = {
  id: string;
  left_text: string;
  right_text: string;
  pinyin: string;
  meaning: string;
  position: number;
};

function toMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function mapOppositePair(row: OppositePairRow): OppositePair {
  return {
    id: row.id,
    leftText: row.left_text,
    rightText: row.right_text,
    pinyin: row.pinyin,
    meaning: row.meaning,
    position: row.position,
  };
}

export async function createOppositePairAction(input: {
  leftText: string;
  rightText: string;
  pinyin: string;
  meaning: string;
}): Promise<ActionResult<OppositePair>> {
  try {
    const leftText = input.leftText.trim().replace(/\s+/g, "");
    const rightText = input.rightText.trim().replace(/\s+/g, "");
    const pinyin = input.pinyin.trim();
    const meaning = input.meaning.trim();

    if (!leftText || !rightText || !pinyin || !meaning) {
      return { ok: false, error: "Nhập đủ cặp từ trái nghĩa và nghĩa tiếng Việt." };
    }

    if (leftText === rightText) {
      return { ok: false, error: "Hai vế trái nghĩa không được trùng nhau." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để thêm cặp từ." };
    }

    const { count, error: countError } = await supabase
      .from("vocab_opposite_pairs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return { ok: false, error: countError.message };
    }

    const { data, error } = await supabase
      .from("vocab_opposite_pairs")
      .insert({
        user_id: user.id,
        left_text: leftText,
        right_text: rightText,
        pinyin,
        meaning,
        position: (count ?? 0) + 1,
      })
      .select("id,left_text,right_text,pinyin,meaning,position")
      .single<OppositePairRow>();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Cặp từ này đã có trong bảng." };
      }

      return { ok: false, error: error.message };
    }

    revalidatePath("/opposites");

    return { ok: true, data: mapOppositePair(data) };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không thêm được cặp từ.") };
  }
}

export async function updateOppositePairAction(input: {
  id: string;
  leftText: string;
  rightText: string;
  pinyin: string;
  meaning: string;
}): Promise<ActionResult<OppositePair>> {
  try {
    const leftText = input.leftText.trim().replace(/\s+/g, "");
    const rightText = input.rightText.trim().replace(/\s+/g, "");
    const pinyin = input.pinyin.trim();
    const meaning = input.meaning.trim();

    if (!input.id || !leftText || !rightText || !pinyin || !meaning) {
      return { ok: false, error: "Nhập đủ cặp từ trái nghĩa và nghĩa tiếng Việt." };
    }

    if (leftText === rightText) {
      return { ok: false, error: "Hai vế trái nghĩa không được trùng nhau." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để sửa cặp từ." };
    }

    const { data, error } = await supabase
      .from("vocab_opposite_pairs")
      .update({ left_text: leftText, right_text: rightText, pinyin, meaning })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("id,left_text,right_text,pinyin,meaning,position")
      .single<OppositePairRow>();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Cặp từ này đã có trong bảng." };
      }

      return { ok: false, error: error.message };
    }

    revalidatePath("/opposites");

    return { ok: true, data: mapOppositePair(data) };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không sửa được cặp từ.") };
  }
}

export async function deleteOppositePairAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!id) {
      return { ok: false, error: "Thiếu cặp từ cần xóa." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để xóa cặp từ." };
    }

    const { data, error } = await supabase
      .from("vocab_opposite_pairs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/opposites");

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không xóa được cặp từ.") };
  }
}
