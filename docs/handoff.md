# Handoff — linha do tempo e decisões (setembro de 2026)

Registro condensado da sessão de trabalho que produziu este repositório, para que qualquer pessoa ou agente retome sem perder contexto.

## 1. Ponto de partida

- App **IT-One — Governança Comercial v0.4**, gerado com apoio de IA, hospedado no GitHub; tentativa anterior de publicação estática (pasta `dist/`) sem API, o que fazia cada navegador guardar uma cópia isolada em `localStorage`.
- Stack original: Node sem dependências (`server.mjs`) servindo `public/` + API de 2 rotas (`GET/PUT /api/state`) sobre um único `data/state.json`. Sem autenticação, `127.0.0.1` fixo, disco efêmero em qualquer hospedagem gratuita.
- Motor de cálculo (`engine.js`) correto: reconciliado com a planilha "Painel de Governança Comercial — Corrigida QA01/QA02" (8 abas, ~16 mil fórmulas) em 100% dos indicadores testados.

## 2. Propósito definido pelo consultor

Apoiar a gerência na reunião semanal com lógica encadeada **mês (decisão e execução) → trimestre (tendência e capacidade de recuperação) → ano (referência estratégica)**. Roteiro da reunião em 10 passos (revisar mês → comparar com meta → impacto no trimestre → trajetória anual → pipeline/Strong/Commit/forecast → desvios e riscos → necessidade de oportunidades e prospects → ações com responsável e prazo → compromissos → snapshot). O burn-up é o gráfico central. A ferramenta responde: o funil ponderado sustenta a meta do mês, do trimestre e do ano? Quantos prospects por mês e por semana (engenharia reversa)?

## 3. Respostas às 10 perguntas de refinamento

1. Usuários: gerência e diretoria, na frente dos executivos durante a reunião.
2. Dados vêm do CRM próprio da IT-One; importação é desejável mas pode ficar para depois; **exportar Excel é obrigatório**.
3. Leitura executiva: **sem** lista de oportunidades individuais.
4. Prospects e oportunidades geradas são **metas mensais**; cálculo projetado para o ano, ajustado no trimestre por ausência/férias.
5. Trimestre fixo como visão; ações do gerente podem cruzar trimestres.
6. Núcleo: forecast ponderado (20/50/90%) vs. meta do mês, trimestre e ano.
7. Hunter foca prospecção, Farmer foca carteira; a maioria é End-to-End.
8. Meta desdobrada pelos grupos de produto do mix (soma 100%).
9. Saídas: PDF do cenário atual e plano de ação; Excel para guardar os dados.
10. Instrumento da DNA de Vendas para reaplicar em outros clientes; esta versão é para a IT-One.

## 4. Análise de gap (resumo)

Críticas: visão trimestral ausente; ações somem na virada do mês; sem autenticação; persistência em arquivo; cadência semanal × modelo mensal.
Relevantes: roteiro fragmentado em 3 telas; forecast por executivo fora do Modo Reunião; capacidade de recuperação; perfil global; semáforo só por atingimento; snapshot sem série; ajuste sem motivo; proteção sem credencial; audit limitado; sem exportação; sete termos de gap.
O que a planilha tem e o app omitiu: Visão Trimestral (Dashboard, linhas 90–96 + gráfico 7), gráficos compromisso × realizado, meta R$ e vendas por linha (Ticket & Mix), critérios mínimos por estágio e autorização (Parâmetros §3), bloco "Carteira e Forecast".

## 5. Especificação funcional v0.5 — decisões tomadas

- Navegação por momento de uso: Cockpit · Reunião · Executivos · Ações & Compromissos · Planejamento · Parâmetros.
- Barra de trajetória Mês · Trimestre · Ano persistente; Reunião em 6 etapas; Modo Apresentação.
- **Percentuais no lugar de pesos** em toda parametrização, com "Fecha 100%" e botão Completar.
- Semáforos: resultado 100/80% · cobertura do funil 300/150% · recuperação 100/70% · prospecção 100/80%.
- 4 semanas fixas por mês; sem registro semanal do realizado na v0.5; executivos do mais crítico ao menos crítico; capacidade igual para os três perfis (150/35) até calibrar; diretoria somente leitura; **Falta a vender · Falta a cobrir · Falta projetada**; PDF consolidado automático ao encerrar a reunião; tema escuro padrão no Modo Apresentação.

## 6. Avaliação técnica do código v0.4

Defeitos confirmados em teste: R1 Desfazer nunca persiste após o primeiro autosave (409); R2 após um 409 todos os salvamentos falham; R3 fallback para `localStorage` perde dados com mensagem de sucesso; R4 estado inválido fica na tela após rejeição; R5 IDs por `Date.now()`; R6 perda de foco por `innerHTML` total; R7 audit sem usuário e truncado.
Estrutura: engine isolado (manter); `app.js` monolítico por string (reescrever na v0.5); validação duplicada cliente/servidor; escape inconsistente; testes só do engine.

## 7. Arquitetura da Onda 1 (implementada)

Premissas do consultor: uso interno, sem níveis de acesso, hospedagem no GitHub, banco gratuito provisório.
Solução: GitHub Pages + Supabase Free, sem servidor; login único (site é público e a chave é pública por desenho); gravação por entidade; keep-alive diário (pausa após 7 dias sem atividade) e backup semanal em CSV (plano gratuito não tem backup automático).
Resultado verificado: schema idempotente; RLS bloqueia anônimo e e-mail não cadastrado; seed da IT-One carregado; reconciliação banco → store → engine → planilha 100%; 17 testes unitários + smoke de interface; R1–R5 eliminados.

## 8. Pendente

- Implantação manual (Supabase + GitHub): `docs/implantacao.md`.
- Validação na URL real pelo consultor.
- v0.5 conforme `AGENTS.md` e `docs/especificacao-funcional-v0.5.md`.
