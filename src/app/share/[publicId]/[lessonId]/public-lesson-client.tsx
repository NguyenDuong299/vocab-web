"use client";

import { ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Card,
  Empty,
  Input,
  Space,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";

type VocabItem = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
  position: number;
};

type Lesson = {
  id: string;
  title: string;
  topic: string;
  vocabItems: VocabItem[];
};

type PublicLessonRow = VocabItem & {
  rowNumber: number;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function PublicLessonClient({
  lesson,
  publicId,
}: {
  lesson: Lesson;
  publicId: string;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      lesson.vocabItems.map((item, index) => ({
        ...item,
        rowNumber: index + 1,
      })),
    [lesson.vocabItems],
  );

  const filteredRows = useMemo(() => {
    const keyword = normalizeSearch(query);

    if (!keyword) return rows;

    return rows.filter((row) =>
      [row.hanzi, row.pinyin, row.meaning, row.example].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [query, rows]);

  const columns: TableColumnsType<PublicLessonRow> = [
    {
      title: "STT",
      dataIndex: "rowNumber",
      width: 56,
      align: "center",
    },
    {
      title: "CHỮ HÁN",
      dataIndex: "hanzi",
      width: 148,
      align: "center",
      render: (value: string) => (
        <Typography.Text className="text-2xl!">{value}</Typography.Text>
      ),
    },
    {
      title: "PINYIN",
      dataIndex: "pinyin",
      width: 140,
      align: "center",
      render: (value: string) => (
        <Typography.Text code>{value}</Typography.Text>
      ),
    },
    {
      title: "NGHĨA",
      dataIndex: "meaning",
      width: 180,
    },
    {
      title: "VÍ DỤ",
      dataIndex: "example",
      width: 260,
      render: (value: string) => value || "-",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card className="border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link
                className="mb-4 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                href={`/share/${publicId}`}
              >
                <ArrowLeftOutlined />
                Danh sách bài
              </Link>
              <Typography.Text className="block text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Chế độ xem công khai
              </Typography.Text>
              <Typography.Title level={2} className="mb-0! mt-2!">
                {lesson.title}
              </Typography.Title>
              <Typography.Text type="secondary">
                {lesson.topic} · {rows.length} từ · chỉ xem
              </Typography.Text>
            </div>
            <div className="w-full lg:max-w-md">
              <Input
                allowClear
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm chữ Hán, pinyin, nghĩa hoặc ví dụ"
                prefix={<SearchOutlined />}
                size="large"
                value={query}
              />
            </div>
          </div>
        </Card>

        {rows.length > 0 ? (
          <Table<PublicLessonRow>
            bordered
            className="vocabulary-table"
            columns={columns}
            dataSource={filteredRows}
            pagination={false}
            rowKey="id"
            scroll={{ x: 784 }}
            size="small"
            locale={{ emptyText: "Không có từ vựng phù hợp." }}
          />
        ) : (
          <Card className="border border-slate-200 shadow-sm">
            <Empty description="Bài này chưa có từ vựng." />
          </Card>
        )}
      </Space>
    </main>
  );
}
