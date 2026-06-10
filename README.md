# Briefing SDR

App Next.js de tela única para transformar formulários brutos de leads em briefings SDR padronizados.

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
AI_API_KEY=sua_chave_da_ia
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

A chave é usada apenas pela rota backend `/api/briefing` e não é exposta no frontend.

## Rodar

```bash
npm install
npm run dev
```

Depois abra `http://localhost:3000`.
