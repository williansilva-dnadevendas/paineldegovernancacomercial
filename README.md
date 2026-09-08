# Governança Comercial

Instrumento de governança comercial da DNA de Vendas para a condução da reunião semanal de funil.
Primeira aplicação: IT-One.

**Arquitetura (Onda 1):** site estático publicado pelo GitHub Pages · motor de cálculo no navegador (`engine/engine.js`) ·
dados no Supabase (PostgreSQL + login) · sem servidor próprio · custo zero.

```
index.html          app (uma página, rotas por #hash)
app/main.js         login, carregamento, início
app/api.js          única camada que fala com o Supabase
app/store.js        estado em memória ↔ banco (gravação por entidade, undo por operação)
app/app.js          interface (telas da v0.4, adaptadas)
engine/engine.js    motor de cálculo — idêntico ao validado contra a planilha
db/schema.sql       tabelas, políticas de acesso, load_workspace(), ping()
scripts/            gerar-seed.mjs (carga inicial por cliente) · backup.mjs (CSV → bucket)
.github/workflows/  pages.yml (publica) · keepalive.yml (diário) · backup.yml (semanal)
tests/              engine (9) · store (8) · smoke de interface (Playwright)
```

Guia de implantação passo a passo: [`docs/implantacao.md`](docs/implantacao.md).
Operação do dia a dia e problemas comuns: [`docs/operacao.md`](docs/operacao.md).

## Desenvolvimento local

```bash
npm test          # testes do engine e do store (sem rede)
npm run smoke     # percorre a interface com API simulada (requer playwright + chromium)
npm run dev       # serve a pasta em http://127.0.0.1:4173 (usa o Supabase real; exige login)
```

Dados de clientes nunca entram neste repositório: o arquivo de seed gerado por `scripts/gerar-seed.mjs`
fica fora do Git (ver `.gitignore`) e é executado uma vez no SQL Editor do Supabase.
