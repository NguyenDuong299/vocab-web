"use client";

import { BookOutlined, ReadOutlined } from "@ant-design/icons";
import { Layout, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

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

function getSelectedKey(pathname: string) {
  if (pathname.startsWith("/dictionary")) return "/dictionary";

  return "/vocabulary";
}

export function AppSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const selectedKey = getSelectedKey(pathname);
  const [isMobileSidebar, setIsMobileSidebar] = useState(false);

  return (
    <Layout className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        onBreakpoint={setIsMobileSidebar}
        width={282}
        className="app-sidebar bg-white"
        theme="light"
        style={{
          height: "100vh",
          insetInlineStart: 0,
          overflow: "auto",
          position: "fixed",
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="flex h-20 items-center px-6">
          <div>
            <Typography.Text className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Admin
            </Typography.Text>
            <Typography.Title level={4} className="!m-0 !text-slate-900">
              Vocab Web
            </Typography.Title>
          </div>
        </div>
        <nav className="px-3 py-2">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Menu
          </p>
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = item.key === selectedKey;

              return (
                <Link
                  key={item.key}
                  href={item.key}
                  className={`flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition ${
                    isActive
                      ? "bg-[#eaf1ff] text-[#3451ff]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span
                    className={`grid size-9 place-items-center rounded-lg text-lg transition ${
                      isActive
                        ? "bg-[#4f63ff] text-white"
                        : "bg-transparent text-slate-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </Sider>
      <Layout
        className="app-main-layout min-w-0 bg-[#f3f6ef]"
        style={{ marginInlineStart: isMobileSidebar ? 0 : 282, minHeight: "100vh" }}
      >
        <Content className="min-w-0">{children}</Content>
      </Layout>
    </Layout>
  );
}
