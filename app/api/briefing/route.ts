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
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
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

async function generateBriefingWithGemini(apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    console.error("Gemini API error", {
      status: response.status,
      statusText: response.statusText,
      error: data.error,
    });

    return {
      briefing: "",
      error:
        data.error?.message ??
        `Gemini retornou erro ${response.status} ${response.statusText}.`,
      status: response.status,
    };
  }

  const briefing = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!briefing) {
    console.error("Gemini API empty response", { status: response.status, data });
  }

  return {
    briefing: briefing ?? "",
    error: briefing ? "" : "Gemini retornou uma resposta vazia ou em formato inesperado.",
    status: response.status,
  };
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
    const result = await generateBriefingWithGemini(apiKey, prompt);

    if (result.briefing) {
      return NextResponse.json({ briefing: result.briefing });
    }

    return NextResponse.json(
      {
        error: "O Gemini não conseguiu gerar o briefing agora.",
        details: result.error,
      },
      { status: result.status || 502 },
    );
  } catch (error) {
    console.error("Briefing route error", error);

    return NextResponse.json(
      {
        error: "Não foi possível processar o briefing.",
        details: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 },
    );
  }
}
