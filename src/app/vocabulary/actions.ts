"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult, Lesson, VocabItem } from "./types";

type LessonRow = {
  id: string;
  title: string;
  topic: string;
  position: number;
};

type VocabItemRow = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string | null;
  position: number;
};

function toMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, "");
}

type ShareSettingsRow = {
  public_id: string;
  is_public: boolean;
};

export async function createLessonAction(title: string): Promise<ActionResult<Lesson>> {
  try {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return { ok: false, error: "Nhập tên bài trước." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để tạo bài." };
    }

    const { count, error: countError } = await supabase
      .from("vocab_lessons")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return { ok: false, error: countError.message };
    }

    const lessonNumber = (count ?? 0) + 1;
    const lessonTitle = cleanTitle.toUpperCase().startsWith("BÀI") ? cleanTitle : `BÀI ${lessonNumber}: ${cleanTitle}`;

    const { data, error } = await supabase
      .from("vocab_lessons")
      .insert({
        user_id: user.id,
        title: lessonTitle,
        topic: "Bài tự tạo",
        position: lessonNumber,
      })
      .select("id,title,topic,position")
      .single<LessonRow>();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/vocabulary");

    return {
      ok: true,
      data: {
        id: data.id,
        title: data.title,
        topic: data.topic,
        vocabItems: [],
      },
    };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không tạo được bài.") };
  }
}

export async function reorderLessonsAction(
  lessonIds: string[],
): Promise<ActionResult<{ lessonIds: string[] }>> {
  try {
    const uniqueLessonIds = Array.from(new Set(lessonIds));

    if (
      uniqueLessonIds.length === 0 ||
      uniqueLessonIds.length !== lessonIds.length
    ) {
      return { ok: false, error: "Thứ tự bài học không hợp lệ." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để sắp xếp bài." };
    }

    const { data: ownedLessons, error: ownedError } = await supabase
      .from("vocab_lessons")
      .select("id")
      .eq("user_id", user.id)
      .in("id", uniqueLessonIds);

    if (ownedError) {
      return { ok: false, error: ownedError.message };
    }

    if ((ownedLessons ?? []).length !== uniqueLessonIds.length) {
      return { ok: false, error: "Không tìm thấy đủ bài học cần sắp xếp." };
    }

    for (const [index, lessonId] of uniqueLessonIds.entries()) {
      const { error } = await supabase
        .from("vocab_lessons")
        .update({ position: index + 1 })
        .eq("id", lessonId)
        .eq("user_id", user.id);

      if (error) {
        return { ok: false, error: error.message };
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/vocabulary");
    revalidatePath("/dictionary");

    return { ok: true, data: { lessonIds: uniqueLessonIds } };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không sắp xếp được bài.") };
  }
}

export async function updateLessonTitleAction(input: {
  lessonId: string;
  title: string;
}): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    const title = input.title.trim();

    if (!input.lessonId || !title) {
      return { ok: false, error: "Nhập tên bài trước." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để sửa bài." };
    }

    const { data, error } = await supabase
      .from("vocab_lessons")
      .update({ title })
      .eq("id", input.lessonId)
      .eq("user_id", user.id)
      .select("id,title")
      .single<{ id: string; title: string }>();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/vocabulary");

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không sửa được tên bài.") };
  }
}

export async function deleteLessonAction(lessonId: string): Promise<ActionResult<{ id: string }>> {
  try {
    if (!lessonId) {
      return { ok: false, error: "Thiếu bài cần xóa." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để xóa bài." };
    }

    const { data, error } = await supabase
      .from("vocab_lessons")
      .delete()
      .eq("id", lessonId)
      .eq("user_id", user.id)
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/vocabulary");

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không xóa được bài.") };
  }
}

export async function createVocabItemAction(input: {
  lessonId: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example?: string;
  position: number;
}): Promise<ActionResult<VocabItem>> {
  try {
    const hanzi = input.hanzi.trim().replace(/\s+/g, "");
    const pinyin = input.pinyin.trim();
    const meaning = input.meaning.trim();
    const example = input.example?.trim() ?? "";

    if (!input.lessonId || !hanzi || !pinyin || !meaning) {
      return { ok: false, error: "Thiếu dữ liệu từ vựng." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để thêm từ." };
    }

    const { data, error } = await supabase
      .from("vocab_items")
      .insert({
        user_id: user.id,
        lesson_id: input.lessonId,
        hanzi,
        pinyin,
        meaning,
        example,
        position: input.position,
      })
      .select("id,hanzi,pinyin,meaning,example,position")
      .single<VocabItemRow>();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Từ này đã có trong bảng." };
      }

      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/vocabulary");

    return {
      ok: true,
      data: {
        id: data.id,
        hanzi: data.hanzi,
        pinyin: data.pinyin,
        meaning: data.meaning,
        example: data.example ?? "",
        position: data.position,
      },
    };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không thêm được từ.") };
  }
}

export async function updateVocabItemAction(input: {
  vocabItemId: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example?: string;
}): Promise<ActionResult<VocabItem>> {
  try {
    const hanzi = input.hanzi.trim().replace(/\s+/g, "");
    const pinyin = input.pinyin.trim();
    const meaning = input.meaning.trim();
    const example = input.example?.trim() ?? "";

    if (!input.vocabItemId || !hanzi || !pinyin || !meaning) {
      return { ok: false, error: "Thiếu dữ liệu từ vựng." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để sửa từ." };
    }

    const { data, error } = await supabase
      .from("vocab_items")
      .update({ hanzi, pinyin, meaning, example })
      .eq("id", input.vocabItemId)
      .eq("user_id", user.id)
      .select("id,hanzi,pinyin,meaning,example,position")
      .single<VocabItemRow>();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Từ này đã có trong bảng." };
      }

      return { ok: false, error: error.message };
    }

    revalidatePath("/vocabulary");
    revalidatePath("/dictionary");

    return {
      ok: true,
      data: {
        id: data.id,
        hanzi: data.hanzi,
        pinyin: data.pinyin,
        meaning: data.meaning,
        example: data.example ?? "",
        position: data.position,
      },
    };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không sửa được từ.") };
  }
}

export async function deleteVocabItemAction(
  vocabItemId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!vocabItemId) {
      return { ok: false, error: "Thiếu từ vựng cần xóa." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để xóa từ." };
    }

    const { data, error } = await supabase
      .from("vocab_items")
      .delete()
      .eq("id", vocabItemId)
      .eq("user_id", user.id)
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/vocabulary");
    revalidatePath("/dictionary");

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không xóa được từ.") };
  }
}

export async function saveReviewAnswerAction(input: {
  vocabItemId: string;
  answer: string;
}): Promise<ActionResult<{ answer: string; isCorrect: boolean }>> {
  try {
    const answer = input.answer.trim();

    if (!input.vocabItemId) {
      return { ok: false, error: "Thiếu từ vựng cần lưu." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để lưu tiến độ." };
    }

    const { data: vocabItem, error: vocabError } = await supabase
      .from("vocab_items")
      .select("hanzi")
      .eq("id", input.vocabItemId)
      .eq("user_id", user.id)
      .single<{ hanzi: string }>();

    if (vocabError || !vocabItem) {
      return { ok: false, error: vocabError?.message ?? "Không tìm thấy từ vựng." };
    }

    if (!answer) {
      const { error } = await supabase
        .from("vocab_review_answers")
        .delete()
        .eq("user_id", user.id)
        .eq("vocab_item_id", input.vocabItemId);

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: { answer: "", isCorrect: false } };
    }

    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(vocabItem.hanzi);
    const { error } = await supabase.from("vocab_review_answers").upsert(
      {
        user_id: user.id,
        vocab_item_id: input.vocabItemId,
        answer,
        is_correct: isCorrect,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,vocab_item_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, data: { answer, isCorrect } };
  } catch (error) {
    return { ok: false, error: toMessage(error, "Không lưu được tiến độ.") };
  }
}

export async function updateVocabularyPrivacyAction(
  isPublic: boolean,
): Promise<ActionResult<{ publicId: string; isPublic: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "Bạn cần đăng nhập để đổi quyền riêng tư." };
    }

    const { data: existingSettings, error: existingError } = await supabase
      .from("vocab_share_settings")
      .select("public_id,is_public")
      .eq("user_id", user.id)
      .maybeSingle<ShareSettingsRow>();

    if (existingError) {
      return { ok: false, error: existingError.message };
    }

    const query = existingSettings
      ? supabase
          .from("vocab_share_settings")
          .update({ is_public: isPublic, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
      : supabase
          .from("vocab_share_settings")
          .insert({ user_id: user.id, is_public: isPublic });

    const { data, error } = await query
      .select("public_id,is_public")
      .single<ShareSettingsRow>();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return {
      ok: true,
      data: {
        publicId: data.public_id,
        isPublic: data.is_public,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: toMessage(error, "Không đổi được quyền riêng tư."),
    };
  }
}
