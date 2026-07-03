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

    return Response.json({ error: message }, { status: 500 });
  }
}
