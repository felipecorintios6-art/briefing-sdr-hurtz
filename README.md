# Briefing SDR

App Next.js de tela única para transformar formulários brutos de leads em briefings SDR padronizados.

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
AI_API_KEY=sua_chave_do_google_gemini
AI_MODEL=gemini-2.0-flash
```

A chave é usada apenas pela rota backend `/api/briefing` e não é exposta no frontend.

## Rodar

```bash
npm install
npm run dev
```

Depois abra `http://localhost:3000`.
