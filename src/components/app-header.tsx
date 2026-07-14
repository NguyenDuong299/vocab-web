"use client";

import {
  CopyOutlined,
  GlobalOutlined,
  LinkOutlined,
  LockOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Switch, Tooltip, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/auth/actions";
import { updateVocabularyPrivacyAction } from "@/app/vocabulary/actions";

const { Header } = Layout;

export type ShareSettings = {
  publicId: string;
  isPublic: boolean;
};

export function AppHeader({
  initialShareSettings,
  username,
}: {
  initialShareSettings: ShareSettings | null;
  username: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [shareSettings, setShareSettings] = useState(initialShareSettings);
  const [privacyError, setPrivacyError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPublic = shareSettings?.isPublic ?? false;

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutAction();
    router.replace("/login");
    router.refresh();
  }

  async function updatePrivacy(nextIsPublic: boolean) {
    if (isUpdatingPrivacy) return;

    setIsUpdatingPrivacy(true);
    setPrivacyError("");
    setCopyStatus("");

    const result = await updateVocabularyPrivacyAction(nextIsPublic);

    setIsUpdatingPrivacy(false);

    if (!result.ok) {
      setPrivacyError(result.error);
      return;
    }

    setShareSettings(result.data);
    router.refresh();
  }

  async function copyShareLink() {
    if (!shareSettings?.publicId || !shareSettings.isPublic) return;

    const shareUrl = `${window.location.origin}/share/${shareSettings.publicId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Đã sao chép link.");
      setPrivacyError("");
    } catch {
      setPrivacyError("Không sao chép được link.");
      setCopyStatus("");
    }
  }

  return (
    <Header
      className="sticky top-0 z-50 flex h-auto min-h-16 items-center justify-end border-b border-sky-100 px-4 py-3 shadow-sm backdrop-blur sm:px-6"
      style={{ background: "rgba(238, 247, 255, 0.95)" }}
    >
      {username ? (
        <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                isPublic
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {isPublic ? <GlobalOutlined /> : <LockOutlined />}
              {isPublic ? "Công khai" : "Riêng tư"}
            </span>
            <Switch
              checked={isPublic}
              checkedChildren="Công khai"
              loading={isUpdatingPrivacy}
              onChange={updatePrivacy}
              unCheckedChildren="Riêng tư"
            />
            <Tooltip
              title={
                isPublic
                  ? "Sao chép link xem công khai"
                  : "Bật công khai để sao chép link"
              }
            >
              <Button
                disabled={!shareSettings?.publicId || !isPublic}
                icon={<CopyOutlined />}
                onClick={copyShareLink}
              >
                Link
              </Button>
            </Tooltip>
            {shareSettings?.publicId && isPublic ? (
              <Link
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-sky-700 transition hover:bg-white"
                href={`/share/${shareSettings.publicId}`}
                target="_blank"
              >
                <LinkOutlined />
                Xem public
              </Link>
            ) : null}
            {privacyError ? (
              <Typography.Text type="danger" className="text-sm">
                {privacyError}
              </Typography.Text>
            ) : null}
            {copyStatus ? (
              <Typography.Text className="text-sm text-emerald-600">
                {copyStatus}
              </Typography.Text>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-3">
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
