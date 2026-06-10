"use client";

import { FormEvent, useMemo, useState } from "react";

type Theme = "light" | "dark";

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");
  const [rawLead, setRawLead] = useState("");
  const [sdrNotes, setSdrNotes] = useState("");
  const [briefing, setBriefing] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copiar briefing");

  const canGenerate = useMemo(() => rawLead.trim().length > 0 && !isLoading, [rawLead, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCopyLabel("Copiar briefing");
    setIsLoading(true);

    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawLead, sdrNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Não foi possível gerar o briefing.");
      }

      setBriefing(data.briefing);
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "Não foi possível gerar o briefing.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function copyBriefing() {
    if (!briefing) return;

    await navigator.clipboard.writeText(briefing);
    setCopyLabel("Copiado");
    window.setTimeout(() => setCopyLabel("Copiar briefing"), 1800);
  }

  return (
    <main className="shell" data-theme={theme}>
      <section className="workspace" aria-label="Gerador de briefing de leads SDR">
        <header className="topbar">
          <div>
            <p className="eyebrow">SDR workspace</p>
            <h1>Briefing de lead</h1>
          </div>

          <div className="themeSwitch" aria-label="Alternar tema">
            <button
              className={theme === "light" ? "active" : ""}
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
            >
              Claro
            </button>
            <button
              className={theme === "dark" ? "active" : ""}
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
            >
              Escuro
            </button>
          </div>
        </header>

        <form className="grid" onSubmit={handleSubmit}>
          <div className="panel editorPanel">
            <label htmlFor="rawLead">Formulário bruto do lead</label>
            <textarea
              id="rawLead"
              value={rawLead}
              onChange={(event) => setRawLead(event.target.value)}
              placeholder="Cole aqui o formulário, respostas do lead, histórico da conversa ou dados recebidos..."
              spellCheck={false}
            />

            <label htmlFor="sdrNotes">Observações/alertas SDR</label>
            <textarea
              id="sdrNotes"
              className="notes"
              value={sdrNotes}
              onChange={(event) => setSdrNotes(event.target.value)}
              placeholder="Ex.: pediu urgência, decisor ausente, lead frio, validar orçamento..."
              spellCheck={false}
            />

            {error ? <p className="error">{error}</p> : null}

            <div className="actions">
              <button className="primary" type="submit" disabled={!canGenerate}>
                {isLoading ? "Gerando..." : "Gerar briefing"}
              </button>
              <button className="secondary" type="button" onClick={copyBriefing} disabled={!briefing}>
                {copyLabel}
              </button>
            </div>
          </div>

          <aside className="panel outputPanel">
            <div className="outputHeader">
              <span>Briefing final</span>
              <small>{briefing ? "Pronto para copiar" : "Aguardando geração"}</small>
            </div>
            <pre className={briefing ? "briefing" : "briefing empty"}>
              {briefing ||
                `📋 LEAD BRIEFING - NOME

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
•`}
            </pre>
          </aside>
        </form>
      </section>
    </main>
  );
}
