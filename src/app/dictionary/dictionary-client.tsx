"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
  SoundOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Input, Row, Space, Statistic, Table, Typography, type TableColumnsType } from "antd";
import { useRouter } from "next/navigation";
import type { DictionaryReviewByItem, Lesson } from "./types";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

type DictionaryRow = Lesson["vocabItems"][number] & {
  lessonId: Lesson["id"];
  lessonTitle: string;
  answer: string;
  isBlank: boolean;
  isCorrect: boolean;
};

type DictionaryClientProps = {
  initialLessons: Lesson[];
  initialReviewByItem: DictionaryReviewByItem;
};

export default function DictionaryClient({ initialLessons, initialReviewByItem }: DictionaryClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [audioError, setAudioError] = useState("");

  const dictionaryRows = useMemo(
    () =>
      initialLessons.flatMap((lesson) =>
        lesson.vocabItems.map((item) => {
          const review = initialReviewByItem[item.id];
          const answer = review?.answer ?? "";

          return {
            ...item,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            answer,
            isBlank: answer.trim().length === 0,
            isCorrect: review?.isCorrect ?? false,
          };
        }),
      ),
    [initialLessons, initialReviewByItem],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) return dictionaryRows;

    return dictionaryRows.filter((row) => {
      const searchableText = [
        row.hanzi,
        row.pinyin,
        row.meaning,
        row.example,
        row.lessonTitle,
        row.answer,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [dictionaryRows, query]);

  const checkedCount = dictionaryRows.filter((row) => !row.isBlank).length;
  const correctCount = dictionaryRows.filter((row) => row.isCorrect).length;

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

  const columns: TableColumnsType<DictionaryRow> = [
    {
      title: "STT",
      width: 72,
      align: "center",
      render: (_value, _row, index) => index + 1,
    },
    {
      title: "BÀI",
      dataIndex: "lessonTitle",
      width: 190,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "CHỮ HÁN",
      dataIndex: "hanzi",
      width: 170,
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
            onClick={(event) => {
              event.stopPropagation();
              playAudio(row.hanzi);
            }}
            aria-label={`Nghe phát âm ${row.hanzi}`}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "PINYIN",
      dataIndex: "pinyin",
      width: 180,
      align: "center",
      render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
    },
    {
      title: "NGHĨA",
      dataIndex: "meaning",
      width: 300,
    },
    {
      title: "VÍ DỤ",
      dataIndex: "example",
      width: 320,
      render: (value: string) => value || "-",
    },
    {
      title: "LUYỆN TẬP",
      dataIndex: "answer",
      width: 260,
      align: "center",
      render: (_value: string, row) => {
        const statusIcon = row.isBlank ? (
          <MinusCircleFilled
            aria-label="Chưa nhập đáp án"
            style={{ color: "#94a3b8", fontSize: 18 }}
          />
        ) : row.isCorrect ? (
          <CheckCircleFilled
            aria-label="Đáp án đúng"
            style={{ color: "#059669", fontSize: 18 }}
          />
        ) : (
          <CloseCircleFilled
            aria-label="Đáp án sai"
            style={{ color: "#ef4444", fontSize: 18 }}
          />
        );
        const answerBorderColor = row.isBlank
          ? "#e2e8f0"
          : row.isCorrect
            ? "#10b981"
            : "#ef4444";

        return (
          <Space.Compact style={{ width: "100%" }}>
            <Input
              readOnly
              value={row.answer}
              placeholder="Chưa làm"
              aria-label={`Luyện tập từ ${row.hanzi}`}
              status={row.isBlank || row.isCorrect ? undefined : "error"}
              className={
                row.isBlank
                  ? ""
                  : row.isCorrect
                    ? "border-emerald-500 bg-emerald-50"
                    : "bg-red-50"
              }
              style={{ borderColor: answerBorderColor }}
            />
            <span
              className="flex w-12 shrink-0 items-center justify-center border border-l-0 bg-white px-2"
              style={{ borderColor: answerBorderColor }}
            >
              {statusIcon}
            </span>
          </Space.Compact>
        );
      },
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card className="border border-slate-200 shadow-sm">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} lg={10}>
              <Typography.Text type="secondary">Tổng hợp dữ liệu từ các bài</Typography.Text>
              <Typography.Title level={2} className="mb-0! mt-1!">
                Từ điển từ vựng
              </Typography.Title>
            </Col>
            <Col xs={24} lg={14}>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={6}>
                  <Statistic title="Số bài" value={initialLessons.length} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="Tổng từ" value={dictionaryRows.length} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="Đã check" value={checkedCount} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title="Đúng" value={correctCount} styles={{ content: { color: "#047857" } }} />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Card className="border border-slate-200 shadow-sm" styles={{ body: { padding: 16 } }}>
          <Input.Search
            allowClear
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập chữ Hán, pinyin, nghĩa, ví dụ, tên bài, hoặc đáp án đã check"
            size="large"
          />
          {audioError ? <Alert className="mt-3" type="error" title={audioError} showIcon /> : null}
        </Card>

        <Table<DictionaryRow>
          bordered
          columns={columns}
          dataSource={filteredRows}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          onRow={(row) => ({
            onClick: () => {
              router.push(`/vocabulary?lessonId=${row.lessonId}&vocabItemId=${row.id}`);
            },
          })}
          rowClassName="cursor-pointer"
          rowKey={(row) => `${row.lessonId}-${row.id}`}
          scroll={{ x: 1352 }}
          size="middle"
          title={() => <Typography.Title level={3}>Từ điển tổng hợp</Typography.Title>}
          locale={{ emptyText: "Không có từ vựng phù hợp." }}
        />
      </Space>
    </main>
  );
}
