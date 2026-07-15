"use client";

import {
  CheckOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseOutlined,
  CloseCircleFilled,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  LikeOutlined,
  DislikeOutlined,
  MinusCircleFilled,
  SearchOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Typography,
  type InputRef,
  type TableColumnsType,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { pinyin } from "pinyin-pro";
import {
  createVocabItemAction,
  deleteLessonAction,
  deleteVocabItemAction,
  reorderVocabItemsAction,
  saveReviewAnswerAction,
  updateLessonTitleAction,
  updateVocabItemAction,
} from "./actions";
import type { AnswersByLesson, Lesson } from "./types";

function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function reorderById<T extends { id: string }>(
  items: T[],
  sourceId: string,
  targetId: string,
) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);

  nextItems.splice(targetIndex, 0, movedItem);

  return nextItems;
}

const emptyAnswers: Record<string, string> = {};
const emptyVocabItems: Lesson["vocabItems"] = [];
const FOCUS_NEW_WORD_HANZI_KEY = "vocab-web:focus-new-word-hanzi";
const NEW_WORD_HANZI_INPUT_ID = "new-word-hanzi-input";

type PracticeRow = Lesson["vocabItems"][number] & {
  answer: string;
  isBlank: boolean;
  isCorrect: boolean;
  rowNumber: number;
};

type EditableVocabItem = Lesson["vocabItems"][number];

type VocabularyClientProps = {
  initialLessons: Lesson[];
  initialAnswersByLesson: AnswersByLesson;
  initialActiveLessonId?: string;
  initialFocusedVocabItemId?: string;
};

function resolveInitialLessonId(lessons: Lesson[], lessonId?: string) {
  if (lessonId && lessons.some((lesson) => lesson.id === lessonId))
    return lessonId;

  return lessons[0]?.id ?? "";
}

export default function VocabularyClient({
  initialLessons,
  initialAnswersByLesson,
  initialActiveLessonId,
  initialFocusedVocabItemId,
}: VocabularyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newWordHanziInputRef = useRef<InputRef>(null);
  const meaningBeforeEditRef = useRef<Record<string, string>>({});
  const savingMeaningVocabItemIdRef = useRef("");
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [activeLessonId, setActiveLessonId] = useState(
    resolveInitialLessonId(initialLessons, initialActiveLessonId),
  );
  const [answersByLesson, setAnswersByLesson] = useState<AnswersByLesson>(
    initialAnswersByLesson,
  );
  const [editingLessonTitle, setEditingLessonTitle] = useState("");
  const [newWord, setNewWord] = useState({
    hanzi: "",
    meaning: "",
    example: "",
  });
  const [formError, setFormError] = useState("");
  const [editLessonError, setEditLessonError] = useState("");
  const [practiceError, setPracticeError] = useState("");
  const [isEditingLessonTitle, setIsEditingLessonTitle] = useState(false);
  const [isSavingLessonTitle, setIsSavingLessonTitle] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [editingVocabItem, setEditingVocabItem] =
    useState<EditableVocabItem | null>(null);
  const [editWord, setEditWord] = useState({
    hanzi: "",
    pinyin: "",
    meaning: "",
    example: "",
  });
  const [editWordError, setEditWordError] = useState("");
  const [isSavingWord, setIsSavingWord] = useState(false);
  const [deletingVocabItemId, setDeletingVocabItemId] = useState("");
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [vocabularySearch, setVocabularySearch] = useState("");
  const [draggedVocabItemId, setDraggedVocabItemId] = useState("");
  const [dragOverVocabItemId, setDragOverVocabItemId] = useState("");
  const [isReorderingVocabItems, setIsReorderingVocabItems] = useState(false);
  const [savingMeaningVocabItemId, setSavingMeaningVocabItemId] = useState("");
  const requestedLessonId = searchParams.get("lessonId") ?? initialActiveLessonId;
  const focusedVocabItemId =
    searchParams.get("vocabItemId") ?? initialFocusedVocabItemId;
  const activeLesson =
    lessons.find((lesson) => lesson.id === requestedLessonId) ??
    lessons.find((lesson) => lesson.id === activeLessonId) ??
    lessons[0];
  const resolvedActiveLessonId = activeLesson?.id ?? "";
  const activeLessonIndex = activeLesson
    ? lessons.findIndex((lesson) => lesson.id === activeLesson.id)
    : -1;
  const vocabItems = activeLesson?.vocabItems ?? emptyVocabItems;
  const answers = activeLesson
    ? (answersByLesson[activeLesson.id] ?? emptyAnswers)
    : emptyAnswers;
  const generatedPinyin = useMemo(() => {
    const hanzi = normalizeAnswer(newWord.hanzi);

    if (!hanzi) return "";

    return pinyin(hanzi);
  }, [newWord.hanzi]);
  const finalNewMeaning = newWord.meaning.trim();

  useEffect(() => {
    if (!focusedVocabItemId) return;

    const frameId = window.requestAnimationFrame(() => {
      const escapedId = window.CSS.escape(focusedVocabItemId);
      const row = document.querySelector(`[data-row-key="${escapedId}"]`);

      row?.scrollIntoView({ block: "center", behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [focusedVocabItemId, resolvedActiveLessonId]);

  useEffect(() => {
    if (
      window.sessionStorage.getItem(FOCUS_NEW_WORD_HANZI_KEY) !== "true"
    ) {
      return;
    }

    let timeoutId: number | undefined;
    let attempts = 0;

    const focusUntilActive = () => {
      attempts += 1;

      newWordHanziInputRef.current?.focus();

      const inputElement = document.getElementById(
        NEW_WORD_HANZI_INPUT_ID,
      ) as HTMLInputElement | null;

      inputElement?.focus();

      if (attempts >= 20) {
        window.sessionStorage.removeItem(FOCUS_NEW_WORD_HANZI_KEY);
        return;
      }

      timeoutId = window.setTimeout(focusUntilActive, 100);
    };

    const frameId = window.requestAnimationFrame(focusUntilActive);

    return () => {
      window.cancelAnimationFrame(frameId);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [newWord.hanzi, resolvedActiveLessonId, vocabItems.length]);

  const rows = useMemo(
    () =>
      vocabItems.map((item, index) => {
        const answer = answers[item.id] ?? "";
        const isBlank = answer.trim().length === 0;
        const isCorrect =
          normalizeAnswer(answer) === normalizeAnswer(item.hanzi);

        return {
          ...item,
          answer,
          isBlank,
          isCorrect,
          rowNumber: index + 1,
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

  const filteredRows = useMemo(() => {
    const keyword = vocabularySearch.trim().toLowerCase();

    if (!keyword) return rows;

    return rows.filter((row) =>
      [row.hanzi, row.pinyin, row.meaning, row.example, row.answer].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [rows, vocabularySearch]);
  const canReorderVocabItems =
    !vocabularySearch.trim() && !isReorderingVocabItems && rows.length > 1;

  async function reorderVocabItems(sourceId: string, targetId: string) {
    if (
      !activeLesson ||
      sourceId === targetId ||
      isReorderingVocabItems ||
      vocabularySearch.trim()
    ) {
      return;
    }

    const nextVocabItems = reorderById(
      activeLesson.vocabItems,
      sourceId,
      targetId,
    );

    if (nextVocabItems === activeLesson.vocabItems) return;

    const reorderedVocabItems = nextVocabItems.map((item, index) => ({
      ...item,
      position: index + 1,
    }));

    const previousLessons = lessons;

    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === activeLesson.id
          ? { ...lesson, vocabItems: reorderedVocabItems }
          : lesson,
      ),
    );
    setIsReorderingVocabItems(true);
    setPracticeError("");

    const result = await reorderVocabItemsAction({
      lessonId: activeLesson.id,
      vocabItemIds: reorderedVocabItems.map((item) => item.id),
    });

    setIsReorderingVocabItems(false);

    if (!result.ok) {
      setLessons(previousLessons);
      setPracticeError(result.error);
      return;
    }

    router.refresh();
  }

  function updateAnswer(id: string, value: string) {
    if (!activeLesson) return;

    setAnswersByLesson((current) => ({
      ...current,
      [activeLesson.id]: {
        ...(current[activeLesson.id] ?? {}),
        [id]: value,
      },
    }));
  }

  async function saveAnswer(row: PracticeRow) {
    const result = await saveReviewAnswerAction({
      vocabItemId: row.id,
      answer: row.answer,
    });

    if (!result.ok) {
      setPracticeError(result.error);
      return;
    }

    setPracticeError("");
  }

  function updateMeaning(id: string, value: string) {
    if (!activeLesson) return;

    setLessons((current) =>
      current.map((lesson) => {
        if (lesson.id !== activeLesson.id) return lesson;

        return {
          ...lesson,
          vocabItems: lesson.vocabItems.map((item) =>
            item.id === id ? { ...item, meaning: value } : item,
          ),
        };
      }),
    );
  }

  async function saveMeaning(row: PracticeRow) {
    if (
      savingMeaningVocabItemIdRef.current ||
      meaningBeforeEditRef.current[row.id] === row.meaning
    ) {
      return;
    }

    savingMeaningVocabItemIdRef.current = row.id;
    setSavingMeaningVocabItemId(row.id);
    setPracticeError("");

    const result = await updateVocabItemAction({
      vocabItemId: row.id,
      hanzi: row.hanzi,
      pinyin: row.pinyin,
      meaning: row.meaning,
      example: row.example,
    });

    savingMeaningVocabItemIdRef.current = "";
    setSavingMeaningVocabItemId("");

    if (!result.ok) {
      setPracticeError(result.error);
      return;
    }

    setLessons((current) =>
      current.map((lesson) => {
        if (lesson.id !== activeLesson?.id) return lesson;

        return {
          ...lesson,
          vocabItems: lesson.vocabItems.map((item) =>
            item.id === result.data.id ? result.data : item,
          ),
        };
      }),
    );
    meaningBeforeEditRef.current[row.id] = result.data.meaning;
    setPracticeError("");
    router.refresh();
  }

  function playAudio(text: string) {
    if (!("speechSynthesis" in window)) {
      setPracticeError("Trình duyệt không hỗ trợ phát âm tự động.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;

    window.speechSynthesis.speak(utterance);
    setPracticeError("");
  }

  function startEditingLessonTitle() {
    if (!activeLesson) return;

    setEditingLessonTitle(activeLesson.title);
    setEditLessonError("");
    setIsEditingLessonTitle(true);
  }

  function cancelEditingLessonTitle() {
    setIsEditingLessonTitle(false);
    setEditingLessonTitle("");
    setEditLessonError("");
  }

  async function saveLessonTitle() {
    if (!activeLesson || isSavingLessonTitle) return;

    const title = editingLessonTitle.trim();

    if (!title) {
      setEditLessonError("Nhập tên bài trước.");
      return;
    }

    setIsSavingLessonTitle(true);
    setEditLessonError("");

    const result = await updateLessonTitleAction({
      lessonId: activeLesson.id,
      title,
    });

    setIsSavingLessonTitle(false);

    if (!result.ok) {
      setEditLessonError(result.error);
      return;
    }

    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === result.data.id
          ? { ...lesson, title: result.data.title }
          : lesson,
      ),
    );
    setIsEditingLessonTitle(false);
    setEditingLessonTitle("");
    router.refresh();
  }

  async function deleteActiveLesson() {
    if (!activeLesson || isDeletingLesson) return;

    setIsDeletingLesson(true);
    setEditLessonError("");

    const deletedLessonId = activeLesson.id;
    const deletedLessonIndex = activeLessonIndex;
    const result = await deleteLessonAction(deletedLessonId);

    setIsDeletingLesson(false);

    if (!result.ok) {
      setEditLessonError(result.error);
      return;
    }

    const nextLessons = lessons.filter(
      (lesson) => lesson.id !== result.data.id,
    );
    const nextActiveLesson =
      nextLessons[Math.min(deletedLessonIndex, nextLessons.length - 1)];

    setLessons(nextLessons);
    setActiveLessonId(nextActiveLesson?.id ?? "");
    if (nextActiveLesson) {
      window.history.replaceState(
        null,
        "",
        `/vocabulary?lessonId=${encodeURIComponent(nextActiveLesson.id)}`,
      );
    }
    setAnswersByLesson((current) => {
      const rest = { ...current };

      delete rest[result.data.id];

      return rest;
    });
    setIsEditingLessonTitle(false);
    setEditingLessonTitle("");
    setNewWord({ hanzi: "", meaning: "", example: "" });
    setFormError("");
    setPracticeError("");
    router.refresh();
  }

  async function addWord() {
    if (!activeLesson || isAddingWord) return;

    const hanzi = normalizeAnswer(newWord.hanzi);

    if (!hanzi) {
      setFormError("Nhập chữ Hán trước.");
      return;
    }

    if (!generatedPinyin) {
      setFormError("Chưa sinh được pinyin.");
      return;
    }

    if (vocabItems.some((item) => normalizeAnswer(item.hanzi) === hanzi)) {
      setFormError("Từ này đã có trong bảng.");
      return;
    }

    setIsAddingWord(true);
    setFormError("");

    const result = await createVocabItemAction({
      lessonId: activeLesson.id,
      hanzi,
      pinyin: generatedPinyin,
      meaning: finalNewMeaning,
      example: newWord.example.trim(),
      position: vocabItems.length + 1,
    });

    setIsAddingWord(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setLessons((current) =>
      current.map((lesson) => {
        if (lesson.id !== activeLesson.id) return lesson;

        return {
          ...lesson,
          vocabItems: [...lesson.vocabItems, result.data],
        };
      }),
    );
    setNewWord({ hanzi: "", meaning: "", example: "" });
    setFormError("");
    window.sessionStorage.setItem(FOCUS_NEW_WORD_HANZI_KEY, "true");
    router.refresh();
  }

  function startEditingWord(item: EditableVocabItem) {
    setEditingVocabItem(item);
    setEditWord({
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaning: item.meaning,
      example: item.example,
    });
    setEditWordError("");
  }

  function closeEditWordModal() {
    if (isSavingWord) return;

    setEditingVocabItem(null);
    setEditWord({ hanzi: "", pinyin: "", meaning: "", example: "" });
    setEditWordError("");
  }

  async function saveEditedWord() {
    if (!editingVocabItem || isSavingWord) return;

    const hanzi = normalizeAnswer(editWord.hanzi);
    const pinyinValue = editWord.pinyin.trim();
    const meaning = editWord.meaning.trim();
    const example = editWord.example.trim();

    if (!hanzi || !pinyinValue) {
      setEditWordError("Nhập đủ chữ Hán và pinyin.");
      return;
    }

    const duplicatedWord = vocabItems.some(
      (item) =>
        item.id !== editingVocabItem.id &&
        normalizeAnswer(item.hanzi) === hanzi,
    );

    if (duplicatedWord) {
      setEditWordError("Từ này đã có trong bảng.");
      return;
    }

    setIsSavingWord(true);
    setEditWordError("");

    const result = await updateVocabItemAction({
      vocabItemId: editingVocabItem.id,
      hanzi,
      pinyin: pinyinValue,
      meaning,
      example,
    });

    setIsSavingWord(false);

    if (!result.ok) {
      setEditWordError(result.error);
      return;
    }

    setLessons((current) =>
      current.map((lesson) => {
        if (lesson.id !== activeLesson?.id) return lesson;

        return {
          ...lesson,
          vocabItems: lesson.vocabItems.map((item) =>
            item.id === result.data.id ? result.data : item,
          ),
        };
      }),
    );
    setEditingVocabItem(null);
    setEditWord({ hanzi: "", pinyin: "", meaning: "", example: "" });
    router.refresh();
  }

  async function deleteWord(item: EditableVocabItem) {
    if (deletingVocabItemId) return;

    setDeletingVocabItemId(item.id);
    setPracticeError("");

    const result = await deleteVocabItemAction(item.id);

    setDeletingVocabItemId("");

    if (!result.ok) {
      setPracticeError(result.error);
      return;
    }

    setLessons((current) =>
      current.map((lesson) => {
        if (lesson.id !== activeLesson?.id) return lesson;

        return {
          ...lesson,
          vocabItems: lesson.vocabItems.filter(
            (vocabItem) => vocabItem.id !== result.data.id,
          ),
        };
      }),
    );
    setAnswersByLesson((current) => {
      if (!activeLesson) return current;

      const nextAnswers = { ...(current[activeLesson.id] ?? {}) };

      delete nextAnswers[result.data.id];

      return { ...current, [activeLesson.id]: nextAnswers };
    });
    router.refresh();
  }

  const columns: TableColumnsType<PracticeRow> = [
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
          <Typography.Text strong>{value}</Typography.Text>
          </span>
          <Button
            className="grid! size-8! place-items-center! rounded-full! border-sky-100! bg-sky-50! text-sky-600! shadow-sm transition! hover:border-sky-200! hover:bg-sky-100! hover:text-sky-700!"
            icon={<SoundOutlined />}
            onClick={() => playAudio(row.hanzi)}
            aria-label={`Nghe phát âm từ số ${row.rowNumber}`}
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
      render: (value: string) =>
        showPinyin ? (
          <Typography.Text className="block whitespace-normal break-words leading-6">
            {value}
          </Typography.Text>
        ) : (
          "••••"
        ),
    },
    {
      title: "NGHĨA",
      dataIndex: "meaning",
      width: 180,
      align: "center",
      render: (_value: string, row) =>
        showMeaning ? (
          <Input
            aria-label={`Nghĩa của từ số ${row.rowNumber}`}
            disabled={savingMeaningVocabItemId === row.id}
            onBlur={() => saveMeaning(row)}
            onChange={(event) => updateMeaning(row.id, event.target.value)}
            onFocus={() => {
              meaningBeforeEditRef.current[row.id] = row.meaning;
            }}
            onPressEnter={() => saveMeaning(row)}
            placeholder="Nhập nghĩa"
            value={row.meaning}
          />
        ) : (
          "••••"
        ),
    },
    {
      title: "VÍ DỤ",
      dataIndex: "example",
      width: 260,
      render: (value: string) => value || "-",
    },
    {
      title: "LUYỆN TẬP",
      dataIndex: "answer",
      width: 220,
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
              value={row.answer}
              onChange={(event) => updateAnswer(row.id, event.target.value)}
              onBlur={() => saveAnswer(row)}
              onPressEnter={() => saveAnswer(row)}
              aria-label={`Luyện tập từ số ${row.rowNumber}`}
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
    {
      title: "THAO TÁC",
      key: "actions",
      width: 112,
      align: "center",
      fixed: "right",
      render: (_value, row) => (
        <Space>
          <Button
            aria-label={`Sửa từ ${row.hanzi}`}
            icon={<EditOutlined />}
            onClick={() => startEditingWord(row)}
          />
          <Popconfirm
            cancelText="Hủy"
            description="Đáp án luyện tập của từ này cũng sẽ bị xóa."
            okButtonProps={{
              danger: true,
              loading: deletingVocabItemId === row.id,
            }}
            okText="Xóa"
            onConfirm={() => deleteWord(row)}
            title="Xóa từ vựng này?"
          >
            <Button
              aria-label={`Xóa từ ${row.hanzi}`}
              danger
              icon={<DeleteOutlined />}
              loading={deletingVocabItemId === row.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        {activeLesson ? (
          <>
            <Card
              className="border border-slate-200 shadow-sm"
              styles={{ body: { padding: 16 } }}
            >
              <Space
                orientation="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div>
                  {isEditingLessonTitle ? (
                    <Space.Compact className="mt-2 w-full max-w-xl">
                      <Input
                        value={editingLessonTitle}
                        onChange={(event) => {
                          setEditingLessonTitle(event.target.value);
                          setEditLessonError("");
                        }}
                        onPressEnter={saveLessonTitle}
                        status={editLessonError ? "error" : undefined}
                        aria-label="Tên bài học"
                      />
                      <Button
                        icon={<CheckOutlined />}
                        loading={isSavingLessonTitle}
                        onClick={saveLessonTitle}
                        aria-label="Lưu tên bài"
                      />
                      <Button
                        icon={<CloseOutlined />}
                        onClick={cancelEditingLessonTitle}
                        aria-label="Hủy sửa tên bài"
                      />
                    </Space.Compact>
                  ) : (
                    <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Typography.Title level={3} className="mb-0!">
                        {activeLesson.title}
                      </Typography.Title>
                      <Space wrap>
                        <Button
                          icon={<EditOutlined />}
                          onClick={startEditingLessonTitle}
                          aria-label="Sửa tên bài"
                        >
                          Chỉnh sửa
                        </Button>
                        <Popconfirm
                          title="Xóa bài học này?"
                          description="Toàn bộ từ vựng và tiến độ luyện tập trong bài này sẽ mất."
                          okText="Xóa bài"
                          cancelText="Hủy"
                          okButtonProps={{
                            danger: true,
                            loading: isDeletingLesson,
                          }}
                          onConfirm={deleteActiveLesson}
                        >
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={isDeletingLesson}
                            aria-label="Xóa bài"
                          >
                            Xóa bài
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  )}
                  {editLessonError ? (
                    <Typography.Text type="danger" className="mt-1 block">
                      {editLessonError}
                    </Typography.Text>
                  ) : null}
                </div>
              </Space>
            </Card>

            <Row gutter={[16, 16]}>
              {[
                {
                  label: "Tổng từ",
                  value: stats.total,
                  icon: <FolderOpenOutlined />,
                  iconClassName: "bg-blue-100 text-blue-600",
                },
                {
                  label: "Đã luyện",
                  value: stats.done,
                  icon: <CheckCircleOutlined />,
                  iconClassName: "bg-emerald-100 text-emerald-600",
                },
                {
                  label: "Đúng",
                  value: stats.correct,
                  icon: <LikeOutlined />,
                  iconClassName: "bg-cyan-100 text-cyan-600",
                },
                {
                  label: "Sai",
                  value: stats.wrong,
                  icon: <DislikeOutlined />,
                  iconClassName: "bg-rose-100 text-rose-600",
                },
              ].map((item) => (
                <Col key={item.label} xs={24} sm={12} xl={6}>
                  <Card
                    className="border border-slate-200 shadow-sm"
                    styles={{ body: { padding: 16 } }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${item.iconClassName}`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-2xl font-semibold leading-7 text-slate-950">
                          {item.value}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {item.label}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <Table<PracticeRow>
              bordered
              className="vocabulary-table"
              columns={columns}
              dataSource={filteredRows}
              pagination={false}
              rowKey="id"
              rowClassName={(row) =>
                [
                  row.id === focusedVocabItemId ? "bg-emerald-50" : "",
                  row.id === dragOverVocabItemId
                    ? "outline outline-2 outline-sky-300"
                    : "",
                  canReorderVocabItems ? "cursor-grab" : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              onRow={(row) => ({
                draggable: canReorderVocabItems,
                onDragStart: (event) => {
                  if (!canReorderVocabItems) return;

                  setDraggedVocabItemId(row.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", row.id);
                },
                onDragOver: (event) => {
                  if (!canReorderVocabItems || !draggedVocabItemId) return;

                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverVocabItemId(row.id);
                },
                onDragLeave: () => {
                  setDragOverVocabItemId((current) =>
                    current === row.id ? "" : current,
                  );
                },
                onDrop: async (event) => {
                  event.preventDefault();

                  const sourceId =
                    draggedVocabItemId ||
                    event.dataTransfer.getData("text/plain");

                  setDraggedVocabItemId("");
                  setDragOverVocabItemId("");
                  await reorderVocabItems(sourceId, row.id);
                },
                onDragEnd: () => {
                  setDraggedVocabItemId("");
                  setDragOverVocabItemId("");
                },
              })}
              scroll={{ x: 1116 }}
              size="small"
              styles={{ header: { cell: { backgroundColor: "#F3F3F3" } } }}
              title={() => (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <Input
                      allowClear
                      aria-label="Tìm kiếm từ vựng"
                      className="w-full lg:max-w-md"
                      onChange={(event) =>
                        setVocabularySearch(event.target.value)
                      }
                      placeholder="Tìm chữ Hán, pinyin, nghĩa, ví dụ, đáp án"
                      prefix={<SearchOutlined />}
                      value={vocabularySearch}
                    />
                    <Space wrap>
                      <Button
                        icon={
                          showPinyin ? (
                            <EyeInvisibleOutlined />
                          ) : (
                            <EyeOutlined />
                          )
                        }
                        onClick={() => setShowPinyin((value) => !value)}
                      >
                        {showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
                      </Button>
                      <Button
                        icon={
                          showMeaning ? (
                            <EyeInvisibleOutlined />
                          ) : (
                            <EyeOutlined />
                          )
                        }
                        onClick={() => setShowMeaning((value) => !value)}
                      >
                        {showMeaning ? "Ẩn nghĩa" : "Hiện nghĩa"}
                      </Button>
                    </Space>
                  </div>
                  {practiceError ? (
                    <Alert type="error" title={practiceError} showIcon />
                  ) : null}
                  {vocabularySearch.trim() && rows.length > 1 ? (
                    <Alert
                      type="info"
                      title="Xóa tìm kiếm để kéo thả sắp xếp toàn bộ từ trong bài."
                      showIcon
                    />
                  ) : null}
                </div>
              )}
              locale={{
                emptyText: vocabularySearch.trim()
                  ? "Không tìm thấy từ phù hợp."
                  : "Bài này chưa có từ vựng.",
              }}
            />

            <Card className="border border-slate-200 shadow-sm">
              <Form onFinish={addWord} layout="vertical">
                <Row gutter={[16, 0]} align="bottom">
                  <Col xs={24} lg={6}>
                    <Form.Item label="Chữ Hán">
                      <Input
                        id={NEW_WORD_HANZI_INPUT_ID}
                        ref={newWordHanziInputRef}
                        value={newWord.hanzi}
                        onChange={(event) => {
                          setNewWord((current) => ({
                            ...current,
                            hanzi: event.target.value,
                          }));
                          setFormError("");
                        }}
                        placeholder="你好"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={6}>
                    <Form.Item label="Pinyin tự sinh">
                      <div
                        aria-live="polite"
                        className="min-h-8 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 leading-6 text-slate-700 whitespace-normal break-words"
                      >
                        {generatedPinyin || "-"}
                      </div>
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={6}>
                    <Form.Item label="Nghĩa">
                      <Input
                        onChange={(event) => {
                          setNewWord((current) => ({
                            ...current,
                            meaning: event.target.value,
                          }));
                          setFormError("");
                        }}
                        placeholder="Nhập nghĩa tiếng Việt"
                        value={newWord.meaning}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={6}>
                    <Form.Item label="Ví dụ">
                      <Input
                        onChange={(event) => {
                          setNewWord((current) => ({
                            ...current,
                            example: event.target.value,
                          }));
                          setFormError("");
                        }}
                        placeholder="Ví dụ tự nhập"
                        value={newWord.example}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={4}>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isAddingWord}
                      >
                        Thêm từ
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
                {formError ? (
                  <Alert type="error" title={formError} showIcon />
                ) : null}
              </Form>
            </Card>
          </>
        ) : (
          <>
            <Card className="border border-slate-200 shadow-sm">
              <Empty description="Chưa có bài học. Tạo bài đầu tiên để thêm từ vựng." />
            </Card>
          </>
        )}
      </Space>
      <Modal
        confirmLoading={isSavingWord}
        okText="Lưu"
        onCancel={closeEditWordModal}
        onOk={saveEditedWord}
        open={Boolean(editingVocabItem)}
        title="Chỉnh sửa từ vựng"
      >
        <Form layout="vertical">
          <Form.Item
            label="Chữ Hán"
            validateStatus={editWordError ? "error" : undefined}
          >
            <Input
              autoFocus
              onChange={(event) => {
                setEditWord((current) => ({
                  ...current,
                  hanzi: event.target.value,
                }));
                setEditWordError("");
              }}
              onPressEnter={saveEditedWord}
              value={editWord.hanzi}
            />
          </Form.Item>
          <Form.Item
            label="Pinyin"
            validateStatus={editWordError ? "error" : undefined}
          >
            <Input
              onChange={(event) => {
                setEditWord((current) => ({
                  ...current,
                  pinyin: event.target.value,
                }));
                setEditWordError("");
              }}
              onPressEnter={saveEditedWord}
              value={editWord.pinyin}
            />
          </Form.Item>
          <Form.Item
            label="Ví dụ"
            validateStatus={editWordError ? "error" : undefined}
            help={editWordError || undefined}
          >
            <Input
              onChange={(event) => {
                setEditWord((current) => ({
                  ...current,
                  example: event.target.value,
                }));
                setEditWordError("");
              }}
              onPressEnter={saveEditedWord}
              value={editWord.example}
            />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
}
