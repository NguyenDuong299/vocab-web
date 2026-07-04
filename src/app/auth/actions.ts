"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

const internalEmailDomain = "vocab-web.local";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function usernameToEmail(username: string) {
  return `${username}@${internalEmailDomain}`;
}

function validateUsernamePassword(formData: FormData, options?: { requirePasswordConfirm?: boolean }) {
  const username = normalizeUsername(readField(formData, "username"));
  const password = readField(formData, "password");
  const passwordConfirm = readField(formData, "passwordConfirm");

  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    return { ok: false as const, error: "Username chỉ gồm chữ thường, số, dấu gạch dưới và dài 3-32 ký tự." };
  }

  if (password.length < 6) {
    return { ok: false as const, error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  if (options?.requirePasswordConfirm && password !== passwordConfirm) {
    return { ok: false as const, error: "Mật khẩu nhập lại không khớp." };
  }

  return { ok: true as const, username, email: usernameToEmail(username), password };
}

export async function loginAction(_state: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const input = validateUsernamePassword(formData);

  if (!input.ok) return input;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");

  return { ok: true };
}

export async function signupAction(_state: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const input = validateUsernamePassword(formData, { requirePasswordConfirm: true });

  if (!input.ok) return input;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        username: input.username,
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");

  if (!data.session) {
    return {
      ok: false,
      error: "Tài khoản đã tạo nhưng Supabase đang bật xác nhận email. Tắt Confirm email trong Supabase Auth để đăng nhập ngay bằng username.",
    };
  }

  return { ok: true };
}

export async function logoutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
