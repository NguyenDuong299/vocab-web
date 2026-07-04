"use client";

import { LoginOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Layout, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/auth/actions";

const { Header } = Layout;

export function AppHeader({ username }: { username: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutAction();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Header
      className="sticky top-0 z-50 flex h-16 items-center justify-end border-b border-sky-100 px-4 shadow-sm backdrop-blur sm:px-6"
      style={{ background: "rgba(238, 247, 255, 0.95)" }}
    >
      {username ? (
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden min-w-0 items-center gap-3 sm:flex">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <UserOutlined />
            </span>
            <span className="min-w-0 text-right">
              <Typography.Text className="block text-xs font-bold uppercase text-sky-500">
                Tài khoản
              </Typography.Text>
              <Typography.Text className="block max-w-64 truncate text-sm font-semibold text-slate-800">
                {username}
              </Typography.Text>
            </span>
          </span>
          <Button icon={<LogoutOutlined />} loading={isLoggingOut} onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      ) : (
        <Link
          href="/login"
          className={`flex h-10 items-center justify-center gap-2 rounded-lg px-4 font-semibold transition ${
            isAuthPage
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-700 hover:bg-white hover:shadow-sm"
          }`}
        >
          <LoginOutlined />
          <span>Đăng nhập</span>
        </Link>
      )}
    </Header>
  );
}
