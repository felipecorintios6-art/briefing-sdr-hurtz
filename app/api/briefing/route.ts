import { NextResponse } from "next/server";

type BriefingRequest = {
  rawLead?: string;
  sdrNotes?: string;
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

export async function POST(request: Request) {
  try {
    const { rawLead, sdrNotes }: BriefingRequest = await request.json();

    if (!rawLead?.trim()) {
      return NextResponse.json(
        { error: "Cole o formulário bruto do lead para gerar o briefing." },
        { status: 400 },
      );
    }

    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions";
    const model = process.env.AI_MODEL ?? "gpt-4o-mini";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Configure a variável AI_API_KEY no ambiente do servidor." },
        { status: 500 },
      );
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Você transforma formulários brutos de leads em briefings SDR objetivos, em português do Brasil. Preserve apenas informações úteis para prospecção e não invente dados ausentes.",
          },
          {
            role: "user",
            content: `Gere um briefing seguindo exatamente este padrão visual e de seções. Se algum dado não existir, use "Não informado". Inclua as observações SDR na seção Observações quando forem relevantes.

Padrão:
${BRIEFING_TEMPLATE}

Formulário bruto do lead:
${rawLead.trim()}

Observações/alertas SDR:
${sdrNotes?.trim() || "Não informado"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      await response.text();
      return NextResponse.json(
        { error: "A IA não conseguiu gerar o briefing agora." },
        { status: response.status },
      );
    }

    const data = await response.json();
    const briefing = data?.choices?.[0]?.message?.content?.trim();

    if (!briefing) {
      return NextResponse.json(
        { error: "A resposta da IA veio vazia. Tente novamente." },
        { status: 502 },
      );
    }

    return NextResponse.json({ briefing });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar o briefing." },
      { status: 500 },
    );
  }
}
