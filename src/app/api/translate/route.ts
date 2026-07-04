import { translate } from "@vitalets/google-translate-api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return Response.json({ error: "Missing text." }, { status: 400 });
    }

    const result = await translate(text, { from: "zh-CN", to: "vi" });

    return Response.json({ meaning: result.text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed.";
    const isRateLimited = message.toLowerCase().includes("too many requests");

    return Response.json(
      {
        error: isRateLimited
          ? "Dịch tự động đang bị giới hạn. Nhập nghĩa thủ công để tiếp tục."
          : message,
      },
      { status: isRateLimited ? 429 : 500 },
    );
  }
}
