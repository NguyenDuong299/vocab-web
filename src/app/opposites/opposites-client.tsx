"use client";

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pinyin } from "pinyin-pro";
import {
  createOppositePairAction,
  deleteOppositePairAction,
  updateOppositePairAction,
} from "./actions";
import type { OppositePair } from "./types";

type OppositesClientProps = {
  initialOppositePairs: OppositePair[];
};

type PairDraft = {
  leftText: string;
  rightText: string;
  leftMeaning: string;
  rightMeaning: string;
};

type EditPairDraft = PairDraft & {
  leftPinyin: string;
  rightPinyin: string;
};

type OppositePairRow = OppositePair & {
  rowNumber: number;
};

type QuizQuestion = {
  pairId: string;
  prompt: string;
  answer: string;
  leftText: string;
  rightText: string;
  leftMeaning: string;
  rightMeaning: string;
  options: string[];
};

const pairSeparator = " ↔ ";
const legacyPairSeparator = " >< ";

function normalizeTerm(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function formatPair(leftText: string, rightText: string) {
  if (!leftText && !rightText) return "";
  if (!rightText) return leftText;

  return `${leftText}${pairSeparator}${rightText}`;
}

function formatMeaning(leftMeaning: string, rightMeaning: string) {
  if (!leftMeaning && !rightMeaning) return "";
  if (!rightMeaning) return leftMeaning;

  return `${leftMeaning}${pairSeparator}${rightMeaning}`;
}

function splitMeaning(meaning: string) {
  const separator = meaning.includes(pairSeparator)
    ? pairSeparator
    : legacyPairSeparator;
  const parts = meaning.split(separator);

  return {
    leftMeaning: parts[0]?.trim() ?? "",
    rightMeaning: parts.slice(1).join(separator).trim(),
  };
}

function splitFormattedValue(value: string) {
  const separator = value.includes(pairSeparator)
    ? pairSeparator
    : legacyPairSeparator;
  const parts = value.split(separator);

  return {
    leftValue: parts[0]?.trim() ?? "",
    rightValue: parts.slice(1).join(separator).trim(),
  };
}

function splitPinyin(pinyinValue: string) {
  return splitFormattedValue(pinyinValue);
}

function generateTermPinyin(text: string) {
  const cleanText = normalizeTerm(text);

  if (!cleanText) return "";

  return pinyin(cleanText);
}

function shuffleValues<T>(values: T[]) {
  const nextValues = [...values];

  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    [nextValues[index], nextValues[targetIndex]] = [
      nextValues[targetIndex],
      nextValues[index],
    ];
  }

  return nextValues;
}

function createQuizQuestion(pairs: OppositePair[]): QuizQuestion | null {
  if (pairs.length === 0) return null;

  const sourcePair = pairs[Math.floor(Math.random() * pairs.length)];
  const meaning = splitMeaning(sourcePair.meaning);
  const asksLeftSide = Math.random() < 0.5;
  const prompt = asksLeftSide ? sourcePair.leftText : sourcePair.rightText;
  const answer = asksLeftSide ? sourcePair.rightText : sourcePair.leftText;
  const distractors = pairs
    .flatMap((pair) => [pair.leftText, pair.rightText])
    .filter((value) => value && value !== prompt && value !== answer);
  const uniqueDistractors = Array.from(new Set(shuffleValues(distractors)));
  const options = shuffleValues([answer, ...uniqueDistractors.slice(0, 3)]);

  return {
    pairId: sourcePair.id,
    prompt,
    answer,
    leftText: sourcePair.leftText,
    rightText: sourcePair.rightText,
    leftMeaning: meaning.leftMeaning,
    rightMeaning: meaning.rightMeaning,
    options,
  };
}

function OppositeValue({
  leftValue,
  rightValue,
  size = "default",
}: {
  leftValue: string;
  rightValue: string;
  size?: "default" | "large";
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 text-slate-800">
      <span
        className={`min-w-0 truncate ${
          size === "large" ? "text-2xl" : "text-base"
        }`}
      >
        {leftValue || "-"}
      </span>
      <span
        aria-label="trái nghĩa với"
        className="grid size-6 shrink-0 place-items-center rounded-full bg-sky-50 text-xs text-sky-600 ring-1 ring-sky-200"
        title="Trái nghĩa với"
      >
        <SwapOutlined />
      </span>
      <span
        className={`min-w-0 truncate ${
          size === "large" ? "text-2xl" : "text-base"
        }`}
      >
        {rightValue || "-"}
      </span>
    </span>
  );
}

export default function OppositesClient({
  initialOppositePairs,
}: OppositesClientProps) {
  const router = useRouter();
  const [oppositePairs, setOppositePairs] = useState(initialOppositePairs);
  const [newPair, setNewPair] = useState<PairDraft>({
    leftText: "",
    rightText: "",
    leftMeaning: "",
    rightMeaning: "",
  });
  const [editingPair, setEditingPair] = useState<OppositePair | null>(null);
  const [editPair, setEditPair] = useState<EditPairDraft>({
    leftText: "",
    rightText: "",
    leftPinyin: "",
    rightPinyin: "",
    leftMeaning: "",
    rightMeaning: "",
  });
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(() =>
    createQuizQuestion(initialOppositePairs),
  );
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState("");
  const [quizStats, setQuizStats] = useState({ correct: 0, total: 0 });
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingPairId, setDeletingPairId] = useState("");
  const newLeftPinyin = useMemo(
    () => generateTermPinyin(newPair.leftText),
    [newPair.leftText],
  );
  const newRightPinyin = useMemo(
    () => generateTermPinyin(newPair.rightText),
    [newPair.rightText],
  );
  const newPairPinyin = formatPair(newLeftPinyin, newRightPinyin);
  const rows = useMemo<OppositePairRow[]>(
    () =>
      oppositePairs.map((pair, index) => ({
        ...pair,
        rowNumber: index + 1,
      })),
    [oppositePairs],
  );
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return rows;

    return rows.filter((row) =>
      [
        row.leftText,
        row.rightText,
        formatPair(row.leftText, row.rightText),
        row.pinyin,
        row.meaning,
      ].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [rows, search]);
  const selectedQuizIsCorrect =
    Boolean(selectedQuizAnswer && quizQuestion) &&
    selectedQuizAnswer === quizQuestion?.answer;

  function startNextQuizQuestion(nextPairs = oppositePairs) {
    setQuizQuestion(createQuizQuestion(nextPairs));
    setSelectedQuizAnswer("");
  }

  function chooseQuizAnswer(answer: string) {
    if (!quizQuestion || selectedQuizAnswer) return;

    setSelectedQuizAnswer(answer);
    setQuizStats((current) => ({
      correct: current.correct + (answer === quizQuestion.answer ? 1 : 0),
      total: current.total + 1,
    }));
  }

  function openQuiz() {
    if (!quizQuestion) {
      startNextQuizQuestion();
    }

    setIsQuizOpen(true);
  }

  async function addPair() {
    if (isAdding) return;

    const leftText = normalizeTerm(newPair.leftText);
    const rightText = normalizeTerm(newPair.rightText);
    const leftMeaning = newPair.leftMeaning.trim();
    const rightMeaning = newPair.rightMeaning.trim();
    const meaning = formatMeaning(leftMeaning, rightMeaning);

    if (!leftText || !rightText || !leftMeaning || !rightMeaning) {
      setFormError("Nhập cặp từ trái nghĩa và nghĩa tiếng Việt.");
      return;
    }

    setIsAdding(true);
    setFormError("");

    const result = await createOppositePairAction({
      leftText,
      rightText,
      pinyin: newPairPinyin,
      meaning,
    });

    setIsAdding(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    const nextPairs = [...oppositePairs, result.data];

    setOppositePairs(nextPairs);
    setNewPair({
      leftText: "",
      rightText: "",
      leftMeaning: "",
      rightMeaning: "",
    });
    if (!quizQuestion) {
      startNextQuizQuestion(nextPairs);
    }
    router.refresh();
  }

  function openEditModal(pair: OppositePair) {
    const meaning = splitMeaning(pair.meaning);
    const pinyinPair = splitPinyin(pair.pinyin);

    setEditingPair(pair);
    setEditPair({
      leftText: pair.leftText,
      rightText: pair.rightText,
      leftPinyin: pinyinPair.leftValue,
      rightPinyin: pinyinPair.rightValue,
      leftMeaning: meaning.leftMeaning,
      rightMeaning: meaning.rightMeaning,
    });
    setEditError("");
  }

  function closeEditModal() {
    if (isSavingEdit || deletingPairId) return;

    setEditingPair(null);
    setEditPair({
      leftText: "",
      rightText: "",
      leftPinyin: "",
      rightPinyin: "",
      leftMeaning: "",
      rightMeaning: "",
    });
    setEditError("");
  }

  async function saveEditedPair() {
    if (!editingPair || isSavingEdit) return;

    const leftText = normalizeTerm(editPair.leftText);
    const rightText = normalizeTerm(editPair.rightText);
    const leftPinyin = editPair.leftPinyin.trim();
    const rightPinyin = editPair.rightPinyin.trim();
    const leftMeaning = editPair.leftMeaning.trim();
    const rightMeaning = editPair.rightMeaning.trim();
    const meaning = formatMeaning(leftMeaning, rightMeaning);

    if (
      !leftText ||
      !rightText ||
      !leftPinyin ||
      !rightPinyin ||
      !leftMeaning ||
      !rightMeaning
    ) {
      setEditError("Nhập đủ cặp từ trái nghĩa, pinyin và nghĩa tiếng Việt.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    const result = await updateOppositePairAction({
      id: editingPair.id,
      leftText,
      rightText,
      pinyin: formatPair(leftPinyin, rightPinyin),
      meaning,
    });

    setIsSavingEdit(false);

    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    const nextPairs = oppositePairs.map((pair) =>
      pair.id === result.data.id ? result.data : pair,
    );

    setOppositePairs(nextPairs);
    if (quizQuestion?.pairId === result.data.id) {
      startNextQuizQuestion(nextPairs);
    }
    closeEditModal();
    router.refresh();
  }

  async function deletePair(pair: OppositePair) {
    if (deletingPairId) return;

    setDeletingPairId(pair.id);
    setEditError("");
    setFormError("");

    const result = await deleteOppositePairAction(pair.id);

    setDeletingPairId("");

    if (!result.ok) {
      if (editingPair?.id === pair.id) {
        setEditError(result.error);
      } else {
        setFormError(result.error);
      }
      return;
    }

    const nextPairs = oppositePairs.filter(
      (item) => item.id !== result.data.id,
    );

    setOppositePairs(nextPairs);

    if (editingPair?.id === pair.id) {
      closeEditModal();
    }

    if (quizQuestion?.pairId === pair.id || nextPairs.length === 0) {
      startNextQuizQuestion(nextPairs);
    }

    router.refresh();
  }

  const columns: TableColumnsType<OppositePairRow> = [
    {
      title: "STT",
      dataIndex: "rowNumber",
      width: 76,
      align: "center",
    },
    {
      title: "Cặp từ trái nghĩa",
      key: "pair",
      width: 280,
      render: (_value, row) => (
        <OppositeValue
          leftValue={row.leftText}
          rightValue={row.rightText}
          size="large"
        />
      ),
    },
    {
      title: "Pinyin",
      dataIndex: "pinyin",
      width: 240,
      render: (value: string) => {
        const pinyinPair = splitFormattedValue(value);

        return (
          <OppositeValue
            leftValue={pinyinPair.leftValue}
            rightValue={pinyinPair.rightValue}
          />
        );
      },
    },
    {
      title: "Nghĩa tiếng Việt",
      dataIndex: "meaning",
      render: (value: string) => {
        const meaningPair = splitFormattedValue(value);

        return (
          <OppositeValue
            leftValue={meaningPair.leftValue}
            rightValue={meaningPair.rightValue}
          />
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 116,
      align: "right",
      render: (_value, row) => (
        <Space size="small">
          <Button
            aria-label={`Sửa cặp ${formatPair(row.leftText, row.rightText)}`}
            icon={<EditOutlined />}
            onClick={() => openEditModal(row)}
            size="small"
          />
          <Popconfirm
            cancelText="Hủy"
            description="Cặp từ này sẽ bị xóa khỏi bảng."
            okButtonProps={{
              danger: true,
              loading: deletingPairId === row.id,
            }}
            okText="Xóa"
            onConfirm={() => deletePair(row)}
            title="Xóa cặp từ này?"
          >
            <Button
              aria-label={`Xóa cặp ${formatPair(row.leftText, row.rightText)}`}
              danger
              icon={<DeleteOutlined />}
              loading={deletingPairId === row.id}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card className="border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Typography.Title level={3} className="mb-1!">
                Từ đối lập
              </Typography.Title>
              <Typography.Text className="text-slate-500">
                Lưu các cặp trái nghĩa để ôn theo trục nghĩa và nhớ nhanh hơn.
              </Typography.Text>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={openQuiz}
                type="primary"
              >
                Luyện quiz
              </Button>
              <div className="flex h-10 items-center gap-2 rounded-lg bg-sky-50 px-3 text-sm font-semibold text-sky-700">
                <SwapOutlined />
                {oppositePairs.length} cặp
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Form onFinish={addPair} layout="vertical">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-700">
                    Vế 1
                  </div>
                  <Form.Item label="Từ trái nghĩa" className="mb-3!">
                    <Input
                      allowClear
                      onChange={(event) => {
                        setNewPair((current) => ({
                          ...current,
                          leftText: event.target.value,
                        }));
                        setFormError("");
                      }}
                      placeholder="天"
                      value={newPair.leftText}
                    />
                  </Form.Item>
                  <Form.Item label="Pinyin tự sinh" className="mb-3!">
                    <div className="min-h-8 rounded-md border border-slate-200 bg-white px-3 py-1.5 leading-6 text-slate-700">
                      {newLeftPinyin || "-"}
                    </div>
                  </Form.Item>
                  <Form.Item label="Nghĩa tiếng Việt" className="mb-0!">
                    <Input
                      allowClear
                      onChange={(event) => {
                        setNewPair((current) => ({
                          ...current,
                          leftMeaning: event.target.value,
                        }));
                        setFormError("");
                      }}
                      placeholder="Trời"
                      value={newPair.leftMeaning}
                    />
                  </Form.Item>
                </div>

                <div className="flex items-center justify-center">
                  <div
                    aria-label="Hai vế là cặp từ trái nghĩa"
                    className="flex min-h-14 min-w-24 flex-col items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 text-sky-700"
                    title="Hai vế là cặp từ trái nghĩa"
                  >
                    <SwapOutlined className="text-xl" />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-700">
                    Vế 2
                  </div>
                  <Form.Item label="Từ trái nghĩa" className="mb-3!">
                    <Input
                      allowClear
                      onChange={(event) => {
                        setNewPair((current) => ({
                          ...current,
                          rightText: event.target.value,
                        }));
                        setFormError("");
                      }}
                      placeholder="地"
                      value={newPair.rightText}
                    />
                  </Form.Item>
                  <Form.Item label="Pinyin tự sinh" className="mb-3!">
                    <div className="min-h-8 rounded-md border border-slate-200 bg-white px-3 py-1.5 leading-6 text-slate-700">
                      {newRightPinyin || "-"}
                    </div>
                  </Form.Item>
                  <Form.Item label="Nghĩa tiếng Việt" className="mb-0!">
                    <Input
                      allowClear
                      onChange={(event) => {
                        setNewPair((current) => ({
                          ...current,
                          rightMeaning: event.target.value,
                        }));
                        setFormError("");
                      }}
                      placeholder="Đất"
                      value={newPair.rightMeaning}
                    />
                  </Form.Item>
                </div>
              </div>

              <div className="xl:w-36">
                <Button
                  block
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  loading={isAdding}
                  type="primary"
                >
                  Thêm cặp
                </Button>
              </div>
            </div>
            {formError ? (
              <Alert className="mt-4" showIcon title={formError} type="error" />
            ) : null}
          </Form>
        </Card>

        <Table<OppositePairRow>
          bordered
          columns={columns}
          dataSource={filteredRows}
          locale={{
            emptyText: (
              <Empty
                description={
                  search.trim()
                    ? "Không tìm thấy cặp từ phù hợp."
                    : "Chưa có cặp từ đối lập."
                }
              />
            ),
          }}
          pagination={false}
          rowKey="id"
          scroll={{ x: 920 }}
          size="small"
          title={() => (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Typography.Text className="font-semibold text-slate-700">
                Danh sách cặp từ
              </Typography.Text>
              <Input
                allowClear
                aria-label="Tìm kiếm cặp từ trái nghĩa"
                className="w-full sm:max-w-sm"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm chữ Hán, pinyin, nghĩa"
                prefix={<SearchOutlined />}
                value={search}
              />
            </div>
          )}
        />
      </Space>

      <Modal
        footer={null}
        onCancel={() => setIsQuizOpen(false)}
        open={isQuizOpen}
        title="Quiz trái nghĩa"
        width={760}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <Typography.Text className="text-slate-500">
              Chọn từ trái nghĩa đúng. Câu hỏi lấy ngẫu nhiên từ hai vế trong
              bảng.
            </Typography.Text>
            <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
              {quizStats.correct}/{quizStats.total} đúng
            </div>
          </div>

          {quizQuestion ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1fr)] lg:items-stretch">
              <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-sky-100 bg-sky-50 p-5 text-center">
                <Typography.Text className="text-sm font-semibold uppercase text-sky-600">
                  Từ cần tìm trái nghĩa
                </Typography.Text>
                <div className="mt-3 text-4xl text-slate-950">
                  {quizQuestion.prompt}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {quizQuestion.options.map((option) => {
                    const isSelected = selectedQuizAnswer === option;
                    const isCorrect = option === quizQuestion.answer;
                    const shouldShowCorrect =
                      Boolean(selectedQuizAnswer) && isCorrect;
                    const shouldShowWrong =
                      Boolean(selectedQuizAnswer) && isSelected && !isCorrect;

                    return (
                      <Button
                        className={`h-12! justify-start! text-left! text-lg! ${
                          shouldShowCorrect
                            ? "border-emerald-300! bg-emerald-50! text-emerald-700!"
                            : shouldShowWrong
                              ? "border-red-300! bg-red-50! text-red-700!"
                              : ""
                        }`}
                        disabled={Boolean(selectedQuizAnswer)}
                        key={option}
                        onClick={() => chooseQuizAnswer(option)}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>

                {selectedQuizAnswer ? (
                  <Alert
                    description={
                      <div className="space-y-1">
                        <div>
                          {formatPair(
                            quizQuestion.leftText,
                            quizQuestion.rightText,
                          )}
                        </div>
                        <div>
                          {formatMeaning(
                            quizQuestion.leftMeaning,
                            quizQuestion.rightMeaning,
                          )}
                        </div>
                      </div>
                    }
                    showIcon
                    title={
                      selectedQuizIsCorrect
                        ? "Chính xác."
                        : `Đáp án đúng là ${quizQuestion.answer}.`
                    }
                    type={selectedQuizIsCorrect ? "success" : "error"}
                  />
                ) : null}

                <div className="flex justify-end">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => startNextQuizQuestion()}
                  >
                    Câu khác
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Empty description="Thêm ít nhất một cặp từ trái nghĩa để bắt đầu quiz." />
          )}
        </div>
      </Modal>

      <Modal
        confirmLoading={isSavingEdit}
        okText="Lưu"
        onCancel={closeEditModal}
        onOk={saveEditedPair}
        open={Boolean(editingPair)}
        title="Chỉnh sửa cặp từ"
      >
        <Form layout="vertical">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                Vế 1
              </div>
              <Form.Item
                label="Từ trái nghĩa"
                validateStatus={editError ? "error" : undefined}
              >
                <Input
                  autoFocus
                  onChange={(event) => {
                    setEditPair((current) => ({
                      ...current,
                      leftText: event.target.value,
                    }));
                    setEditError("");
                  }}
                  onPressEnter={saveEditedPair}
                  value={editPair.leftText}
                />
              </Form.Item>
              <Form.Item label="Pinyin">
                <Input
                  onChange={(event) => {
                    setEditPair((current) => ({
                      ...current,
                      leftPinyin: event.target.value,
                    }));
                    setEditError("");
                  }}
                  onPressEnter={saveEditedPair}
                  value={editPair.leftPinyin}
                />
              </Form.Item>
              <Form.Item
                className="mb-0!"
                label="Nghĩa tiếng Việt"
                validateStatus={editError ? "error" : undefined}
              >
                <Input
                  onChange={(event) => {
                    setEditPair((current) => ({
                      ...current,
                      leftMeaning: event.target.value,
                    }));
                    setEditError("");
                  }}
                  onPressEnter={saveEditedPair}
                  value={editPair.leftMeaning}
                />
              </Form.Item>
            </div>

            <div className="flex items-center justify-center">
              <div
                aria-label="Hai vế là cặp từ trái nghĩa"
                className="flex min-h-14 min-w-24 flex-col items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 text-sky-700"
                title="Hai vế là cặp từ trái nghĩa"
              >
                <SwapOutlined className="text-xl" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                Vế 2
              </div>
              <Form.Item
                label="Từ trái nghĩa"
                validateStatus={editError ? "error" : undefined}
              >
                <Input
                  onChange={(event) => {
                    setEditPair((current) => ({
                      ...current,
                      rightText: event.target.value,
                    }));
                    setEditError("");
                  }}
                  onPressEnter={saveEditedPair}
                  value={editPair.rightText}
                />
              </Form.Item>
              <Form.Item label="Pinyin">
                <Input
                  onChange={(event) => {
                    setEditPair((current) => ({
                      ...current,
                      rightPinyin: event.target.value,
                    }));
                    setEditError("");
                  }}
                  onPressEnter={saveEditedPair}
                  value={editPair.rightPinyin}
                />
              </Form.Item>
              <Form.Item
                className="mb-0!"
                label="Nghĩa tiếng Việt"
                validateStatus={editError ? "error" : undefined}
              >
                <Input
                  onChange={(event) => {
                    setEditPair((current) => ({
                      ...current,
                      rightMeaning: event.target.value,
                    }));
                    setEditError("");
                  }}
                  onPressEnter={saveEditedPair}
                  value={editPair.rightMeaning}
                />
              </Form.Item>
            </div>
          </div>
          {editError ? <Alert showIcon title={editError} type="error" /> : null}
        </Form>
      </Modal>
    </main>
  );
}
