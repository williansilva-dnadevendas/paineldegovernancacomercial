# AGENTS.md — contexto para agentes de código (Codex, Claude Code, Cursor…)

Leia este arquivo inteiro antes de qualquer alteração. Ele resume o que este projeto é, o que já foi decidido e o que falta.
Documentos completos em `docs/`.

## O que é

**Governança Comercial** — instrumento da consultoria DNA de Vendas para conduzir a reunião semanal de funil de vendas.
Primeiro cliente: IT-One (gerência comercial, 4 executivos de contas, 4 linhas de negócio).
O responsável pelo projeto (Willian, consultor sênior) **não é programador**: explique decisões em linguagem de negócio, sem jargão,
e nunca peça a ele para editar código. Idioma: português do Brasil, tom direto e executivo, sem introduções genéricas.

Lógica de negócio (fiel a uma planilha Excel validada): meta anual → % por trimestre → % por mês; funil ponderado
(Pipeline 20% · Strong 50% · Commit 90%) = forecast; cascata de excedente entre meses; quatro "faltas" (a vender, a cobrir, projetada,
em caixa); Plano M+3 com engenharia reversa (receita → vendas → oportunidades ÷ win rate → prospects ÷ conversão), piso e capacidade.
Tudo isso está em `engine/engine.js` e **reproduz a planilha com 100% de fidelidade** — não altere sem um teste que prove a equivalência.

## Estado atual — Onda 1 (concluída, aguardando implantação pelo consultor)

- Site estático (GitHub Pages) + Supabase (PostgreSQL, login por e-mail/senha). **Sem servidor próprio.**
- `db/schema.sql` — 12 tabelas, RLS por `client_id` (multi-cliente desde o dia 1), `load_workspace()`, `ping()`.
- `app/store.js` — estado em memória no formato do engine ↔ linhas do banco; gravação **por entidade** (upsert), undo por operação.
- `app/app.js` — telas da v0.4 adaptadas (renderização por string/innerHTML — será reescrita na v0.5).
- Testes: `npm test` (17, sem rede) · `npm run smoke` (Playwright, API simulada). Todos passam.
- Implantação manual pendente (Supabase + GitHub): `docs/implantacao.md`.

## Regras que não mudam

1. **Engine intacto.** Estender sim, alterar semântica não. Reconciliação com a planilha é o critério de aceite.
2. **Percentuais, nunca pesos.** Toda parametrização do usuário é em % (0–100). Grupos que distribuem um total (sazonalidade, distribuição mensal por trimestre, mix, ciclo M+2/M+3/M+4) devem mostrar a soma ao vivo, "Fecha 100%" e um botão Completar. O banco guarda %; o engine trabalha com frações — a conversão é do `store.js`.
3. **Sem níveis de acesso.** Um login único; todos os usuários de um cliente veem e editam tudo. A RLS existe só para isolar clientes e bloquear anônimos.
4. **Nenhum dado de cliente no repositório** (público). Seeds ficam fora do Git (`.gitignore`). Fixtures de teste usam nomes fictícios.
5. **Zero dependências instaladas.** Bibliotecas só via CDN com versão fixada (`@supabase/supabase-js@2.112.4`, futuramente SheetJS). Sem build.
6. **Chaves novas do Supabase** (`sb_publishable_…`, `sb_secret_…`) vão apenas no cabeçalho `apikey`, nunca em `Authorization: Bearer`.
7. **Glossário v0.5:** Falta a vender (meta − won) · Falta a cobrir (meta − cobertura c/ carry) · Falta projetada (meta − forecast). Não introduza sinônimos.

## Próximo trabalho — v0.5 (`docs/especificacao-funcional-v0.5.md`)

Ordem recomendada, em duas entregas:

**Entrega 1 — Reunião como processo**
- Reescrever a interface por área/componentes (substituir `innerHTML` total; manter zero dependências ou adotar Preact via CDN).
- Área **Reunião** em 6 etapas (Situação → Funil e forecast → Trimestre e trajetória → Plano M+3 e compromissos → Decisões e ações → Fechamento), stepper, Modo Apresentação (tecla F, tema escuro).
- **Ações & Compromissos**: backlog cruzando meses, atraso, ritmo semanal (compromisso ÷ 4).
- Glossário aplicado em todas as telas; barra de trajetória Mês · Trimestre · Ano persistente.
- Barras "Fecha 100%" + Completar em Planejamento e Parâmetros.

**Entrega 2 — Cockpit trimestral, semáforos, exportações**
- Visão Trimestral (tabela T1–T4 + barras), ritmo necessário, recuperação do trimestre (% = forecast restante ÷ falta a vender do T).
- Semáforo duplo (resultado + funil) e de prospecção; limites em `parameters.thresholds`.
- Perfil por executivo alimentando o Plano M+3 (`executives.profile`, `parameters.profiles[perfil]`).
- Meta R$ e vendas por linha (mix), critérios de estágio nos Parâmetros, motivo obrigatório no ajuste gerencial.
- Exportar Excel (SheetJS, abas espelhando a planilha) e PDF (CSS de impressão): por executivo e consolidado.

Fora de escopo por decisão: oportunidades individuais, importação do CRM, múltiplos gerentes, notificações.

## Como verificar antes de entregar

```bash
npm test                         # engine + store
npm run smoke                    # interface ponta a ponta com API simulada (precisa de playwright + chromium)
psql -f db/schema.sql            # se houver Postgres local: o schema é idempotente
```
Qualquer mudança em cálculo: comparar com os valores da planilha registrados em `tests/engine.test.mjs` e `tests/store.test.mjs`
(ex.: agosto/2026 consolidado → meta acum. 4.533.333 · won 233.600 · forecast 1.534.150 · falta projetada 5.465.850).

## Histórico de decisões (resumo)

Ver `docs/handoff.md` para a linha do tempo completa: análise do app v0.4, propósito definido pelo consultor, respostas às 10 perguntas
de refinamento, reconciliação com a planilha, análise de gap, especificação v0.5 com as 10 decisões tomadas, avaliação técnica
(defeitos R1–R7) e arquitetura da Onda 1.
