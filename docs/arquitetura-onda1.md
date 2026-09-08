**DNA DE VENDAS · INSTRUMENTO DE GOVERNANÇA COMERCIAL**

**Governança Comercial**

Arquitetura-alvo — Onda 1

Hospedagem no GitHub, banco de dados gratuito e base para a v0.5

| **Item**                | **Conteúdo**                                                                                                                                                                |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Documento**           | Arquitetura técnica da Onda 1 — o alicerce sobre o qual a Especificação Funcional v0.5 será implementada                                                                    |
| **Premissas recebidas** | Uso interno e corporativo · sem níveis de acesso · hospedagem no GitHub · banco de dados gratuito, provisório · custo zero enquanto possível                                |
| **Base**                | Avaliação técnica do código v0.4 (defeitos R1–R7, estrutura E1–E7) · Especificação Funcional v0.5 · limites vigentes dos serviços gratuitos consultados em setembro de 2026 |
| **Status**              | Para validação antes de iniciar a implementação                                                                                                                             |

**1. Decisão de arquitetura em uma página**

O app deixa de ter servidor próprio. O navegador executa o motor de cálculo (como já faz hoje) e conversa diretamente com um banco de dados gerenciado gratuito. O código fica no GitHub e é publicado pelo GitHub Pages. Sem Node em produção, sem arquivo state.json, sem PUT do estado inteiro.

| **Camada**           | **v0.4 (hoje)**                                                | **Onda 1 (alvo)**                                                       | **Por quê**                                                                       |
|----------------------|----------------------------------------------------------------|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| **Código-fonte**     | GitHub                                                         | GitHub (mantido)                                                        | Premissa                                                                          |
| **Site**             | Servidor Node local (127.0.0.1) ou pasta dist estática sem API | GitHub Pages — HTML, CSS e JS estáticos, HTTPS incluso                  | Gratuito, deploy automático a cada push, zero manutenção                          |
| **Motor de cálculo** | engine.js no navegador                                         | engine.js no navegador (intacto, estendido para a v0.5)                 | Já validado contra a planilha                                                     |
| **Servidor de API**  | server.mjs (Node, 225 linhas)                                  | Nenhum — o navegador fala com o banco por REST                          | Menos uma peça para hospedar, pagar e manter                                      |
| **Banco de dados**   | data/state.json em disco                                       | Supabase (PostgreSQL gerenciado, plano gratuito) — tabelas por entidade | Persistência real, backup possível, consultas SQL, exportação nativa              |
| **Acesso**           | Nenhum                                                         | Uma porta única: login por e-mail e senha, todos com o mesmo perfil     | O site é público na internet; sem porta, qualquer pessoa com a URL edita os dados |
| **Exportação**       | Nenhuma                                                        | Excel e PDF gerados no navegador                                        | Sem backend; bibliotecas via CDN                                                  |
| **Backup**           | Nenhum                                                         | GitHub Actions semanal exporta as tabelas para um repositório privado   | Plano gratuito do Supabase não tem backup automático                              |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Sobre “sem níveis de acesso”</strong></p>
<p>A premissa foi respeitada: não há papéis, permissões nem telas administrativas protegidas — todos que entram veem e editam tudo. O que a arquitetura mantém é uma única porta de entrada (login), porque o GitHub Pages gratuito exige repositório público e a chave do banco fica visível no código do site. Sem essa porta, os dados comerciais da IT-One ficariam abertos a qualquer pessoa. É um cadastro de e-mails feito uma vez pelo consultor; o gerente entra com e-mail e senha e não vê mais nada de segurança.</p></td>
</tr>
</tbody>
</table>

**2. Topologia**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>GitHub (repositório) Supabase (plano gratuito)</p>
<p>┌──────────────────────────┐ ┌──────────────────────────────┐</p>
<p>│ index.html · app/ · css/ │ push │ PostgreSQL ── 10 tabelas │</p>
<p>│ engine.js · shared/ │ ─────────► │ REST automático (PostgREST) │</p>
<p>│ .github/workflows/ │ Pages │ Auth (e-mail + senha) │</p>
<p>└──────────┬───────────────┘ │ Realtime (opcional) │</p>
<p>│ publica └──────────────▲───────────────┘</p>
<p>▼ │ HTTPS / REST</p>
<p>GitHub Pages (site estático, HTTPS) │</p>
<p>│ │</p>
<p>▼ │</p>
<p>Navegador do gerente ─────────────────────────────────────┘</p>
<p>· carrega o app · roda engine.js · lê/grava por entidade</p>
<p>· gera Excel (SheetJS) · gera PDF (impressão) · undo por operação</p>
<p>GitHub Actions (cron): keep-alive diário no banco · backup semanal em CSV</p></td>
</tr>
</tbody>
</table>

Quatro serviços, todos gratuitos, nenhum servidor administrado por você: GitHub (código e automações), GitHub Pages (site), Supabase (banco e login), navegador (processamento).

**3. Por que sem servidor próprio**

| **Argumento**                     | **Detalhe**                                                                                                                                                                                                                      |
|-----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **O engine já roda no navegador** | Todo o cálculo da planilha acontece em engine.js no cliente. O servidor v0.4 só lia e gravava um arquivo. Trocar o arquivo pelo banco elimina a única função do servidor.                                                        |
| **O banco entrega a API pronta**  | Supabase expõe cada tabela como endpoint REST (PostgREST) com filtros, upsert e paginação. Não há código de API para escrever nem hospedar.                                                                                      |
| **Validação compartilhada**       | A validação de 95 linhas do server.mjs vira um módulo shared/validate.js executado no navegador antes de gravar, e as regras estruturais (unicidade, faixas, não-nulos) viram constraints no banco. Dupla proteção sem servidor. |
| **Menos pontos de falha**         | Hospedar Node gratuitamente implica hibernação (Render), créditos mensais (Railway) ou limites de CPU. Sem Node, nada disso existe.                                                                                              |
| **Custo zero real**               | GitHub Pages e Supabase Free cobrem o porte da IT-One com folga: 500 MB de banco, 5 GB de tráfego/mês, 50 mil usuários de auth. O app usa uma fração de 1% disso.                                                                |

**4. Modelo de dados**

Dez tabelas, uma por entidade da especificação. Toda tabela carrega client_id para isolar clientes desde o primeiro dia (multi-cliente da seção 11 da especificação) e updated_at para controle de concorrência. Percentuais são gravados como número de 0 a 100.

| **Tabela**             | **Chave**                   | **Campos principais**                                                                                                                                                                                 | **Regras no banco**                                                     |
|------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| **clients**            | id                          | name · manager_name · logo_url · currency · vocabulary (jsonb) · base_year                                                                                                                            | 1 linha por cliente; IT-One é a primeira                                |
| **parameters**         | client_id                   | profiles (jsonb: taxas e capacidade por perfil) · stage_probability (jsonb) · cycle (jsonb) · apply_floor · floor_pct · materiality_pct · horizon_months · thresholds (jsonb: semáforos) · updated_at | 1 linha por cliente; ciclo fecha 100% (check)                           |
| **business_lines**     | id                          | client_id · code (LIN-01) · name · ticket · sort_order                                                                                                                                                | ticket \> 0; code único por cliente                                     |
| **executives**         | id                          | client_id · code (EXE-01) · name · profile · start_month · end_month · annual_target · quarter_pct (jsonb, 4) · month_pct (jsonb, 12) · total_accounts · active · sort_order                          | quarter_pct fecha 100%; month_pct fecha 100% por trimestre; start ≤ end |
| **executive_mix**      | executive_id + line_id      | pct                                                                                                                                                                                                   | soma 100% por executivo (verificado no cliente e por view)              |
| **management_entries** | executive_id + year + month | pipeline · strong · commit · won_value · won_qty · lost_value · lost_qty · active_accounts · manager_adjustment · adjustment_reason · last_review · updated_at                                        | valores ≥ 0; motivo obrigatório se ajuste ≠ 0                           |
| **commitments**        | executive_id + year + month | committed_prospects · committed_opportunities · actual_prospects · actual_opportunities · updated_at                                                                                                  | valores ≥ 0                                                             |
| **actions**            | id                          | client_id · executive_id · description · owner · due_date · priority · status · origin_year · origin_month · origin_week · created_at · completed_at · updated_at                                     | prioridade e status em enum                                             |
| **snapshots**          | id                          | executive_id · taken_at · year · month · week · attainment · forecast · gap_to_sell · gap_to_cover · open_pipeline · weighted_pipeline · committed/actual prospects e opportunities · open_actions    | somente inserção; nunca editado                                         |
| **meeting_notes**      | executive_id + year + month | text · updated_at                                                                                                                                                                                     | —                                                                       |
| **audit_log**          | id                          | client_id · user_email · entity · entity_id · field · previous · next · reason · at                                                                                                                   | somente inserção; sem limite de 100                                     |

Login: usuários ficam na tabela nativa auth.users do Supabase; uma tabela mínima app_users (email · client_id · name) vincula cada e-mail ao cliente. Todos os usuários de um cliente têm exatamente o mesmo acesso.

**4.1 Política de acesso no banco (RLS)**

Uma única regra, sem níveis: usuário autenticado lê e grava apenas as linhas do seu client_id. É o que impede que a chave pública do site dê acesso anônimo e o que isola um cliente do outro no futuro. Configurada uma vez, não aparece na interface.

**5. Fluxo de dados**

**5.1 Carregar**

1.  Após o login, o app faz uma única chamada a uma função do banco (load_workspace) que devolve, em um JSON, tudo do cliente: parâmetros, linhas, executivos, mix, lançamentos, compromissos, ações abertas, snapshots dos últimos 12 meses e notas do exercício.

2.  O app monta o estado em memória no mesmo formato que engine.js já consome hoje. O engine não sabe que existe banco.

3.  Tempo esperado: \< 300 ms para o porte da IT-One.

**5.2 Gravar**

4.  Cada edição grava só a entidade alterada: um lançamento mensal é um upsert de uma linha em management_entries; uma ação é um update de uma linha em actions. Nunca mais o estado inteiro.

5.  Antes de enviar, shared/validate.js valida a entidade; o banco reforça com constraints. Erro de validação bloqueia o campo na tela com a mensagem, e o valor anterior é restaurado — resolve o defeito R4.

6.  Concorrência: cada update envia o updated_at que o app tem; se o banco tiver um mais novo, a gravação é recusada e o app recarrega só aquela entidade e mostra quem alterou. Resolve R1 e R2 sem 409 do estado inteiro.

7.  Autosave com debounce de 350 ms e fila por entidade, como hoje; indicador de status na faixa de contexto.

8.  Sem fallback para localStorage. Se o banco estiver inacessível, o app avisa e bloqueia edição — nunca mais “Salvo neste navegador” com dado que será perdido (R3).

**5.3 Desfazer**

Undo por operação: cada gravação guarda a entidade e o valor anterior; desfazer reenvia o valor anterior como uma nova gravação. Funciona depois do autosave, funciona com dois navegadores abertos e fica registrado no audit.

**5.4 Dois navegadores ao mesmo tempo**

Gerente e diretoria abertos na mesma reunião: o Realtime do Supabase (incluso no gratuito) notifica alterações por tabela; o app atualiza a entidade recebida sem recarregar a tela. Opcional na Onda 1, recomendado na v0.5.

**6. Exportações sem backend**

| **Saída**                           | **Como**                                                                                                                                                                                           | **Biblioteca**                                                                                         |
|-------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| **Excel completo**                  | O app monta as abas (Metas, Ticket & Mix, Gestão Mensal, Trimestres, Compromissos, Ações, Snapshots, Observações, Audit) a partir do estado em memória e do audit_log, e gera o .xlsx no navegador | SheetJS (CDN, ~400 KB, sem instalação)                                                                 |
| **PDF por executivo e consolidado** | Páginas de impressão dedicadas (CSS @media print) com o conteúdo da especificação; o gerente usa “Salvar como PDF” do navegador ou o app dispara a impressão                                       | Nenhuma — recurso nativo do navegador. Alternativa: html2pdf via CDN se for exigido botão “Baixar PDF” |

**7. Limites do plano gratuito e como contorná-los**

| **Limite**                                  | **Situação vigente (set/2026)**                                                                                                 | **Impacto na IT-One**                                                                                 | **Mitigação**                                                                                                                                                                          |
|---------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Pausa por inatividade (Supabase)**        | Projeto gratuito é pausado após 7 dias com pouca atividade; restaura-se pelo painel em minutos, dados preservados por até 1 ano | Reunião semanal costuma manter o projeto ativo, mas férias coletivas ou um mês sem uso pausam o banco | GitHub Actions faz uma consulta leve ao banco todos os dias — mantém ativo sem custo e sem depender de ninguém lembrar                                                                 |
| **Sem backup automático (Supabase Free)**   | Backups diários são recurso do plano pago                                                                                       | Erro humano (apagar executivo) não tem volta                                                          | GitHub Actions semanal exporta todas as tabelas em CSV para um repositório privado gratuito; restauração por importação. Além disso, soft delete (campo active) em executivos e linhas |
| **Repositório público (GitHub Pages Free)** | Pages gratuito exige repositório público; Pages privado exige GitHub Enterprise Cloud                                           | O código fica visível; dados não, porque saem do repositório                                          | Nenhum dado de cliente no código: default-state.json é substituído por um script de seed que grava no banco. Chave pública do Supabase é pública por desenho; a RLS protege os dados   |
| **Tamanho do banco**                        | 500 MB                                                                                                                          | Uso estimado da IT-One em 5 anos: \< 20 MB                                                            | Nenhuma                                                                                                                                                                                |
| **Tráfego**                                 | 5 GB/mês de saída                                                                                                               | Uso estimado: \< 50 MB/mês                                                                            | Nenhuma                                                                                                                                                                                |
| **Usuários de login**                       | 50 mil ativos/mês                                                                                                               | 3 a 10                                                                                                | Nenhuma                                                                                                                                                                                |

*Alternativa se o repositório precisar ser privado: Cloudflare Pages (gratuito, aceita repositório privado do GitHub, deploy automático). O restante da arquitetura não muda. Fica como opção, não como recomendação, para manter a premissa de hospedagem no GitHub.*

**8. Estrutura do repositório**

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p>governanca-comercial/</p>
<p>├── index.html # app (uma página, rotas por hash)</p>
<p>├── app/</p>
<p>│ ├── main.js # bootstrap, login, carregamento</p>
<p>│ ├── store.js # estado em memória + gravação por entidade + undo</p>
<p>│ ├── api.js # chamadas ao Supabase (REST/Realtime)</p>
<p>│ ├── ui/ # um arquivo por área: cockpit, reuniao, executivos, acoes, planejamento, parametros</p>
<p>│ └── export/ # excel.js, pdf.js</p>
<p>├── engine/</p>
<p>│ └── engine.js # motor de cálculo (o atual, estendido)</p>
<p>├── shared/</p>
<p>│ └── validate.js # validação usada pelo app e pelos scripts</p>
<p>├── styles/</p>
<p>├── db/</p>
<p>│ ├── schema.sql # tabelas, constraints, RLS, função load_workspace</p>
<p>│ └── seed/ # scripts de carga inicial por cliente (sem dados no repo)</p>
<p>├── scripts/</p>
<p>│ ├── migrate-v04.mjs # lê state.json da v0.4 e grava no banco</p>
<p>│ └── backup.mjs # exporta tabelas em CSV</p>
<p>├── tests/ # engine (mantidos) + validate + smoke do fluxo</p>
<p>└── .github/workflows/</p>
<p>├── pages.yml # publica o site</p>
<p>├── keepalive.yml # consulta diária ao banco</p>
<p>└── backup.yml # exportação semanal</p></td>
</tr>
</tbody>
</table>

Removidos: server.mjs, dist/, .openai/hosting.json, data/state.json, WebMCP. Zero dependências de build permanece; SheetJS e o cliente Supabase entram via CDN.

**9. Migração da v0.4**

9.  Criar o projeto Supabase e executar db/schema.sql (tabelas, constraints, RLS, função de carga).

10. Rodar scripts/migrate-v04.mjs sobre o state.json atual: converte pesos mensais em percentuais por trimestre (peso ÷ soma do trimestre), fator do piso 1 em 100%, pesos de estágio em probabilidades %, e distribui executivos, lançamentos, compromissos, ações, snapshots e notas nas tabelas.

11. Conferir a reconciliação: o app carregado do banco deve produzir os mesmos números do state.json — teste automatizado compara o modelo do engine antes e depois.

12. Cadastrar os e-mails de acesso (gerente, diretoria, consultor).

13. Publicar pelo GitHub Pages e validar a URL.

14. Ativar keep-alive e backup nas Actions.

**10. Evolução**

| **Quando**                           | **O que muda**                                                                                                                                                    | **Custo**          |
|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|
| **Sair do provisório**               | Supabase Pro: sem pausa, backup diário automático, 8 GB. Nada muda no código                                                                                      | US\$ 25/mês        |
| **Segundo cliente da DNA de Vendas** | Nova linha em clients, seed próprio, e-mails próprios. Mesmo site, mesmo banco, dados isolados por RLS                                                            | Zero               |
| **Repositório privado**              | Trocar GitHub Pages por Cloudflare Pages, ou GitHub Pro (US\$ 4/mês) — Pages continua exigindo repositório público no plano pessoal, então Cloudflare é o caminho | Zero ou US\$ 4/mês |
| **Importar do CRM**                  | Script agendado no GitHub Actions lê o CRM e grava em management_entries. Não exige servidor                                                                      | Zero               |

**11. Riscos e mitigações**

| **Risco**                                       | **Probabilidade**               | **Mitigação**                                                                        |
|-------------------------------------------------|---------------------------------|--------------------------------------------------------------------------------------|
| **Banco pausado no dia da reunião**             | Baixa com keep-alive; média sem | Keep-alive diário; instrução de 1 minuto para reativar pelo painel                   |
| **Perda de dados por erro humano**              | Média                           | Backup semanal em CSV; soft delete; audit com valor anterior; undo por operação      |
| **Chave pública do Supabase exposta no código** | Certa (é por desenho)           | RLS: sem login válido, a chave não lê nem grava nada                                 |
| **Mudança de política do plano gratuito**       | Média ao longo de anos          | Arquitetura padrão Postgres: migra para Neon, Railway ou Supabase Pro sem reescrever |
| **Dependência de CDN para SheetJS**             | Baixa                           | Versão fixada; cópia local no repositório como fallback                              |

**12. Divisão de trabalho na Onda 1**

| **Etapa** | **Quem** | **O que**                                                                                                                             |
|-----------|----------|---------------------------------------------------------------------------------------------------------------------------------------|
| **1**     | Você     | Criar conta no Supabase (gratuita) e um projeto; me passar URL do projeto e chave pública (anon key)                                  |
| **2**     | Eu       | Schema SQL, RLS, função de carga, script de migração, adaptação do app v0.4 para o banco (engine intacto), login, keep-alive e backup |
| **3**     | Você     | Executar o schema no painel do Supabase (copiar e colar) e cadastrar os e-mails de acesso                                             |
| **4**     | Eu       | Migrar o state.json, rodar a reconciliação, publicar no GitHub Pages                                                                  |
| **5**     | Você     | Validar a URL com os dados da IT-One                                                                                                  |
| **6**     | Eu       | Iniciar a v0.5 sobre a base publicada, conforme a especificação                                                                       |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Resultado da Onda 1</strong></p>
<p>URL fixa com HTTPS · login único · dados em banco com backup semanal · sem servidor para manter · custo zero · engine idêntico ao validado contra a planilha · defeitos R1 a R5 eliminados pela mudança de persistência · base pronta para a v0.5 e para o segundo cliente.</p></td>
</tr>
</tbody>
</table>
