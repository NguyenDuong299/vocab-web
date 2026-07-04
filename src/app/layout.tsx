import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "antd/dist/reset.css";
import type { SidebarLesson } from "@/components/app-sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/utils/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chinese Vocabulary",
  description: "Learn and review Chinese vocabulary.",
};

type SidebarLessonRow = {
  id: string;
  title: string;
  topic: string | null;
  position: number | null;
  vocab_items: { id: string }[] | null;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : (user?.email?.split("@")[0] ?? null);
  let lessons: SidebarLesson[] = [];

  if (user) {
    const { data } = await supabase
      .from("vocab_lessons")
      .select("id,title,topic,position,vocab_items(id)")
      .eq("user_id", user.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    lessons = ((data ?? []) as SidebarLessonRow[]).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      topic: lesson.topic ?? "Bài tự tạo",
      wordCount: lesson.vocab_items?.length ?? 0,
    }));
  }

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppSidebar lessons={lessons} username={username}>
          {children}
        </AppSidebar>
      </body>
    </html>
  );
}
