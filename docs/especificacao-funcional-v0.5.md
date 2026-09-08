**DNA DE VENDAS · INSTRUMENTO DE GOVERNANÇA COMERCIAL**

**Governança Comercial**

Especificação Funcional — Versão 0.5

Primeira aplicação: IT-One — Gerência Comercial

Evolução do app v0.4 com base no propósito definido, na planilha original e na análise de gap

| **Item**        | **Conteúdo**                                                                                                                                                                                                   |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Documento**   | Especificação funcional para validação — não é especificação técnica nem de layout final                                                                                                                       |
| **Versão-alvo** | v0.5 (Ondas 2 e 3 do roteiro de evolução) — Onda 1 (hospedagem, autenticação, persistência) é pré-requisito técnico e está referenciada na seção 10                                                            |
| **Base**        | App v0.4 (código analisado e executado) · Planilha “Painel de Governança Comercial — Corrigida QA01/QA02” (8 abas, 16 mil fórmulas, reconciliação 100%) · Propósito e respostas às 10 perguntas de refinamento |
| **Status**      | Versão consolidada — pendências decididas (seção 13); parametrização em percentual (seção 2.1)                                                                                                                 |
| **Data**        | Setembro de 2026                                                                                                                                                                                               |

**Sumário**

**1.** Objetivo e escopo da v0.5

**2.** Princípios de design executivo

**3.** Arquitetura de informação

**4.** Especificação por área — Cockpit · Reunião · Executivos · Ações & Compromissos · Planejamento · Parâmetros

**5.** Glossário unificado de indicadores

**6.** Regras de cálculo novas

**7.** Semáforos e alertas

**8.** Exportações — PDF e Excel

**9.** Experiência visual — sofisticação e modernidade

**10.** Papéis e governança

**11.** Parametrização multi-cliente

**12.** Rastreabilidade — lacunas → especificação

**13.** Decisões tomadas

**A.** Anexo — Roteiro da reunião × etapas do app

**B.** Anexo — Modelo de dados: campos novos

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Como ler este documento</strong></p>
<p>As seções 1 a 4 definem o que o app passa a ser e como o gerente o usa. As seções 5 a 8 definem indicadores, regras e saídas — é o material de referência para implementação. As seções 9 a 11 tratam de experiência, governança e reaplicação. A seção 13 registra as decisões tomadas sobre os pontos que estavam em aberto.</p>
<p>Convenção: (E) = indicador já existente no motor de cálculo; (N) = cálculo novo especificado na seção 6.</p></td>
</tr>
</tbody>
</table>

**1. Objetivo e escopo da v0.5**

A v0.5 transforma o app de uma calculadora fiel à planilha em um instrumento de condução da reunião comercial. O motor de cálculo permanece o mesmo — a reconciliação com a planilha foi de 100% em todos os indicadores testados — e o trabalho concentra-se em quatro frentes: completar a lógica temporal (mês → trimestre → ano), conduzir o roteiro da reunião como um fluxo único, dar vida às ações e compromissos entre reuniões e entregar as saídas exigidas (PDF de cenário e plano, Excel completo).

**O que a v0.5 entrega**

- Visão trimestral completa, com tendência e capacidade de recuperação, no Cockpit e na Reunião.

- Reunião como fluxo guiado em 6 etapas, cobrindo os 10 passos definidos sem sair da tela.

- Ações e compromissos com ciclo de vida próprio: backlog vivo, atraso visível, ritmo semanal de prospecção.

- Glossário único de indicadores, com três conceitos de gap no lugar de sete.

- Semáforos de dupla leitura (resultado e funil) e alertas parametrizáveis.

- Perfil comercial por executivo (Hunter, Farmer, End-to-End) alimentando o Plano M+3.

- Meta em R\$ e vendas necessárias por linha de negócio, como na planilha.

- Exportação em PDF (cenário atual e plano de ação) e em Excel (todos os dados).

- Modo Apresentação para uso na frente dos executivos, e experiência visual de command center.

**O que a v0.5 não entrega**

- Importação de dados do CRM próprio da IT-One (Onda 4).

- Lista de oportunidades individuais — decisão de escopo: leitura executiva, detalhe fica no CRM.

- Múltiplos gerentes na mesma base e consolidação entre gerências (Onda 4).

- Notificações por e-mail e integrações externas.

**2. Princípios de design executivo**

Sete princípios orientam todas as decisões de tela, indicador e interação. Servem como critério de aceite: se um elemento não respeita um princípio, ele não entra.

| **\#** | **Princípio**                     | **O que significa na prática**                                                                                                                                                                                                                                               |
|--------|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1**  | Decisão antes do dado             | Cada tela abre com a resposta (situação, semáforo, próxima ação) e só depois mostra o número que a sustenta. Tabelas ficam abaixo dos cards de decisão, nunca acima.                                                                                                         |
| **2**  | Três horizontes sempre visíveis   | Mês, trimestre e ano aparecem juntos em uma faixa de trajetória persistente. O gerente nunca precisa mudar de tela para saber se o mês compromete o trimestre ou o ano.                                                                                                      |
| **3**  | Uma pergunta por bloco            | Cada bloco responde a uma única pergunta do roteiro (“qual o desvio?”, “o funil cobre?”, “quanto prospectar?”). O título do bloco é a pergunta, não o nome do indicador.                                                                                                     |
| **4**  | Reunião como fluxo, não como menu | O roteiro de 10 passos vira 6 etapas sequenciais com progresso visível. Plano M+3, compromissos e ações ficam dentro do fluxo.                                                                                                                                               |
| **5**  | Nada se perde na virada do mês    | Ações, compromissos e snapshots pertencem ao executivo e à reunião de origem, não ao mês selecionado. O que está aberto continua aparecendo.                                                                                                                                 |
| **6**  | Uma palavra por conceito          | Glossário único. Cada indicador tem um nome, uma fórmula e um lugar. Sinônimos são eliminados da interface.                                                                                                                                                                  |
| **7**  | Pronto para projetar              | Tudo o que aparece na reunião deve ser legível a 3 metros: números abreviados (R\$ mil / mi), contraste alto, Modo Apresentação sem menus.                                                                                                                                   |
| **8**  | Percentuais, não pesos            | Nenhuma parametrização usa pesos ou fatores (1; 0,5; 0). Tudo o que o usuário escolhe é expresso em percentual. Onde as escolhas precisam fechar um período, a tela mostra a soma ao vivo e sinaliza “Fecha 100%” ou “Faltam X p.p.”, com ação de completar automaticamente. |

**2.1 Regra de ponderação em percentual**

A regra vale para toda escolha do usuário que distribui um total. Cada grupo tem uma soma obrigatória, um indicador visual de fechamento e uma ação de correção.

| **Grupo**                     | **Onde**                           | **O que o usuário escolhe**                                                                                             | **Deve fechar**                                | **Substitui na v0.4 / planilha**        |
|-------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|-----------------------------------------|
| **Sazonalidade trimestral**   | Planejamento · Metas               | % da meta anual em T1, T2, T3 e T4                                                                                      | 100% no ano                                    | Já era % (mantido)                      |
| **Distribuição mensal**       | Planejamento · Distribuição mensal | % da meta do trimestre em cada um dos 3 meses. Férias ou ausência = percentual menor no mês, compensado nos outros dois | 100% em cada trimestre                         | Pesos 1 / 0,5 / 0 normalizados por soma |
| **Mix de vendas**             | Planejamento · Mix                 | % da meta por linha de negócio                                                                                          | 100% por executivo                             | Já era % (mantido)                      |
| **Ciclo comercial**           | Parâmetros                         | % da receita nova que entra em M+2, M+3 e M+4                                                                           | 100%                                           | Já era % (mantido)                      |
| **Mínimo de prospecção**      | Parâmetros                         | % das vendas necessárias do mês que o piso garante                                                                      | Não fecha — é um nível (padrão 100%)           | Fator do piso = 1                       |
| **Materialidade**             | Parâmetros                         | % do ticket planejado abaixo do qual o plano não é acionado                                                             | Não fecha — é um nível (padrão 50%)            | Já era %                                |
| **Probabilidade por estágio** | Parâmetros                         | % de fechamento esperado de Pipeline, Strong e Commit                                                                   | Não fecha — são probabilidades (20 / 50 / 90%) | Pesos 0,2 / 0,5 / 0,9                   |
| **Semáforos**                 | Parâmetros                         | Limites em % (resultado, cobertura do funil, recuperação, prospecção)                                                   | Não fecha — são limites                        | Múltiplos “x” e índices decimais        |

Comportamento da tela: ao lado de cada grupo que deve fechar, uma barra de soma ao vivo (verde em 100%, âmbar fora), o texto “Fecha 100%” ou “Faltam 12 p.p. em T3”, e o botão “Completar” que ajusta proporcionalmente o que falta nos itens não travados pelo usuário. Salvar fica bloqueado enquanto algum grupo não fechar.

**3. Arquitetura de informação**

A navegação atual tem 8 telas organizadas por tipo de dado. A nova navegação tem 6 áreas organizadas por momento de uso do gerente: acompanhar, conduzir, cobrar, planejar, configurar e distribuir.

**3.1 Mapa de navegação — de 8 telas para 6 áreas**

| **Área nova**            | **Momento de uso**                                           | **Absorve da v0.4**                                   | **Novo na v0.5**                                                                                                                                                  |
|--------------------------|--------------------------------------------------------------|-------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Cockpit**              | Acompanhar — antes e depois da reunião; leitura da diretoria | Dashboard Gerencial                                   | Faixa de trajetória mês/tri/ano · Visão Trimestral · gráficos Compromisso × Realizado · alertas priorizados · semáforo duplo                                      |
| **Reunião**              | Conduzir — durante a reunião, na frente do executivo         | Modo Reunião + Gestão Mensal + Planos e Ações (parte) | Fluxo guiado em 6 etapas · bloco trimestral do executivo · plano M+3 e compromissos dentro do fluxo · ritmo semanal · comparação de snapshots · Modo Apresentação |
| **Executivos**           | Analisar — comparar e aprofundar                             | Visão da Equipe                                       | Painel individual com 4 blocos (incl. Carteira & Forecast) · série de snapshots · histórico 24 meses · meta por linha                                             |
| **Ações & Compromissos** | Cobrar — entre reuniões                                      | Ações (dispersas por mês)                             | Backlog vivo cruzando meses · atraso · filtros · compromissos mensais × realizado × ritmo semanal                                                                 |
| **Planejamento**         | Planejar — início de exercício e revisões                    | Metas + Ticket & Mix                                  | Meta trimestral e distribuição mensal em % · perfil por executivo · meta R\$ e vendas por linha · justificativa de ajuste                                         |
| **Parâmetros**           | Configurar — administrador                                   | Parâmetros                                            | Critérios mínimos por estágio e autorização · limites de semáforo em % · capacidade por perfil                                                                    |
| **Exportar**             | Distribuir — fechamento da reunião e arquivamento            | —                                                     | PDF de cenário e plano · Excel completo                                                                                                                           |

*Exportar não é uma área de navegação própria: é uma ação disponível no Cockpit, na Reunião e no painel do Executivo. Aparece na tabela para deixar explícito o que é gerado e de onde.*

**3.2 Faixa de contexto e barra de trajetória**

Dois elementos persistem em todas as áreas, no topo da tela:

| **Elemento**            | **Conteúdo**                                                                                                                                        | **Regra**                                                                                                                                                                                |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Faixa de contexto**   | Exercício · Mês de referência · Semana da reunião (S1–S4) · Executivo selecionado (ou Consolidado) · status de salvamento · botão Modo Apresentação | Mês e executivo trocam por seletor. Semana (1 a 4) é derivada da data atual e pode ser ajustada manualmente. Trocar o executivo não altera a área; trocar a área não altera o executivo. |
| **Barra de trajetória** | Três cápsulas lado a lado — MÊS · TRIMESTRE · ANO — cada uma com: meta, realizado, forecast, falta a vender, falta projetada e semáforo duplo       | Sempre calculada para o executivo selecionado (ou consolidado). Clicar em uma cápsula leva ao bloco correspondente no Cockpit. É a materialização do princípio 2.                        |

**4. Especificação por área**

Para cada área: a pergunta que ela responde, os blocos na ordem em que aparecem, os indicadores com origem no motor de cálculo, as interações e os estados. A referência (E) indica indicador que já existe no engine; (N) indica cálculo novo, detalhado na seção 6.

**4.1 Cockpit**

**Pergunta:** a operação está na trajetória do mês, do trimestre e do ano — e quem precisa de atenção primeiro?

| **\#** | **Bloco**                 | **Conteúdo**                                                                                                                                                                                                                                       | **Origem**         |
|--------|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|
| **1**  | Barra de trajetória       | Mês · Trimestre · Ano com meta, realizado, forecast, falta e semáforo                                                                                                                                                                              | E + N (trimestre)  |
| **2**  | Alertas priorizados       | Até 5 alertas ordenados por severidade: executivos críticos, funil insuficiente, compromissos abaixo do ritmo, ações atrasadas, lançamentos inconsistentes. Cada alerta é clicável e leva ao contexto.                                             | N (regras seção 7) |
| **3**  | Burn-up comercial         | Meta acumulada × Won acumulado × Forecast projetado, 12 meses, com marcação do mês atual e área de forecast. Alternância Ano / Trimestre corrente. Peça central do Cockpit: ocupa a largura total.                                                 | E                  |
| **4**  | Visão Trimestral          | Tabela T1–T4 + Ano: Meta · Won · Forecast · Falta a vender · Falta projetada · Ating. % · Recuperação % · semáforo. Barras Meta × Won × Forecast por trimestre (gráfico 7 da planilha). Trimestre corrente destacado.                              | N                  |
| **5**  | Ranking da equipe         | Quatro barras horizontais ordenadas: Atingimento acumulado · Falta projetada · Cobertura anual do funil · Cobertura da carteira                                                                                                                    | E                  |
| **6**  | Execução do mês           | Duas barras por executivo: Prospects compromisso × realizado · Oportunidades compromisso × realizado, com linha de ritmo esperado para a semana atual (gráficos 5 e 6 da planilha)                                                                 | E + N (ritmo)      |
| **7**  | Diagnóstico por executivo | Tabela: Situação (semáforo duplo: resultado + funil) · Meta acum. · Won acum. · Ating. · Forecast · Falta projetada · Cobertura do funil % · Cobertura carteira · Ating. prospects · Ating. oportunidades · Última revisão · botão “Abrir reunião” | E                  |

**Interações:**

- Seletor de executivo na faixa de contexto filtra todos os blocos; consolidado é o padrão.

- Clique em qualquer executivo (ranking, execução ou diagnóstico) abre a Reunião já posicionada nele.

- Exportar: PDF do cenário consolidado; Excel completo.

**4.2 Reunião — fluxo guiado**

**Pergunta:** o que este executivo precisa decidir e se comprometer hoje?

A Reunião substitui o Modo Reunião, a Gestão Mensal e a parte operacional de Planos e Ações. É um fluxo de 6 etapas por executivo, com um stepper no topo mostrando progresso, navegação anterior/próximo e passagem direta ao próximo executivo ao concluir. Cada etapa responde a um conjunto de passos do roteiro original.

| **Etapa**                        | **Passos do roteiro** | **Pergunta da etapa**                                                            | **Blocos e conteúdo**                                                                                                                                                                                                                                                                                                                                                                                                 |
|----------------------------------|-----------------------|----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1 · Situação**                 | 1, 2                  | Onde o executivo está no mês — e o que isso faz com o trimestre e o ano?         | Cabeçalho com semáforo duplo e nome · Cápsulas Mês / Trimestre / Ano do executivo · Falta a vender (meta − won) · Falta a cobrir (meta − cobertura c/ carry) · Última revisão · Comparação com o snapshot anterior (Δ falta a cobrir, Δ forecast, Δ funil)                                                                                                                                                            |
| **2 · Funil e forecast**         | 5, 6                  | O funil ponderado sustenta a meta?                                               | Editor: Pipeline · Strong · Commit · Won R\$ · Won qtd · Lost R\$ · Lost qtd · Contas ativas · Ajuste gerencial (com motivo obrigatório) · Resultado calculado ao lado: funil aberto, funil ponderado, cobertura c/ carry, falta a cobrir, cobertura do funil em % com semáforo · Consistência · Critério mínimo de cada estágio exibido como ajuda (o que pode ser chamado de Strong / Commit e quem autoriza)       |
| **3 · Trimestre e trajetória**   | 3, 4                  | O desvio é recuperável dentro do trimestre? A trajetória anual se sustenta?      | Trimestre corrente: meta, won, forecast, falta a vender, ating. · Mês a mês do trimestre com % de distribuição aplicado (indisponibilidade) · Ritmo necessário nos meses restantes · Recuperação do trimestre em % com classificação · Ano: forecast do exercício, falta projetada, cobertura anual do funil · Mini burn-up do executivo                                                                              |
| **4 · Plano M+3 e compromissos** | 7, 9                  | Quanto precisa gerar de oportunidades e prospects — e qual o compromisso do mês? | Engenharia reversa em cadeia visual: Falta projetada M+3 + Falta a cobrir do mês → Receita nova necessária → Vendas → Oportunidades (÷ win rate do perfil) → Prospects (÷ conversão do perfil) · Piso, capacidade e recomendação · Compromisso pactuado do mês (prospects e oportunidades) · Realizado no mês · Ritmo esperado para a semana atual e por semana · Semáforo de prospecção · Viabilidade (≤ capacidade) |
| **5 · Decisões e ações**         | 8                     | O que fica combinado, com quem e para quando?                                    | Observações da reunião (texto) · Ações abertas deste executivo, de qualquer mês, com atraso destacado · Nova ação: descrição, responsável, prazo, prioridade, status · Ações concluídas na reunião são marcadas aqui                                                                                                                                                                                                  |
| **6 · Fechamento**               | 10                    | Qual a posição congelada desta reunião?                                          | Resumo da etapa 1 à 5 em uma página · Registrar snapshot (posição completa, incluindo forecast, compromissos e ações abertas) · Exportar PDF do executivo · Próximo executivo / Encerrar reunião                                                                                                                                                                                                                      |

**Regras do fluxo:**

- O stepper mostra as 6 etapas e marca as concluídas; o gerente pode voltar a qualquer etapa. A etapa 6 só habilita “Registrar snapshot” se a etapa 2 foi visitada (garante dado revisado antes de congelar).

- Todo dado editado é salvo automaticamente com controle de revisão; o status aparece na faixa de contexto.

- Modo Apresentação (tecla F): oculta menu lateral e faixa de contexto, aumenta a escala tipográfica, mantém apenas stepper e conteúdo, entra em tema escuro por padrão. Navegação por setas do teclado.

- Ordem dos executivos: do mais crítico ao menos crítico (semáforo duplo), recalculada a cada reunião; o gerente pode reordenar manualmente na sessão.

- Ao encerrar a reunião (último executivo), o app gera automaticamente o PDF consolidado da reunião e o deixa disponível em Exportar; o PDF por executivo é gerado sob demanda na etapa 6.

**4.3 Executivos**

**Pergunta:** como cada executivo se compara aos demais — e o que está por trás dos números de um deles?

| **\#** | **Bloco**                                     | **Conteúdo**                                                                                                                                                                                                   |
|--------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1**  | Comparativo da equipe                         | Tabela igual ao Diagnóstico do Cockpit, com colunas adicionais: Falta a cobrir do mês, Perfil, Meta trimestral e Ating. trimestral. Ordenável por qualquer coluna.                                             |
| **2**  | Painel do executivo — 1 · Situação do mês     | Meta oficial · Carry recebido · Ajuste gerencial (com motivo) · Objetivo gerencial · Won do mês · Falta a vender                                                                                               |
| **3**  | Painel do executivo — 2 · Cobertura e gap     | Funil em aberto · Funil ponderado · Cobertura c/ carry · Falta a cobrir · Cobertura do funil %                                                                                                                 |
| **4**  | Painel do executivo — 3 · Diagnóstico         | Win rate · Ticket realizado × planejado · Ating. de vendas (qtd) · Ating. de prospecção                                                                                                                        |
| **5**  | Painel do executivo — 4 · Carteira e forecast | Cobertura da carteira · Contas ativas × total · Forecast de referência (meta coberta) · Realização do forecast (won ÷ forecast) — bloco presente na planilha e ausente no app v0.4                             |
| **6**  | Meta por linha de negócio                     | Para o executivo: linha · mix % · meta R\$ · ticket da linha · vendas necessárias (qtd) — como em Ticket & Mix da planilha. Somente planejado; realizado por linha fica fora do escopo por o Won ser agregado. |
| **7**  | Série de snapshots                            | Gráfico de linhas com falta a cobrir, forecast e funil ponderado ao longo dos snapshots do trimestre; tabela com data, mês, valores e Δ vs. anterior                                                           |
| **8**  | Histórico 24 meses                            | Tabela completa (como a Gestão Mensal atual), com filtro de ano e exportação                                                                                                                                   |

**4.4 Ações & Compromissos**

**Pergunta:** o que foi combinado, o que está atrasado e quem está fora do ritmo?

| **\#** | **Bloco**           | **Conteúdo**                                                                                                                                                                                                                                                                            |
|--------|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1**  | Resumo              | Cards: ações abertas · atrasadas · concluídas no mês · executivos abaixo do ritmo de prospecção                                                                                                                                                                                         |
| **2**  | Backlog de ações    | Lista com filtros por executivo, status, prioridade e atraso. Colunas: executivo · descrição · responsável · prazo · prioridade · status · reunião de origem (mês/semana) · dias de atraso. Edição inline; conclusão registra data. Ações não desaparecem ao mudar o mês de referência. |
| **3**  | Compromissos do mês | Por executivo: compromisso de prospects e oportunidades · realizado · ritmo esperado na semana atual · ating. · semáforo de prospecção · viabilidade vs. capacidade. Edição inline dos quatro campos de entrada.                                                                        |
| **4**  | Ritmo semanal       | Para o executivo selecionado: compromisso ÷ 4 = meta semanal (25% por semana); barras S1–S4 com realizado acumulado × esperado acumulado. Responde à pergunta “quantas prospecções por semana”.                                                                                         |

**4.5 Planejamento (administrativo)**

**Pergunta:** as metas, a sazonalidade, o mix e os perfis estão corretos para o exercício?

| **\#** | **Bloco**           | **Conteúdo**                                                                                                                                                                                                                                                                                                                                                    |
|--------|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1**  | Executivos e metas  | ID · nome · perfil (Hunter / Farmer / End-to-End) · vigência (mês inicial/final) · meta do exercício · % T1–T4 com barra “Fecha 100%” · total de contas. Meta trimestral em R\$ calculada e exibida (M–P da planilha).                                                                                                                                          |
| **2**  | Distribuição mensal | Grade 12 meses por executivo, em % da meta do trimestre (padrão 33 / 33 / 34). Férias ou ausência: percentual menor no mês, compensado nos outros dois; barra de soma por trimestre com “Fecha 100%” e botão Completar. Meta mensal resultante em R\$ exibida ao lado. Ano+1 provisório zerado quando a vigência termina antes de dezembro (regra da planilha). |
| **3**  | Linhas de negócio   | ID · nome · ticket médio · validação                                                                                                                                                                                                                                                                                                                            |
| **4**  | Mix por executivo   | Mix % por linha com barra “Fecha 100%” · meta R\$ por linha · vendas necessárias por linha · ticket médio planejado · vendas necessárias no ano                                                                                                                                                                                                                 |
| **5**  | Proteção            | Edição habilitada apenas para o papel Administrador (seção 10). Toda alteração exige motivo e é registrada no audit.                                                                                                                                                                                                                                            |

**4.6 Parâmetros (administrativo)**

| **Grupo**                | **Parâmetros**                                                                                                                                                           | **Mudança em relação à v0.4**                                                                                                                 |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **Taxas por perfil**     | Prospecção → Qualificação e Win Rate para Hunter, Farmer e End-to-End; capacidade mensal de prospects e oportunidades por perfil                                         | Deixa de existir “perfil ativo” global; cada executivo aponta seu perfil. Capacidade passa a ser por perfil (Hunter tende a prospectar mais). |
| **Estágios de forecast** | Probabilidade de fechamento: Pipeline 20% · Strong 50% · Commit 90% — com critério mínimo obrigatório e quem autoriza (Executivo / Gerente), como na seção 3 da planilha | Passa a ser apresentado como probabilidade em %, não como peso. Critério e autorização exibidos na etapa 2 da Reunião como ajuda contextual.  |
| **Ciclo comercial**      | % da receita nova em M+2 · M+3 · M+4 (fecha 100%, M+3 \> 0)                                                                                                              | Sem mudança de lógica; ganha barra de soma                                                                                                    |
| **Piso e materialidade** | Aplicar mínimo de prospecção (sim/não) · mínimo em % das vendas necessárias do mês (padrão 100%) · materialidade em % do ticket planejado (padrão 50%)                   | “Fator do piso = 1” vira “100%”. Capacidade migra para o grupo de perfis                                                                      |
| **Horizonte**            | Meses do exercício                                                                                                                                                       | Sem mudança                                                                                                                                   |
| **Semáforos**            | Limites em %: atingimento (100% / 80%) · cobertura do funil (300% / 150%) · recuperação do trimestre (100% / 70%) · prospecção (100% / 80%)                              | Novo — ver seção 7                                                                                                                            |
| **Calendário**           | 4 semanas por mês (fixo na v0.5) · semana da reunião derivada da data, ajustável                                                                                         | Novo                                                                                                                                          |
| **Identidade**           | Nome do cliente · gerente · logotipo · moeda                                                                                                                             | Novo — parametrização multi-cliente (seção 12)                                                                                                |

**5. Glossário unificado de indicadores**

A v0.4 usa sete nomes para variações de “gap”. A v0.5 adota três conceitos, cada um com nome, pergunta e fórmula únicos, mantendo a palavra “Falta” que a planilha já usa e o gerente já reconhece. Os nomes antigos permanecem no Excel exportado, para rastreabilidade, mas saem da interface.

| **Conceito v0.5**   | **Pergunta que responde**                                                       | **Fórmula**                                                                                          | **Substitui (v0.4 / planilha)**                                                                               |
|---------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| **Falta a vender**  | Quanto ainda falta vender em relação à meta?                                    | máx(0, meta − won) — mês, trimestre ou ano                                                           | Falta vender no mês · Falta fechar em caixa · Desvio                                                          |
| **Falta a cobrir**  | Quanto da meta o funil ponderado ainda não cobre?                               | máx(0, meta − (won + funil ponderado + carry))                                                       | Gap com cobertura · Falta p/ meta c/ cobertura · Gap oficial (quando sem carry) · Déficit do mês · Descoberto |
| **Falta projetada** | Se tudo o que está em Strong e Commit fechar como previsto, quanto ainda falta? | máx(0, meta − forecast), onde forecast = won + Σ(strong × 50% + commit × 90%) dos meses ≥ referência | Falta projetada · Gap projetado · Falta base M+3 (quando aplicado ao M+3)                                     |

Casos com ajuste gerencial: o Objetivo gerencial (meta + ajuste, com motivo) substitui a meta nas três fórmulas quando o gerente optar por “ver com ajuste”; a interface exibe um selo “com ajuste” para deixar a base explícita. Isso elimina a mistura de bases que a planilha tem entre Falta Projetada (meta) e Múltiplo (objetivo).

**5.1 Demais indicadores — nome único**

| **Indicador**                    | **Fórmula**                                                                              | **Onde aparece**                           |
|----------------------------------|------------------------------------------------------------------------------------------|--------------------------------------------|
| **Funil em aberto**              | pipeline + strong + commit                                                               | Reunião 2 · Executivos                     |
| **Funil ponderado**              | pipeline × 20% + strong × 50% + commit × 90%                                             | Reunião 2 · Executivos                     |
| **Cobertura**                    | won + funil ponderado + carry recebido                                                   | Reunião 1 e 2                              |
| **Carry recebido**               | excedente do mês anterior (zera em janeiro)                                              | Reunião 1 · Executivos                     |
| **Forecast**                     | won do período + Σ(strong × 50% + commit × 90%) dos meses ≥ referência dentro do período | Barra de trajetória · Cockpit · Reunião 3  |
| **Atingimento**                  | won ÷ meta do período                                                                    | Barra de trajetória · Cockpit · Reunião 1  |
| **Cobertura do funil (mês)**     | funil em aberto ÷ falta a vender do mês, em % (300% = 3 vezes a falta)                   | Reunião 2 · Executivos                     |
| **Cobertura anual do funil**     | funil em aberto (≥ ref) ÷ saldo para a meta do ano                                       | Cockpit · Executivos                       |
| **Cobertura da carteira**        | contas ativas no mês ÷ total de contas                                                   | Cockpit · Executivos                       |
| **Win rate**                     | won qtd ÷ (won qtd + lost qtd)                                                           | Executivos                                 |
| **Ticket realizado / planejado** | won R\$ ÷ won qtd · meta ÷ vendas necessárias (via mix)                                  | Executivos                                 |
| **Vendas necessárias**           | meta do período ÷ ticket planejado                                                       | Reunião 4 · Planejamento                   |
| **Ritmo necessário (N)**         | (meta do trimestre − won do trimestre) ÷ meses restantes do trimestre, incluindo o atual | Reunião 3 · Cockpit                        |
| **Recuperação do trimestre (N)** | forecast restante do trimestre ÷ falta a vender do trimestre, em %                       | Reunião 3 · Cockpit                        |
| **Ritmo esperado (N)**           | compromisso do mês × semana atual ÷ 4                                                    | Reunião 4 · Ações & Compromissos           |
| **Ating. de prospecção**         | realizado ÷ compromisso (mês) · realizado ÷ ritmo esperado (semana)                      | Reunião 4 · Cockpit · Ações & Compromissos |

**6. Regras de cálculo novas**

Todas as regras abaixo usam apenas dados que já existem no modelo. Nenhuma exige campo novo de lançamento, exceto onde indicado.

**6.1 Visão trimestral**

- Trimestre fixo de calendário: T1 = jan–mar, T2 = abr–jun, T3 = jul–set, T4 = out–dez, no exercício selecionado.

- Meta do trimestre = meta anual × % do trimestre. Meta mensal = meta do trimestre × % do mês (distribuição mensal que fecha 100% por trimestre; férias e ausências já embutidas).

- Won, funil ponderado e forecast do trimestre = somas dos meses; forecast usa apenas meses ≥ mês de referência para a parcela de Strong e Commit, como no Dashboard da planilha (linhas 92–96). Falta a vender do trimestre = máx(0, meta_T − won_T).

- Falta projetada do trimestre = máx(0, meta_T − forecast_T). Atingimento_T = won_T ÷ meta_T.

- Carry e ações cruzam trimestres sem restrição — decisão registrada nas respostas de refinamento.

- Validado: para agosto/2026 consolidado, T3 = meta 1.750.000 · won 233.600 · forecast 1.534.150 · falta 215.850, idêntico à planilha.

**6.2 Ritmo necessário e índice de recuperação**

- Meses restantes = meses do trimestre com número ≥ mês de referência (o mês atual conta).

- Ritmo necessário = (meta_T − won_T) ÷ meses restantes. Mostra a venda mensal que fecha o trimestre.

- Recuperação do trimestre = forecast restante ÷ falta a vender do trimestre, em %, onde forecast restante = Σ(strong × 50% + commit × 90%) dos meses restantes. ≥ 100%: recuperação coberta pelo funil; 70% a 100%: exigente; \< 70%: improvável sem geração nova (limites parametrizáveis).

- Referência de capacidade: o maior won mensal do executivo no exercício é exibido ao lado do ritmo necessário (“ritmo necessário = 1,4× o seu melhor mês”).

**6.3 Semana da reunião e ritmo de prospecção**

- Semanas do mês: 4, fixas. Simplifica a leitura (“25% do compromisso por semana”) e evita meses com 5 semanas de ritmo irregular; revisão possível em versão futura.

- Semana atual = mín(4, teto(dia do mês ÷ 7)), derivada da data; ajustável na faixa de contexto.

- Meta semanal = compromisso do mês ÷ 4 (25% por semana). Ritmo esperado acumulado = 25% × semana atual.

- Ating. semanal = realizado acumulado ÷ ritmo esperado acumulado. Alimenta o semáforo de prospecção.

- Não exige campo novo: usa compromisso e realizado mensais já existentes. O realizado do mês é atualizado a cada reunião e comparado ao ritmo esperado da semana; registro por semana fica para versão futura.

**6.4 Perfil por executivo**

- Campo novo em Executivo: perfil ∈ {Hunter, Farmer, End-to-End}. Padrão: End-to-End.

- Plano M+3, piso e recomendação usam as taxas e a capacidade do perfil do executivo. Deixa de existir p_PerfilAtivo global. Capacidade inicial igual para os três perfis (150 prospects / 35 oportunidades), a calibrar com o histórico da IT-One.

- Migração: todos os executivos atuais recebem End-to-End; taxas iguais às atuais até calibração.

**6.5 Meta por linha de negócio**

- meta_linha = meta do exercício × mix % da linha; vendas_linha = meta_linha ÷ ticket da linha; vendas necessárias no ano = Σ vendas_linha; ticket planejado = meta ÷ vendas necessárias (idêntico ao engine atual).

- Exibição somente do planejado (Executivos, bloco 6; Planejamento, bloco 4). Realizado por linha fica fora do escopo por o Won ser agregado.

**6.6 Ajuste gerencial com motivo**

- Campo novo em lançamento mensal: motivo do ajuste (texto, obrigatório quando ajuste ≠ 0).

- Motivo aparece no painel do executivo, no PDF e no audit.

**6.7 Ações com ciclo de vida**

- Campos: id · executivo · descrição · responsável · prazo · prioridade · status · reunião de origem (mês, semana, data) · criada em · concluída em.

- Atraso = prazo \< hoje e status ≠ Concluída. Dias de atraso exibidos.

- Listagem por executivo mostra todas as ações não concluídas, de qualquer mês, mais as concluídas no mês de referência.

- Migração: ações existentes recebem reunião de origem = seu mês atual.

**6.8 Snapshots como série**

- Snapshot registra: data · mês · semana · falta a vender · falta a cobrir · forecast · funil ponderado · funil em aberto · compromissos e realizado · nº de ações abertas.

- Comparação padrão: com o snapshot anterior do mesmo executivo (qualquer mês). Série exibida por trimestre.

**7. Semáforos e alertas**

**7.1 Semáforo duplo**

Cada executivo passa a ter duas leituras independentes, exibidas juntas como dois pontos coloridos. A leitura de resultado responde “vendeu?”; a de funil responde “vai vender?”. Um executivo verde em resultado e vermelho em funil é o caso clássico de risco oculto que a v0.4 não sinaliza.

| **Leitura**    | **Base**                                                                                                            | **Verde**       | **Amarelo**              | **Vermelho**     |
|----------------|---------------------------------------------------------------------------------------------------------------------|-----------------|--------------------------|------------------|
| **Resultado**  | Atingimento acumulado (mês / trimestre / ano, conforme a cápsula)                                                   | ≥ 100%          | 80% a 100%               | \< 80%           |
| **Funil**      | Cobertura do funil no mês (funil em aberto ÷ falta a vender) — ou Recuperação do trimestre, na cápsula de trimestre | ≥ 300% · ≥ 100% | 150% a 300% · 70% a 100% | \< 150% · \< 70% |
| **Prospecção** | Ating. semanal (realizado ÷ ritmo esperado)                                                                         | ≥ 100%          | 80% a 100%               | \< 80%           |

*Todos os limites são percentuais e parametrizáveis. A faixa de resultado mantém a regra da planilha. Cobertura de 300% equivale ao que o mercado chama de “3x de pipeline”; a interface mostra só o percentual.*

**7.2 Alertas do Cockpit**

| **Prioridade** | **Regra**                                                     | **Texto e destino**                                                         |
|----------------|---------------------------------------------------------------|-----------------------------------------------------------------------------|
| **1**          | Executivo com resultado vermelho e funil vermelho             | “{nome}: crítico em resultado e funil” → Reunião, etapa 1                   |
| **2**          | Recuperação do trimestre \< 70% (consolidado ou executivo)    | “T{n}: recuperação improvável sem geração nova” → Cockpit, Visão Trimestral |
| **3**          | Ating. semanal de prospecção \< 80%                           | “{nome}: prospecção abaixo do ritmo (S{n})” → Reunião, etapa 4              |
| **4**          | Ações atrasadas                                               | “{n} ações atrasadas” → Ações & Compromissos                                |
| **5**          | Lançamentos inconsistentes ou compromisso acima da capacidade | “{n} lançamentos a revisar” → Executivos, histórico                         |
| **6**          | Período selecionado ≠ mês atual                               | “Período histórico: {mês} de {ano}” (informativo)                           |

**8. Exportações**

**8.1 PDF — Cenário atual e plano de ação**

Dois formatos, gerados a partir do estado atual e do snapshot mais recente. Layout em A4 retrato, identidade do cliente no cabeçalho, data e hora, mês e semana de referência.

| **Formato**                | **Páginas** | **Conteúdo**                                                                                                                                                                                                                                                                                                                                                                          |
|----------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Por executivo**          | 3–4         | 1\. Situação: semáforo duplo, cápsulas mês / trimestre / ano, desvio, descoberto, comparação com snapshot anterior. 2. Funil e trajetória: funil por estágio, forecast, visão do trimestre, mini burn-up. 3. Plano M+3 e compromissos: cadeia da engenharia reversa, compromisso × realizado × ritmo. 4. Decisões e ações: observações, ações abertas e novas, responsáveis e prazos. |
| **Consolidado da reunião** | 2 + n       | 1\. Cockpit resumido: barra de trajetória, alertas, Visão Trimestral. 2. Diagnóstico da equipe (tabela) e execução do mês. Em seguida, uma página-resumo por executivo (situação + ações).                                                                                                                                                                                            |

**8.2 Excel — todos os dados**

Uma pasta de trabalho com abas que espelham a planilha original, para que o cliente reconheça a estrutura e possa auditar. Valores, não fórmulas; cabeçalhos com os nomes da planilha e do glossário v0.5 lado a lado.

| **Aba**           | **Conteúdo**                                                                                              |
|-------------------|-----------------------------------------------------------------------------------------------------------|
| **Resumo**        | Contexto da exportação, parâmetros vigentes, glossário                                                    |
| **Metas**         | Executivos, perfil, vigência, meta, % T1–T4, pesos mensais, meta mensal e trimestral, ano+1               |
| **Ticket & Mix**  | Linhas, tickets, mix por executivo, meta R\$ e vendas por linha, ticket planejado                         |
| **Gestão Mensal** | 24 meses × executivo: entradas e todas as colunas calculadas (mesma ordem da aba Gestao de Oportunidades) |
| **Trimestres**    | Meta, won, forecast, falta, atingimento e índice de recuperação por trimestre e executivo                 |
| **Compromissos**  | Por mês e executivo: pactuado, realizado, atingimento, ritmo, necessidade calculada                       |
| **Ações**         | Backlog completo com origem, prazos, status e datas                                                       |
| **Snapshots**     | Série completa                                                                                            |
| **Observações**   | Notas de reunião por executivo e mês                                                                      |
| **Audit**         | Registro de alterações com usuário, campo, valor anterior e novo, motivo                                  |

**9. Experiência visual — sofisticação e modernidade**

O app v0.4 já tem uma base de command center. A v0.5 consolida essa linguagem com foco em leitura executiva e uso projetado.

| **Dimensão**          | **Diretriz**                                                                                                                                                                                        |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Hierarquia**        | Três níveis apenas: decisão (cards grandes, número + semáforo + frase), sustentação (gráficos e tabelas compactas), detalhe (expansível). Nada de tabela de 20 colunas como primeira coisa na tela. |
| **Números**           | Abreviação automática (R\$ 1,53 mi · R\$ 216 mil); percentuais com 1 casa; variações com seta e cor; tabular figures para alinhamento.                                                              |
| **Semáforos**         | Sempre ponto + palavra (“Crítico”), nunca só cor. Paleta acessível (verde, âmbar, vermelho com contraste ≥ 4,5:1).                                                                                  |
| **Gráficos**          | Burn-up como peça central, largura total; trimestres em barras agrupadas; rankings em barras horizontais ordenadas; sparklines nos cards de executivo. Sem gráficos de pizza.                       |
| **Modo Apresentação** | Tecla F. Esconde navegação e faixa de contexto; escala tipográfica +25%; tema escuro por padrão; navegação por setas; indicador de etapa no rodapé.                                                 |
| **Tema**              | Claro (padrão nas áreas de trabalho) e escuro (padrão no Modo Apresentação), com a mesma paleta semântica. O usuário pode fixar qualquer um dos dois.                                               |
| **Densidade**         | Alternância Confortável / Compacta para tabelas, lembrada por usuário.                                                                                                                              |
| **Movimento**         | Transições curtas (≤ 200 ms) apenas em troca de etapa e atualização de número; respeita “reduzir movimento” do sistema.                                                                             |
| **Estados**           | Vazio (com orientação do que fazer), carregando, salvando, conflito de revisão, erro de validação — todos com texto claro e ação sugerida.                                                          |
| **Dispositivo**       | Desktop e tablet em paisagem. Tablet é o cenário de leitura na reunião.                                                                                                                             |
| **Teclado**           | Setas entre etapas e executivos; F apresentação; S snapshot; N nova ação; Esc sai do modo apresentação.                                                                                             |
| **Identidade**        | Logotipo e nome do cliente vindos dos parâmetros; DNA de Vendas discreta no rodapé dos PDFs.                                                                                                        |

**10. Papéis e governança**

Pré-requisito da Onda 1: autenticação por e-mail e senha, base de dados gerenciada com backup e hospedagem com HTTPS. A v0.5 assume esses itens prontos e define os papéis.

| **Papel**         | **Quem**                                       | **Pode**                                                                                                       | **Não pode**                                                                                             |
|-------------------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **Gerente**       | Gerente comercial da IT-One                    | Conduzir reuniões, lançar dados, criar ações e compromissos, registrar snapshots, ajustar com motivo, exportar | Alterar metas, mix, linhas e parâmetros                                                                  |
| **Diretoria**     | Diretor comercial / diretoria                  | Ver tudo (Cockpit, Executivos, Ações, Planejamento), exportar                                                  | Editar qualquer dado — somente leitura; observações da diretoria são registradas pelo gerente na reunião |
| **Administrador** | Consultor DNA de Vendas e/ou gerente designado | Tudo do Gerente + Planejamento e Parâmetros + gestão de usuários                                               | —                                                                                                        |

- Toda edição registra usuário, data e hora no audit; edições administrativas exigem motivo.

- O botão “Habilitar edição” da v0.4 deixa de existir: a permissão é do papel.

- Audit passa a ser persistente e filtrável (executivo, campo, período, usuário), sem limite de 100 registros.

**11. Parametrização multi-cliente (interna)**

A v0.5 é entregue para a IT-One, mas a estrutura já isola tudo o que muda de cliente para cliente em um único bloco de configuração, sem tela exposta ao usuário final. Isso permite reaplicar o instrumento em outros clientes da DNA de Vendas sem alterar código.

| **Grupo**        | **Itens parametrizáveis**                                                                                                                 |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **Identidade**   | Nome do cliente, logotipo, cores de destaque, moeda e formato numérico, nome do gerente                                                   |
| **Vocabulário**  | Nomes dos estágios (Pipeline / Strong / Commit), dos perfis, dos papéis e das linhas de negócio                                           |
| **Regras**       | Probabilidades por estágio, ciclo, mínimo de prospecção, materialidade, capacidade por perfil, limites de semáforo, horizonte — tudo em % |
| **Estrutura**    | Número máximo de executivos e linhas (sem o limite de 20 da planilha)                                                                     |
| **Dados-padrão** | Estado inicial por cliente (equivalente ao default-state.json), gerado a partir da planilha de diagnóstico do projeto                     |

*Isolamento de dados entre clientes (uma base por cliente ou separação lógica) é decisão da Onda 1 e deve ser tomada antes da hospedagem.*

**12. Rastreabilidade — lacunas da análise de gap → itens desta especificação**

| **Lacuna**                                         | **Tratamento na v0.5**                                                               | **Seção**           |
|----------------------------------------------------|--------------------------------------------------------------------------------------|---------------------|
| **C1 Visão trimestral ausente**                    | Barra de trajetória, Visão Trimestral no Cockpit, etapa 3 da Reunião, regras 6.1–6.2 | 3.2 · 4.1 · 4.2 · 6 |
| **C2 Ações somem na virada do mês**                | Ciclo de vida de ações, backlog vivo, atraso                                         | 4.4 · 6.7           |
| **C4 Sem autenticação e papéis**                   | Papéis Gerente / Diretoria / Administrador                                           | 10                  |
| **C5 Persistência em arquivo**                     | Pré-requisito Onda 1                                                                 | 10                  |
| **C6 Cadência semanal × modelo mensal**            | Semana da reunião, ritmo semanal, ating. semanal                                     | 3.2 · 4.4 · 6.3     |
| **R1 Roteiro fragmentado**                         | Reunião em 6 etapas com plano M+3 e compromissos dentro do fluxo                     | 4.2                 |
| **R2 Forecast por executivo fora do Modo Reunião** | Cápsulas mês / tri / ano do executivo na etapa 1 e 3                                 | 4.2                 |
| **R3 Capacidade de recuperação**                   | Ritmo necessário e recuperação do trimestre em %                                     | 6.2 · 7.1           |
| **R4 Perfil global**                               | Perfil por executivo                                                                 | 4.6 · 6.4           |
| **R5 Semáforo só por atingimento**                 | Semáforo duplo + prospecção                                                          | 7.1                 |
| **R6 Snapshot sem série**                          | Série de snapshots e comparação                                                      | 4.3 · 6.8           |
| **R7 Ajuste sem justificativa**                    | Motivo obrigatório                                                                   | 6.6                 |
| **R8 Proteção sem credencial**                     | Permissão por papel                                                                  | 10                  |
| **R9 Audit limitado**                              | Audit persistente e filtrável                                                        | 10                  |
| **R10 Sem exportação**                             | PDF e Excel                                                                          | 8                   |
| **R11 Sete termos de gap**                         | Glossário com três conceitos: Falta a vender · Falta a cobrir · Falta projetada      | 5                   |
| **M2 Meta por linha**                              | Meta R\$ e vendas por linha                                                          | 4.3 · 4.5 · 6.5     |
| **M4 Diagnóstico não sugere**                      | Alertas priorizados com destino                                                      | 7.2                 |
| **M8 Modo apresentação**                           | Modo Apresentação                                                                    | 4.2 · 9             |
| **Nova: critérios de estágio**                     | Critério mínimo e autorização nos Parâmetros e na etapa 2                            | 4.2 · 4.6           |
| **Nova: bases mistas meta × objetivo**             | Selo “com ajuste” e base única por vez                                               | 5                   |

**13. Decisões tomadas**

As dez pendências da versão anterior deste documento foram decididas pelo critério de menor complexidade para o gerente, coerência com a planilha que a IT-One já conhece e aderência à regra de percentuais (princípio 8). Cada decisão pode ser revertida por parâmetro, sem impacto estrutural.

| **\#** | **Pendência**                        | **Decisão**                                                                                | **Por quê**                                                                                                                             |
|--------|--------------------------------------|--------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| **1**  | Semáforo de cobertura do funil       | Verde ≥ 300% · Âmbar 150% a 300% · Vermelho \< 150%                                        | Equivale ao padrão de mercado de 3x de pipeline; expresso em % para manter uma única linguagem                                          |
| **2**  | Semáforo de recuperação do trimestre | Verde ≥ 100% · Âmbar 70% a 100% · Vermelho \< 70%                                          | 100% significa que o funil restante cobre a falta do trimestre; 70% marca o ponto em que a recuperação passa a depender de geração nova |
| **3**  | Semanas do mês                       | 4 fixas                                                                                    | Leitura imediata (25% por semana); evita ritmo irregular em meses de 5 semanas. Revisável em versão futura                              |
| **4**  | Registro semanal do realizado        | Não na v0.5 — realizado mensal atualizado a cada reunião                                   | Sem campo novo; o ritmo esperado da semana já dá a comparação                                                                           |
| **5**  | Ordem dos executivos na Reunião      | Do mais crítico ao menos crítico, recalculada a cada reunião; reordenação manual na sessão | Tempo da reunião vai primeiro para quem precisa de decisão                                                                              |
| **6**  | Capacidade por perfil                | 150 prospects / 35 oportunidades para os três perfis, editável                             | Sem base histórica para diferenciar; o parâmetro por perfil fica pronto para calibração                                                 |
| **7**  | Permissão da Diretoria               | Somente leitura                                                                            | Governança clara: uma única fonte de edição (gerente). Observações da diretoria entram pelo gerente na reunião                          |
| **8**  | Nomenclatura dos três gaps           | Falta a vender · Falta a cobrir · Falta projetada                                          | Mantém “Falta”, palavra que a planilha já usa em todas as abas; os três nomes se explicam sozinhos                                      |
| **9**  | PDF consolidado                      | Gerado automaticamente ao encerrar a reunião; PDF por executivo sob demanda                | Garante a ata sem depender de lembrar; evita gerar 4 PDFs individuais sem necessidade                                                   |
| **10** | Tema escuro                          | Padrão no Modo Apresentação; opcional nas demais áreas                                     | Projeção pede fundo escuro; trabalho de mesa pede fundo claro                                                                           |

**13.1 Decisão transversal — percentuais no lugar de pesos**

Toda parametrização que antes usava pesos ou fatores (pesos mensais 1 / 0,5 / 0; fator do piso 1; pesos de estágio 0,2 / 0,5 / 0,9; múltiplos “3x”; índices 1,0 / 0,7) passa a ser expressa em percentual. Onde as escolhas distribuem um total, a tela mostra a soma ao vivo e o fechamento em 100% do período, com botão Completar. A matemática do motor não muda; muda a forma como o gerente escolhe e confere. Detalhe na seção 2.1.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Próximo passo</strong></p>
<p>Com as decisões tomadas, a sequência recomendada é: (1) Onda 1 — hospedagem segura, autenticação e persistência, sem mudança funcional; (2) implementação da v0.5 conforme esta especificação, em duas entregas: Reunião + Ações &amp; Compromissos + glossário (primeira), Cockpit trimestral + semáforos + exportações (segunda); (3) validação com o gerente da IT-One em uma reunião real, antes de fechar a versão.</p></td>
</tr>
</tbody>
</table>

**Anexo A — Roteiro da reunião × etapas do app**

| **\#** | **Passo do roteiro**                             | **Etapa da Reunião**         | **Bloco que o executa**                                           |
|--------|--------------------------------------------------|------------------------------|-------------------------------------------------------------------|
| **1**  | Revisar o resultado do mês                       | 1 · Situação                 | Cápsula Mês, falta a vender                                       |
| **2**  | Comparar realizado × meta mensal                 | 1 · Situação                 | Cápsula Mês, atingimento, semáforo de resultado                   |
| **3**  | Avaliar impacto do mês no trimestre              | 3 · Trimestre e trajetória   | Trimestre corrente, ritmo necessário, recuperação %               |
| **4**  | Verificar trajetória acumulada × meta anual      | 1 e 3                        | Cápsula Ano, forecast do exercício, falta projetada, mini burn-up |
| **5**  | Revisar Pipeline, Strong, Commit e forecast      | 2 · Funil e forecast         | Editor de funil, funil ponderado, cobertura                       |
| **6**  | Identificar desvios e riscos futuros             | 2 e 3                        | Falta a cobrir, cobertura do funil %, semáforo de funil, alertas  |
| **7**  | Avaliar necessidade de oportunidades e prospects | 4 · Plano M+3 e compromissos | Cadeia da engenharia reversa, piso, capacidade, recomendação      |
| **8**  | Definir ações, responsáveis e prazos             | 5 · Decisões e ações         | Ações abertas e novas                                             |
| **9**  | Registrar compromissos do executivo              | 4 · Plano M+3 e compromissos | Compromisso pactuado, ritmo semanal                               |
| **10** | Gerar snapshot para a próxima reunião            | 6 · Fechamento               | Registrar snapshot, PDF, próximo executivo                        |

**Anexo B — Modelo de dados: campos novos**

| **Entidade**          | **Campo novo**                                                                 | **Tipo**                       | **Regra**                                                                             |
|-----------------------|--------------------------------------------------------------------------------|--------------------------------|---------------------------------------------------------------------------------------|
| **Executivo**         | perfil                                                                         | Hunter \| Farmer \| End-to-End | Padrão End-to-End; alimenta plano M+3                                                 |
| **Lançamento mensal** | motivoAjuste                                                                   | texto                          | Obrigatório quando ajuste gerencial ≠ 0                                               |
| **Executivo**         | distribuicaoMensal                                                             | 12 percentuais                 | Fecha 100% por trimestre; substitui monthWeights (migração: peso ÷ soma do trimestre) |
| **Ação**              | origem { mês, semana, data } · criadaEm · concluídaEm                          | datas                          | Backlog cruza meses; atraso = prazo \< hoje e não concluída                           |
| **Snapshot**          | semana · faltaAVender · faltaACobrir · compromissos · realizado · açõesAbertas | números                        | Série completa por executivo                                                          |
| **Parâmetros**        | perfis\[\].capacidadeProspects · perfis\[\].capacidadeOportunidades            | inteiros                       | Substitui capacidade global                                                           |
| **Parâmetros**        | semaforos { resultado, funil, recuperacao, prospeccao }                        | limites em %                   | Ver seção 7                                                                           |
| **Parâmetros**        | minimoProspeccao (%) · probabilidadeEstagio { pipeline, strong, commit } (%)   | percentuais                    | Substituem floorFactor e stageWeights (mesma matemática, exibição em %)               |
| **Parâmetros**        | cliente { nome, logotipo, cores, moeda, vocabulario }                          | objeto                         | Multi-cliente, seção 11                                                               |
| **Usuário**           | e-mail · nome · papel                                                          | —                              | Gerente \| Diretoria \| Administrador                                                 |
| **Audit**             | usuário · motivo                                                               | texto                          | Persistente, sem limite                                                               |
