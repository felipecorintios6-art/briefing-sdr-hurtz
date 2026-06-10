import { NextResponse } from "next/server";

type BriefingRequest = {
  leadText?: string;
  alerts?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const BRIEFING_TEMPLATE = `📋 LEAD BRIEFING - NOME

👤 Nome:
📍 Cidade:
🗺️ Estado:
🏢 Administradora:

📊 Operação
• Faturamento atual:
• Equipe atual:

📈 Captação Atual
•

📸 Instagram
•

📝 Observações
•`;

function buildPrompt(leadText: string, alerts?: string) {
  return `Gere um briefing SDR seguindo exatamente este padrão visual e de seções.
Retorne somente o briefing final, sem markdown extra e sem comentários antes ou depois.
Se algum dado não existir, use "Não informado".
Não invente dados ausentes.
Inclua os alertas SDR na seção Observações quando forem relevantes.

Padrão:
${BRIEFING_TEMPLATE}

Formulário bruto do lead:
${leadText.trim()}

Observações/alertas SDR:
${alerts?.trim() || "Não informado"}`;
}

async function generateBriefingWithGemini(model: string, apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "Você transforma formulários brutos de leads em briefings SDR objetivos, em português do Brasil. Preserve apenas informações úteis para prospecção.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200,
        },
      }),
    },
  );

  if (!response.ok) {
    return { briefing: "", status: response.status };
  }

  const data = (await response.json()) as GeminiResponse;
  const briefing = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  return { briefing: briefing ?? "", status: response.status };
}

export async function POST(request: Request) {
  try {
    const { leadText, alerts }: BriefingRequest = await request.json();

    if (!leadText?.trim()) {
      return NextResponse.json(
        { error: "Cole o formulário bruto do lead para gerar o briefing." },
        { status: 400 },
      );
    }

    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Configure a variável AI_API_KEY do Gemini no ambiente do servidor." },
        { status: 500 },
      );
    }

    const prompt = buildPrompt(leadText, alerts);
    const preferredModel = process.env.AI_MODEL?.trim() || "gemini-2.0-flash";
    const models = Array.from(new Set([preferredModel, "gemini-1.5-flash"]));

    for (const model of models) {
      const result = await generateBriefingWithGemini(model, apiKey, prompt);

      if (result.briefing) {
        return NextResponse.json({ briefing: result.briefing });
      }

      if (result.status !== 404) {
        return NextResponse.json(
          { error: "O Gemini não conseguiu gerar o briefing agora." },
          { status: result.status },
        );
      }
    }

    return NextResponse.json(
      { error: "Nenhum modelo Gemini configurado está disponível para gerar o briefing." },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar o briefing." },
      { status: 500 },
    );
  }
}
