"use client";

import { Alert, Button, Card, Input, Typography } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { AuthResult } from "./actions";

type AuthFormProps = {
  action: (state: AuthResult | null, formData: FormData) => Promise<AuthResult>;
  mode: "login" | "signup";
};

const initialState: AuthResult | null = null;

export function AuthForm({ action, mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(action, initialState);
  const isLogin = mode === "login";
  const nextPath = searchParams.get("next") || "/vocabulary";

  useEffect(() => {
    if (!state?.ok) return;

    if (state.message) return;

    router.replace(nextPath);
    router.refresh();
  }, [nextPath, router, state]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8fafc] px-4 py-8">
      <Card className="w-full max-w-md border border-slate-200 shadow-sm">
        <Typography.Text className="block text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
          Vocab Web
        </Typography.Text>
        <Typography.Title level={2} className="mt-2!">
          {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
        </Typography.Title>

        <form action={formAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Username</span>
            <Input
              name="username"
              autoComplete="username"
              placeholder="vd: hoanganh"
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_]+"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Mật khẩu</span>
            <Input.Password
              name="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="Ít nhất 6 ký tự"
              required
            />
          </label>

          {!isLogin ? (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Nhập lại mật khẩu</span>
              <Input.Password
                name="passwordConfirm"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </label>
          ) : null}

          {state && !state.ok ? <Alert type="error" title={state.error} showIcon className="mb-4" /> : null}
          {state?.ok && state.message ? <Alert type="success" title={state.message} showIcon className="mb-4" /> : null}

          <Button type="primary" htmlType="submit" loading={pending} block>
            {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
          </Button>
        </form>

        <Typography.Paragraph className="mb-0! mt-5! text-center">
          {isLogin ? (
            <>
              Chưa có tài khoản? <Link href="/signup">Tạo tài khoản</Link>
            </>
          ) : (
            <>
              Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
            </>
          )}
        </Typography.Paragraph>
      </Card>
    </main>
  );
}
