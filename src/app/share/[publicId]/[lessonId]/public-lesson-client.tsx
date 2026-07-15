"use client";

import { ArrowLeftOutlined, SearchOutlined, SoundOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
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
  const [audioError, setAudioError] = useState("");

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

  function playAudio(text: string) {
    if (!("speechSynthesis" in window)) {
      setAudioError("Trình duyệt không hỗ trợ phát âm tự động.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;

    window.speechSynthesis.speak(utterance);
    setAudioError("");
  }

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
      render: (value: string, row) => (
        <div className="flex w-full items-center justify-between gap-2">
          <span className="min-w-0 flex-1 text-center">
            <Typography.Text className="text-xl" strong>
              {value}
            </Typography.Text>
          </span>
          <Button
            className="grid! size-8! place-items-center! rounded-full! border-sky-100! bg-sky-50! text-sky-600! shadow-sm transition! hover:border-sky-200! hover:bg-sky-100! hover:text-sky-700!"
            icon={<SoundOutlined />}
            onClick={() => playAudio(row.hanzi)}
            aria-label={`Nghe phát âm ${row.hanzi}`}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "PINYIN",
      dataIndex: "pinyin",
      width: 140,
      align: "center",
      render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
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
              {audioError ? (
                <Alert className="mt-3" type="error" title={audioError} showIcon />
              ) : null}
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
