"use client";

import { ArrowLeftOutlined, SearchOutlined, SwapOutlined } from "@ant-design/icons";
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

type OppositePair = {
  id: string;
  leftText: string;
  rightText: string;
  pinyin: string;
  meaning: string;
  position: number;
};

type OppositePairRow = OppositePair & {
  rowNumber: number;
};

const pairSeparator = " ↔ ";
const legacyPairSeparator = " >< ";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
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
        className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs text-emerald-600 ring-1 ring-emerald-200"
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

export default function PublicOppositesClient({
  initialOppositePairs,
  publicId,
}: {
  initialOppositePairs: OppositePair[];
  publicId: string;
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo<OppositePairRow[]>(
    () =>
      initialOppositePairs.map((pair, index) => ({
        ...pair,
        rowNumber: index + 1,
      })),
    [initialOppositePairs],
  );
  const filteredRows = useMemo(() => {
    const keyword = normalizeSearch(query);

    if (!keyword) return rows;

    return rows.filter((row) =>
      [row.leftText, row.rightText, row.pinyin, row.meaning].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [query, rows]);

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
                Từ đối lập
              </Typography.Title>
              <Typography.Text type="secondary">
                {rows.length} cặp từ · chỉ xem
              </Typography.Text>
            </div>
            <div className="w-full lg:max-w-md">
              <Input
                allowClear
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm chữ Hán, pinyin hoặc nghĩa"
                prefix={<SearchOutlined />}
                size="large"
                value={query}
              />
            </div>
          </div>
        </Card>

        {rows.length > 0 ? (
          <Table<OppositePairRow>
            bordered
            columns={columns}
            dataSource={filteredRows}
            locale={{ emptyText: "Không có cặp từ phù hợp." }}
            pagination={false}
            rowKey="id"
            scroll={{ x: 760 }}
            size="small"
          />
        ) : (
          <Card className="border border-slate-200 shadow-sm">
            <Empty description="Chưa có cặp từ đối lập." />
          </Card>
        )}
      </Space>
    </main>
  );
}
