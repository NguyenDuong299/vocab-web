"use client";

import {
  BookOutlined,
  HolderOutlined,
  PlusOutlined,
  ReadOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Input, Layout, Modal, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  createLessonAction,
  reorderLessonsAction,
} from "@/app/vocabulary/actions";
import { AppHeader } from "@/components/app-header";

const { Sider, Content } = Layout;

const navItems = [
  {
    key: "/vocabulary",
    icon: <BookOutlined />,
    label: "Từ vựng",
  },
  {
    key: "/dictionary",
    icon: <ReadOutlined />,
    label: "Từ điển",
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
  username,
}: {
  children: ReactNode;
  lessons: SidebarLesson[];
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
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [createLessonError, setCreateLessonError] = useState("");
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dropTargetLessonId, setDropTargetLessonId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState("");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const orderedLessons = getOrderedLessons(lessons, optimisticLessonIds);

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

  if (isAuthPage) {
    return children;
  }

  return (
    <Layout className="min-h-screen bg-[#f8fafc]">
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        onBreakpoint={setIsMobileSidebar}
        width={282}
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
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <div>
            <Typography.Text className="block text-xs font-bold uppercase tracking-[0.18em] text-sky-500">
              Admin
            </Typography.Text>
            <Typography.Title level={4} className="m-0! text-slate-900!">
              Vocab Web
            </Typography.Title>
          </div>
        </div>
        <nav className="px-3 py-2">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Menu
          </p>
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.key === selectedKey;

              return (
                <li key={item.key}>
                  <Link
                    href={item.key}
                    className={`group relative flex h-11 w-full items-center gap-3 rounded-xl border px-2.5 text-sm font-medium transition-colors ${
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
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <nav className="border-t border-slate-100 px-3 py-4">
          <div className="mb-3 flex items-center justify-between px-3">
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-slate-400">
              Bài học
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {orderedLessons.length}
              </span>
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
            <ul className="space-y-1.5">
              {orderedLessons.map((lesson) => {
                const isActive =
                  pathname.startsWith("/vocabulary") &&
                  selectedLessonId === lesson.id;
                const isDropTarget = dropTargetLessonId === lesson.id;

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
                    <Link
                      href={`/vocabulary?lessonId=${encodeURIComponent(lesson.id)}`}
                      onClick={(event) => selectLesson(event, lesson.id)}
                      className={`group flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "border-[#91caff] bg-[#e6f4ff] text-[#0958d9] shadow-sm"
                          : isDropTarget
                            ? "border-[#91caff] bg-slate-50"
                          : "border-transparent text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-base ${
                          isActive
                            ? "bg-[#1677ff] text-white shadow-sm"
                            : "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:bg-slate-100"
                        }`}
                      >
                        <UnorderedListOutlined />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {lesson.title}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                        {lesson.wordCount} từ
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 cursor-grab text-slate-300 transition-colors group-hover:text-slate-500"
                      >
                        <HolderOutlined />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 text-sm text-slate-400">Chưa có bài học.</p>
          )}
          {reorderError ? (
            <p className="mt-3 px-3 text-sm text-red-500">{reorderError}</p>
          ) : null}
        </nav>
      </Sider>
      <Layout
        className="app-main-layout min-w-0 bg-[#f8fafc]"
        style={{ marginInlineStart: isMobileSidebar ? 0 : 282, minHeight: "100vh" }}
      >
        <AppHeader username={username} />
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
