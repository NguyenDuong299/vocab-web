"use client";

import {
  FileTextOutlined,
  HolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ReadOutlined,
  SwapOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Input, Layout, Modal, Tooltip, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  createLessonAction,
  reorderLessonsAction,
} from "@/app/vocabulary/actions";
import { AppHeader } from "@/components/app-header";
import type { ShareSettings } from "@/components/app-header";

const { Sider, Content } = Layout;
const SIDEBAR_WIDTH = 282;
const COLLAPSED_SIDEBAR_WIDTH = 76;

const navItems = [
  {
    key: "/dictionary",
    icon: <ReadOutlined />,
    label: "Từ điển",
  },
  {
    key: "/rules",
    icon: <FileTextOutlined />,
    label: "Quy tắc",
  },
  {
    key: "/opposites",
    icon: <SwapOutlined />,
    label: "Từ đối lập",
  },
];

export type SidebarLesson = {
  id: string;
  title: string;
  topic: string;
  wordCount: number;
};

function getSelectedKey(pathname: string) {
  if (pathname.startsWith("/dictionary")) return "/dictionary";
  if (pathname.startsWith("/rules")) return "/rules";
  if (pathname.startsWith("/opposites")) return "/opposites";

  return "/vocabulary";
}

function moveLesson(
  lessons: SidebarLesson[],
  activeLessonId: string,
  targetLessonId: string,
) {
  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLessonId);
  const targetIndex = lessons.findIndex((lesson) => lesson.id === targetLessonId);

  if (activeIndex < 0 || targetIndex < 0 || activeIndex === targetIndex) {
    return lessons;
  }

  const nextLessons = [...lessons];
  const [activeLesson] = nextLessons.splice(activeIndex, 1);

  nextLessons.splice(targetIndex, 0, activeLesson);

  return nextLessons;
}

function getOrderedLessons(lessons: SidebarLesson[], lessonIds: string[]) {
  if (lessonIds.length !== lessons.length) return lessons;

  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const orderedLessons = lessonIds.map((lessonId) => lessonById.get(lessonId));

  if (orderedLessons.some((lesson) => !lesson)) return lessons;

  return orderedLessons as SidebarLesson[];
}

export function AppSidebar({
  children,
  lessons,
  shareSettings,
  username,
}: {
  children: ReactNode;
  lessons: SidebarLesson[];
  shareSettings: ShareSettings | null;
  username: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedKey = getSelectedKey(pathname);
  const selectedLessonId = pathname.startsWith("/vocabulary")
    ? searchParams.get("lessonId")
    : null;
  const [optimisticLessonIds, setOptimisticLessonIds] = useState<string[]>([]);
  const [isMobileSidebar, setIsMobileSidebar] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [createLessonError, setCreateLessonError] = useState("");
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dropTargetLessonId, setDropTargetLessonId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState("");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPublicSharePage = pathname.startsWith("/share/");
  const orderedLessons = getOrderedLessons(lessons, optimisticLessonIds);
  const isSidebarCollapsed = isMobileSidebar
    ? !isMobileSidebarOpen
    : isDesktopCollapsed;
  const currentSidebarWidth = isDesktopCollapsed
    ? COLLAPSED_SIDEBAR_WIDTH
    : SIDEBAR_WIDTH;

  async function createLesson() {
    if (isCreatingLesson) return;

    const title = newLessonTitle.trim();

    if (!title) {
      setCreateLessonError("Nhập tên bài trước.");
      return;
    }

    setIsCreatingLesson(true);
    setCreateLessonError("");

    const result = await createLessonAction(title);

    setIsCreatingLesson(false);

    if (!result.ok) {
      setCreateLessonError(result.error);
      return;
    }

    setIsCreateLessonOpen(false);
    setNewLessonTitle("");
    router.push(`/vocabulary?lessonId=${encodeURIComponent(result.data.id)}`);
    router.refresh();
  }

  function closeCreateLessonModal() {
    if (isCreatingLesson) return;

    setIsCreateLessonOpen(false);
    setNewLessonTitle("");
    setCreateLessonError("");
  }

  function selectLesson(event: MouseEvent<HTMLAnchorElement>, lessonId: string) {
    if (
      !pathname.startsWith("/vocabulary") ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState(
      null,
      "",
      `/vocabulary?lessonId=${encodeURIComponent(lessonId)}`,
    );
    setIsMobileSidebarOpen(false);
  }

  async function reorderLessons(targetLessonId: string) {
    if (!draggedLessonId || draggedLessonId === targetLessonId) return;

    const previousLessonIds = orderedLessons.map((lesson) => lesson.id);
    const nextLessons = moveLesson(
      orderedLessons,
      draggedLessonId,
      targetLessonId,
    );

    if (nextLessons === orderedLessons) return;

    setOptimisticLessonIds(nextLessons.map((lesson) => lesson.id));
    setReorderError("");

    const result = await reorderLessonsAction(
      nextLessons.map((lesson) => lesson.id),
    );

    if (!result.ok) {
      setOptimisticLessonIds(previousLessonIds);
      setReorderError(result.error);
      return;
    }

    router.refresh();
  }

  if (isAuthPage || isPublicSharePage) {
    return children;
  }

  return (
    <Layout className="min-h-screen bg-[#f8fafc]">
      <Sider
        breakpoint="lg"
        collapsed={isSidebarCollapsed}
        collapsedWidth={isMobileSidebar ? 0 : COLLAPSED_SIDEBAR_WIDTH}
        onBreakpoint={(broken) => {
          setIsMobileSidebar(broken);
          setIsMobileSidebarOpen(false);
        }}
        trigger={null}
        width={SIDEBAR_WIDTH}
        className="app-sidebar border-r border-slate-200 bg-[#fbfdff]"
        theme="light"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          insetInlineStart: 0,
          overflow: "auto",
          position: "fixed",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className={`flex h-20 items-center border-b border-slate-100 ${
            isDesktopCollapsed && !isMobileSidebar
              ? "justify-center px-2"
              : "justify-between px-6"
          }`}
        >
          {isDesktopCollapsed && !isMobileSidebar ? (
            <Tooltip title="Mở rộng sidebar" placement="right">
              <Button
                aria-label="Mở rộng sidebar"
                className="font-bold"
                onClick={() => setIsDesktopCollapsed(false)}
                shape="circle"
                type="text"
              >
                VW
              </Button>
            </Tooltip>
          ) : (
            <>
              <div className="min-w-0">
                <Typography.Text className="block text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
                  Admin
                </Typography.Text>
                <Typography.Title level={4} className="m-0! truncate text-slate-900!">
                  Vocab Web
                </Typography.Title>
              </div>
              <Tooltip
                title={isMobileSidebar ? "Đóng sidebar" : "Thu gọn sidebar"}
                placement="right"
              >
                <Button
                  aria-label={isMobileSidebar ? "Đóng sidebar" : "Thu gọn sidebar"}
                  icon={<MenuFoldOutlined />}
                  onClick={() => {
                    if (isMobileSidebar) {
                      setIsMobileSidebarOpen(false);
                      return;
                    }

                    setIsDesktopCollapsed(true);
                  }}
                  shape="circle"
                  type="text"
                />
              </Tooltip>
            </>
          )}
        </div>
        <nav className={isDesktopCollapsed && !isMobileSidebar ? "px-2 py-2" : "px-3 py-2"}>
          {isDesktopCollapsed && !isMobileSidebar ? null : (
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Menu
            </p>
          )}
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.key === selectedKey;
              const itemLink = (
                <Link
                  href={item.key}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`group relative flex h-11 w-full items-center rounded-xl border text-sm font-medium transition-colors ${
                    isDesktopCollapsed && !isMobileSidebar
                      ? "justify-center px-0"
                      : "gap-3 px-2.5"
                  } ${
                    isActive
                      ? "border-[#91caff] bg-[#e6f4ff] text-[#0958d9] shadow-sm"
                      : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {isActive ? (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#1677ff]" />
                  ) : null}
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors ${
                      isActive
                        ? "bg-[#1677ff] text-white shadow-sm"
                        : "text-slate-500 group-hover:bg-slate-100"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {isDesktopCollapsed && !isMobileSidebar ? null : (
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  )}
                </Link>
              );

              return (
                <li key={item.key}>
                  {isDesktopCollapsed && !isMobileSidebar ? (
                    <Tooltip title={item.label} placement="right">
                      {itemLink}
                    </Tooltip>
                  ) : (
                    itemLink
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <nav className="border-t border-slate-100 px-2 py-3">
          <div
            className={`mb-2 flex items-center ${
              isDesktopCollapsed && !isMobileSidebar
                ? "justify-center"
                : "justify-between px-2"
            }`}
          >
            {isDesktopCollapsed && !isMobileSidebar ? null : (
              <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Bài học
              </p>
            )}
            <div className="flex items-center gap-1.5">
              {isDesktopCollapsed && !isMobileSidebar ? null : (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-slate-500">
                {orderedLessons.length}
                </span>
              )}
              <Button
                aria-label="Thêm bài học"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateLessonOpen(true)}
                shape="circle"
                size="small"
                title="Thêm bài học"
                type="text"
              />
            </div>
          </div>
          {orderedLessons.length > 0 ? (
            <ul className="space-y-1">
              {orderedLessons.map((lesson) => {
                const isActive =
                  pathname.startsWith("/vocabulary") &&
                  selectedLessonId === lesson.id;
                const isDropTarget = dropTargetLessonId === lesson.id;
                const lessonLink = (
                  <Link
                    href={`/vocabulary?lessonId=${encodeURIComponent(lesson.id)}`}
                    onClick={(event) => selectLesson(event, lesson.id)}
                    className={`group flex min-h-9 w-full items-center rounded-lg border text-xs transition-colors ${
                      isDesktopCollapsed && !isMobileSidebar
                        ? "justify-center px-0 py-1.5"
                        : "gap-2 px-2 py-1.5"
                    } ${
                      isActive
                        ? "border-[#91caff] bg-[#e6f4ff] text-[#0958d9] shadow-sm"
                        : isDropTarget
                          ? "border-[#91caff] bg-slate-50"
                        : "border-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md text-sm ${
                        isActive
                          ? "bg-[#1677ff] text-white shadow-sm"
                          : "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:bg-slate-100"
                      }`}
                    >
                      <UnorderedListOutlined />
                    </span>
                    {isDesktopCollapsed && !isMobileSidebar ? null : (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium leading-5">
                            {lesson.title}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-slate-500">
                          {lesson.wordCount}
                        </span>
                        <span
                          aria-hidden="true"
                          className="shrink-0 cursor-grab text-xs text-slate-300 transition-colors group-hover:text-slate-500"
                        >
                          <HolderOutlined />
                        </span>
                      </>
                    )}
                  </Link>
                );

                return (
                  <li
                    draggable
                    key={lesson.id}
                    onDragEnd={() => {
                      setDraggedLessonId(null);
                      setDropTargetLessonId(null);
                    }}
                    onDragEnter={() => setDropTargetLessonId(lesson.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDragStart={() => {
                      setDraggedLessonId(lesson.id);
                      setReorderError("");
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDropTargetLessonId(null);
                      void reorderLessons(lesson.id);
                    }}
                  >
                    {isDesktopCollapsed && !isMobileSidebar ? (
                      <Tooltip
                        title={`${lesson.title} (${lesson.wordCount} từ)`}
                        placement="right"
                      >
                        {lessonLink}
                      </Tooltip>
                    ) : (
                      lessonLink
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            isDesktopCollapsed && !isMobileSidebar ? null : (
              <p className="px-3 text-sm text-slate-400">Chưa có bài học.</p>
            )
          )}
          {reorderError && !(isDesktopCollapsed && !isMobileSidebar) ? (
            <p className="mt-3 px-3 text-sm text-red-500">{reorderError}</p>
          ) : null}
        </nav>
      </Sider>
      {isMobileSidebar && !isMobileSidebarOpen ? (
        <Tooltip title="Mở sidebar">
          <Button
            aria-label="Mở sidebar"
            className="fixed left-3 top-3 z-[120] shadow-sm"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setIsMobileSidebarOpen(true)}
            shape="circle"
          />
        </Tooltip>
      ) : null}
      {isMobileSidebar && isMobileSidebarOpen ? (
        <button
          aria-label="Đóng sidebar"
          className="fixed inset-0 z-[90] cursor-default bg-slate-900/20"
          onClick={() => setIsMobileSidebarOpen(false)}
          type="button"
        />
      ) : null}
      <Layout
        className="app-main-layout min-w-0 bg-[#f8fafc]"
        style={{
          marginInlineStart: isMobileSidebar ? 0 : currentSidebarWidth,
          minHeight: "100vh",
          transition: "margin-inline-start 0.2s ease",
        }}
      >
        <AppHeader initialShareSettings={shareSettings} username={username} />
        <Content className="min-w-0">{children}</Content>
      </Layout>
      <Modal
        confirmLoading={isCreatingLesson}
        okText="Thêm bài"
        onCancel={closeCreateLessonModal}
        onOk={createLesson}
        open={isCreateLessonOpen}
        title="Thêm bài học"
      >
        <div className="space-y-2">
          <Input
            autoFocus
            onChange={(event) => {
              setNewLessonTitle(event.target.value);
              setCreateLessonError("");
            }}
            onPressEnter={createLesson}
            placeholder="Tên bài học"
            status={createLessonError ? "error" : undefined}
            value={newLessonTitle}
          />
          {createLessonError ? (
            <p className="m-0 text-sm text-red-500">{createLessonError}</p>
          ) : null}
        </div>
      </Modal>
    </Layout>
  );
}
