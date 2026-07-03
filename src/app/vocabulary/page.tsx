"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { pinyin } from "pinyin-pro";
import { initialLessons, lessonsStorageKey, readStoredLessons, type Lesson } from "@/lib/vocab";

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, "");
}

const emptyAnswers: Record<number, string> = {};

type PracticeRow = Lesson["vocabItems"][number] & {
  answer: string;
  isBlank: boolean;
  isCorrect: boolean;
};

export default function VocabularyPage() {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState(initialLessons[0].id);
  const [answersByLesson, setAnswersByLesson] = useState<Record<number, Record<number, string>>>({
    1: {
      1: "我",
      2: "你",
      4: "也",
      5: "他",
    },
  });
  const [newLesson, setNewLesson] = useState({ title: "" });
  const [newWord, setNewWord] = useState({
    hanzi: "",
  });
  const [translation, setTranslation] = useState({
    hanzi: "",
    meaning: "",
    isLoading: false,
  });
  const [formError, setFormError] = useState("");
  const [lessonError, setLessonError] = useState("");
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0];
  const vocabItems = activeLesson.vocabItems;
  const answers = answersByLesson[activeLesson.id] ?? emptyAnswers;
  const generatedPinyin = useMemo(() => {
    const hanzi = normalizeAnswer(newWord.hanzi);

    if (!hanzi) return "";

    return pinyin(hanzi);
  }, [newWord.hanzi]);
  const normalizedNewHanzi = normalizeAnswer(newWord.hanzi);
  const generatedMeaning = translation.hanzi === normalizedNewHanzi ? translation.meaning : "";
  const isGeneratingMeaning = translation.hanzi === normalizedNewHanzi && translation.isLoading;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedLessons = readStoredLessons();
        setLessons(storedLessons);
        setActiveLessonId((currentId) => {
          if (storedLessons.some((lesson) => lesson.id === currentId)) return currentId;

          return storedLessons[0].id;
        });
      } catch {
        setLessons(initialLessons);
      } finally {
        setIsStorageReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;

    window.localStorage.setItem(lessonsStorageKey, JSON.stringify(lessons));
  }, [isStorageReady, lessons]);

  useEffect(() => {
    const hanzi = normalizeAnswer(newWord.hanzi);

    if (!hanzi) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setTranslation({ hanzi, meaning: "", isLoading: true });
      setFormError("");

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: hanzi }),
          signal: controller.signal,
        });
        const data = (await response.json()) as { meaning?: string; error?: string };

        if (!response.ok || !data.meaning) {
          throw new Error(data.error ?? "Không sinh được nghĩa.");
        }

        setTranslation({ hanzi, meaning: data.meaning, isLoading: false });
      } catch (error) {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : "Không sinh được nghĩa.";
        setTranslation({ hanzi, meaning: "", isLoading: false });
        setFormError(message);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [newWord.hanzi]);

  const rows = useMemo(
    () =>
      vocabItems.map((item) => {
        const answer = answers[item.id] ?? "";
        const isBlank = answer.trim().length === 0;
        const isCorrect = normalizeAnswer(answer) === normalizeAnswer(item.hanzi);

        return {
          ...item,
          answer,
          isBlank,
          isCorrect,
        };
      }),
    [answers, vocabItems],
  );

  const stats = useMemo(() => {
    const done = rows.filter((row) => !row.isBlank).length;
    const correct = rows.filter((row) => row.isCorrect).length;
    const wrong = rows.filter((row) => !row.isBlank && !row.isCorrect).length;

    return { done, correct, wrong, total: rows.length };
  }, [rows]);

  function updateAnswer(id: number, value: string) {
    setAnswersByLesson((current) => ({
      ...current,
      [activeLesson.id]: {
        ...(current[activeLesson.id] ?? {}),
        [id]: value,
      },
    }));
  }

  function selectLesson(lessonId: number) {
    setActiveLessonId(lessonId);
    setNewWord({ hanzi: "" });
    setTranslation({ hanzi: "", meaning: "", isLoading: false });
    setFormError("");
  }

  function addLesson() {
    const title = newLesson.title.trim();

    if (!title) {
      setLessonError("Nhập tên bài trước.");
      return;
    }

    const nextId = Math.max(0, ...lessons.map((lesson) => lesson.id)) + 1;
    const lessonTitle = title.toUpperCase().startsWith("BÀI") ? title : `BÀI ${nextId}: ${title}`;

    setLessons((current) => [
      ...current,
      {
        id: nextId,
        title: lessonTitle,
        topic: "Bài tự tạo",
        vocabItems: [],
      },
    ]);
    setAnswersByLesson((current) => ({ ...current, [nextId]: {} }));
    setActiveLessonId(nextId);
    setNewLesson({ title: "" });
    setNewWord({ hanzi: "" });
    setTranslation({ hanzi: "", meaning: "", isLoading: false });
    setLessonError("");
    setFormError("");
  }

  function addWord() {
    const hanzi = normalizeAnswer(newWord.hanzi);

    if (!hanzi) {
      setFormError("Nhập chữ Hán trước.");
      return;
    }

    if (isGeneratingMeaning) {
      setFormError("Đang sinh nghĩa, đợi một chút.");
      return;
    }

    if (!generatedPinyin || !generatedMeaning) {
      setFormError("Chưa sinh được pinyin hoặc nghĩa.");
      return;
    }

    if (vocabItems.some((item) => normalizeAnswer(item.hanzi) === hanzi)) {
      setFormError("Từ này đã có trong bảng.");
      return;
    }

    setLessons((current) =>
      current.map((lesson) => {
        if (lesson.id !== activeLesson.id) return lesson;

        return {
          ...lesson,
          vocabItems: [
            ...lesson.vocabItems,
            {
              id: Math.max(0, ...lesson.vocabItems.map((item) => item.id)) + 1,
              hanzi,
              pinyin: generatedPinyin,
              meaning: generatedMeaning,
            },
          ],
        };
      }),
    );
    setNewWord({ hanzi: "" });
    setTranslation({ hanzi: "", meaning: "", isLoading: false });
    setFormError("");
  }

  const columns: TableColumnsType<PracticeRow> = [
    {
      title: "STT",
      dataIndex: "id",
      width: 72,
      align: "center",
    },
    {
      title: "CHỮ HÁN",
      dataIndex: "hanzi",
      width: 140,
      align: "center",
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "PINYIN",
      dataIndex: "pinyin",
      width: 180,
      align: "center",
      render: (value: string) => (showPinyin ? value : "••••"),
    },
    {
      title: "NGHĨA",
      dataIndex: "meaning",
      width: 260,
      align: "center",
      render: (value: string) => (showMeaning ? value : "••••"),
    },
    {
      title: "LUYỆN TẬP",
      dataIndex: "answer",
      width: 190,
      align: "center",
      render: (_value: string, row) => (
        <Input
          value={row.answer}
          onChange={(event) => updateAnswer(row.id, event.target.value)}
          aria-label={`Luyện tập từ số ${row.id}`}
        />
      ),
    },
    {
      title: "CHECK",
      dataIndex: "isCorrect",
      width: 120,
      align: "center",
      render: (_value: boolean, row) => {
        if (row.isBlank) return <Tag color="default">EMPTY</Tag>;

        return row.isCorrect ? <Tag color="success">TRUE</Tag> : <Tag color="error">FALSE</Tag>;
      },
    },
  ];

  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card>
          <Row gutter={[16, 16]} align="top">
            <Col xs={24} lg={12}>
              <Select
                value={activeLesson.id}
                onChange={selectLesson}
                options={lessons.map((lesson) => ({
                  value: lesson.id,
                  label: `${lesson.title} (${lesson.vocabItems.length} từ)`,
                }))}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Form onFinish={addLesson} layout="inline">
                <Form.Item
                  validateStatus={lessonError ? "error" : undefined}
                  help={lessonError || undefined}
                  style={{ flex: 1 }}
                >
                  <Input
                    value={newLesson.title}
                    onChange={(event) => {
                      setNewLesson({ title: event.target.value });
                      setLessonError("");
                    }}
                    placeholder="Tên bài mới"
                  />
                </Form.Item>
                <Form.Item>
                  <Button htmlType="submit">Tạo bài</Button>
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </Card>

        <Card>
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Typography.Text type="secondary">{activeLesson.topic}</Typography.Text>
              <Typography.Title level={1}>{activeLesson.title}</Typography.Title>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic title="Tổng" value={stats.total} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Đã làm" value={stats.done} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Đúng" value={stats.correct} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Sai" value={stats.wrong} />
              </Col>
            </Row>
          </Space>
        </Card>

        <Table<PracticeRow>
          bordered
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="id"
          scroll={{ x: 960 }}
          size="middle"
          title={() => (
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              <Typography.Title level={3}>{activeLesson.title}</Typography.Title>
              <Space wrap>
                <Button onClick={() => setShowPinyin((value) => !value)}>
                  {showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
                </Button>
                <Button onClick={() => setShowMeaning((value) => !value)}>
                  {showMeaning ? "Ẩn nghĩa" : "Hiện nghĩa"}
                </Button>
              </Space>
            </Space>
          )}
          locale={{ emptyText: "Bài này chưa có từ vựng." }}
        />

        <Card>
          <Form onFinish={addWord} layout="vertical">
            <Row gutter={[16, 0]} align="bottom">
              <Col xs={24} lg={6}>
                <Form.Item label="Chữ Hán">
                  <Input
                    value={newWord.hanzi}
                    onChange={(event) => {
                      setNewWord((current) => ({ ...current, hanzi: event.target.value }));
                      setFormError("");
                    }}
                    placeholder="你好"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={6}>
                <Form.Item label="Pinyin tự sinh">
                  <Input readOnly value={generatedPinyin || "-"} />
                </Form.Item>
              </Col>
              <Col xs={24} lg={8}>
                <Form.Item label="Nghĩa tự sinh">
                  <Input readOnly value={isGeneratingMeaning ? "Đang dịch..." : generatedMeaning || "-"} />
                </Form.Item>
              </Col>
              <Col xs={24} lg={4}>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Thêm từ
                  </Button>
                </Form.Item>
              </Col>
            </Row>
            {formError ? <Alert type="error" message={formError} showIcon /> : null}
          </Form>
        </Card>
      </Space>
    </main>
  );
}
