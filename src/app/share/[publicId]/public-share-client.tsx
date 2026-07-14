"use client";

import { BookOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";
import { Card, Col, Empty, Input, Row, Space, Statistic, Typography } from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";

type PublicLesson = {
  id: string;
  title: string;
  topic: string;
  wordCount: number;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function PublicShareClient({
  initialLessons,
  publicId,
}: {
  initialLessons: PublicLesson[];
  publicId: string;
}) {
  const [query, setQuery] = useState("");
  const totalWords = initialLessons.reduce(
    (total, lesson) => total + lesson.wordCount,
    0,
  );
  const filteredLessons = useMemo(() => {
    const keyword = normalizeSearch(query);

    if (!keyword) return initialLessons;

    return initialLessons.filter((lesson) =>
      [lesson.title, lesson.topic].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [initialLessons, query]);

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card className="border border-slate-200 shadow-sm">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} lg={12}>
              <Typography.Text className="block text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Chế độ xem công khai
              </Typography.Text>
              <Typography.Title level={2} className="mb-0! mt-2!">
                Danh sách bài học
              </Typography.Title>
              <Typography.Text type="secondary">
                Chọn một bài để xem từ vựng. Nội dung chỉ đọc, không thể thêm,
                sửa, xóa hoặc luyện tập.
              </Typography.Text>
            </Col>
            <Col xs={24} lg={12}>
              <Row gutter={[12, 12]}>
                <Col xs={12}>
                  <Statistic title="Số bài" value={initialLessons.length} />
                </Col>
                <Col xs={12}>
                  <Statistic title="Tổng từ" value={totalWords} />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Card className="border border-slate-200 shadow-sm" styles={{ body: { padding: 16 } }}>
          <Input
            allowClear
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên bài hoặc chủ đề"
            prefix={<SearchOutlined />}
            size="large"
            value={query}
          />
        </Card>

        {filteredLessons.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredLessons.map((lesson) => (
              <Col key={lesson.id} xs={24} md={12} xl={8}>
                <Link
                  className="group block h-full"
                  href={`/share/${publicId}/${lesson.id}`}
                >
                  <Card
                    className="h-full border border-slate-200 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                    styles={{ body: { padding: 18 } }}
                  >
                    <div className="flex h-full items-start gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-sky-50 text-xl text-sky-600 ring-1 ring-sky-100">
                        <BookOutlined />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Typography.Title
                          level={4}
                          className="mb-1! line-clamp-2 text-slate-950!"
                        >
                          {lesson.title}
                        </Typography.Title>
                        <Typography.Text type="secondary" className="block">
                          {lesson.topic}
                        </Typography.Text>
                        <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                          {lesson.wordCount} từ
                        </span>
                      </div>
                      <RightOutlined className="mt-2 text-slate-300 transition group-hover:text-sky-500" />
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        ) : (
          <Card className="border border-slate-200 shadow-sm">
            <Empty description="Không có bài học phù hợp." />
          </Card>
        )}
      </Space>
    </main>
  );
}
