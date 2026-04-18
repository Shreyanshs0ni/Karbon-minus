import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

export async function chatJson<T>(
  system: string,
  user: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const ai = getOpenAI();
  if (!ai) return { ok: false, error: "AI service unavailable" };
  try {
    const res = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });
    const text = res.choices[0]?.message?.content;
    if (!text) return { ok: false, error: "Empty AI response" };
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch (e) {
    const err = e as { status?: number; message?: string };
    if (err.status === 429)
      return { ok: false, error: "Rate limited — try again shortly" };
    return { ok: false, error: err.message ?? "AI request failed" };
  }
}

export async function chatText(
  system: string,
  user: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const ai = getOpenAI();
  if (!ai) return { ok: false, error: "AI service unavailable" };
  try {
    const res = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 2048,
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "Empty AI response" };
    return { ok: true, text };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? "AI request failed" };
  }
}
