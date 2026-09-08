import { MONTHS, calculateModel, actionPlan, inputEntry, commitmentEntry, monthlyTargets, plannedTicket } from "../engine/engine.js";

const icon = paths => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
const icons = {
  dashboard: icon('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  meeting: icon('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>'),
  funnel: icon('<path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5Z"/>'),
  team: icon('<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6"/><path d="M15 5.5a3 3 0 0 1 0 5.5M16 13c2.7.5 4 2.5 4.3 5"/>'),
  actions: icon('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 2 2 5-5M8 15h8"/>'),
  goals: icon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  mix: icon('<path d="m12 3 9 9-9 9-9-9Z"/><path d="m8 12 4-4 4 4-4 4Z"/>'),
  settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>'),
};

const routes = [
  ["dashboard", icons.dashboard, "Dashboard Gerencial"],
  ["reuniao", icons.meeting, "Modo Reunião"],
  ["gestao", icons.funnel, "Gestão Mensal do Funil"],
  ["equipe", icons.team, "Visão da Equipe"],
  ["plano", icons.actions, "Planos e Ações"],
  ["metas", icons.goals, "Metas"],
  ["ticket", icons.mix, "Ticket & Mix"],
  ["parametros", icons.settings, "Parâmetros"],
];

const routeSubtitles = {
  dashboard: "Visão consolidada para decisões de performance e forecast.",
  reuniao: "Condução estruturada da reunião semanal por executivo.",
  gestao: "Atualização mensal do funil, resultados e cobertura.",
  equipe: "Comparativo de performance, risco e capacidade comercial.",
  plano: "Cobertura financeira, compromissos e ações gerenciais.",
  metas: "Metas anuais, sazonalidade e distribuição mensal.",
  ticket: "Arquitetura de ticket, portfólio e mix comercial.",
  parametros: "Premissas que governam os cálculos do painel.",
};


let store;
let state;
let model;
let renderTimer;
let managementHistoryOpen = false;
let configurationUnlocked = false;
const el = id => document.getElementById(id);
const n = value => Number(value) || 0;
const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n(value));
const number = (value, digits = 0) => value == null ? "—" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n(value));
const pct = value => value == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(n(value));
const multiple = value => value == null ? "Meta coberta" : `${number(value, 2)}x`;
const toPct = value => Math.round(n(value) * 100 * 100) / 100;   // 0.25 -> 25 (exibição em %)
const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[ch]);

// Ponto de entrada: main.js chama após o login e o carregamento do store.
export function initApp(appStore) {
  store = appStore;
  state = store.state;
  store.onStatus(({ text, tone }) => setSaveStatus(text, tone));
  store.onError = (error, ref) => {
    toast(`Não foi possível salvar (${ref.type}): ${error.message}`);
  };
  bindShell();
  render();
}

function activeRoute() {
  const route = location.hash.replace("#", "");
  return routes.some(item => item[0] === route) ? route : "dashboard";
}

function bindShell() {
  el("nav").innerHTML = routes.map(([id, icon, label]) => `<button class="nav-item" data-route="${id}"><span class="nav-icon">${icon}</span>${label}</button>`).join("");
  el("nav").addEventListener("click", event => {
    const button = event.target.closest("[data-route]");
    if (button) location.hash = button.dataset.route;
  });
  addEventListener("hashchange", render);
  el("month-control").innerHTML = MONTHS.slice(0, 12).map((month, index) => `<option value="${index + 1}">${month}</option>`).join("");
  el("month-control").addEventListener("change", event => updateSetting("referenceMonth", Number(event.target.value)));
  el("year-control").addEventListener("change", event => updateSetting("year", Number(event.target.value)));
  el("executive-control").addEventListener("change", event => updateSetting("selectedExecutiveId", event.target.value));
  el("content").addEventListener("change", handleEdit);
  el("content").addEventListener("click", handleAction);
  el("undo-button").addEventListener("click", undoLast);
  addEventListener("beforeunload", event => { if (store.pending.size || store.inFlight) { store.flushAll(); event.preventDefault(); event.returnValue = ""; } });
  const user = el("user-name"); if (user) user.textContent = state.settings.manager || state.settings.currentUser || "Usuário";
  const role = el("user-role"); if (role) role.textContent = state.settings.clientName ? `${state.settings.clientName} · ${state.settings.currentUser}` : state.settings.currentUser;
  const brand = el("brand-name"); if (brand && state.settings.clientName) brand.textContent = state.settings.clientName;
  const eyebrow = el("eyebrow-client"); if (eyebrow) eyebrow.textContent = `${(state.settings.clientName || "").toUpperCase()} · GOVERNANÇA COMERCIAL`.replace(/^ · /, "");
  document.title = `${state.settings.clientName || "Governança"} | Governança Comercial`;
}

function updateSetting(field, value) {
  store.pushUndo({ type: "settings" });
  state.settings[field] = value;
  store.persist({ type: "settings" });
  syncUndoButton();
  render();
}

function queueRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 50);
}

function audit(field, previous, next) {
  store.audit(field, previous, next);
}

function setSaveStatus(message, tone = "saved") {
  const side = el("save-status"); if (side) side.textContent = message;
  const top = el("top-save-status");
  if (top) {
    top.className = `save-pill ${tone}`;
    top.innerHTML = `<span class="save-dot"></span>${esc(message)}`;
  }
}

function syncUndoButton() { el("undo-button").disabled = !store.canUndo; }

function undoLast() {
  const ref = store.undo();
  if (!ref) return;
  state = store.state;
  syncUndoButton();
  render();
  toast("Última alteração desfeita.");
}

// Referência da entidade que um campo editável altera (usada para undo e gravação por entidade).
function refFor(input) {
  const d = input.dataset;
  const year = Number(d.year || state.settings.year);
  switch (d.kind) {
    case "management": return { type: "entry", exec: d.exec, year, month: Number(d.month) };
    case "commitment": return { type: "commitment", exec: d.exec, year, month: Number(d.month) };
    case "executive": case "quarter": case "month-weight": return { type: "executive", exec: d.exec };
    case "mix": return { type: "mix", exec: d.exec };
    case "line": return { type: "line", line: d.line };
    case "param": return { type: "parameters" };
    case "meeting-note": return { type: "note", exec: d.exec, year: state.settings.year, month: Number(d.month) };
    case "action": return { type: "action", id: d.action };
    default: return null;
  }
}

function toast(message) {
  el("toast").textContent = message;
  el("toast").classList.add("show");
  setTimeout(() => el("toast").classList.remove("show"), 2200);
}

function render() {
  model = calculateModel(state);
  const route = activeRoute();
  const config = routes.find(item => item[0] === route);
  el("page-title").textContent = config[2];
  el("page-subtitle").textContent = routeSubtitles[route];
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.route === route));
  const baseYear = Number(state.settings.baseYear);
  el("year-control").innerHTML = [baseYear, baseYear + 1].map(year => `<option value="${year}">${year}</option>`).join("");
  el("year-control").value = state.settings.year;
  el("month-control").value = state.settings.referenceMonth;
  el("executive-control").innerHTML = `<option value="">GERÊNCIA — CONSOLIDADO</option>${state.executives.map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join("")}`;
  el("executive-control").value = state.settings.selectedExecutiveId;
  renderAlerts();
  const renderers = { dashboard: renderDashboard, reuniao: renderMeeting, gestao: renderManagement, equipe: renderTeam, plano: renderPlan, metas: renderGoals, ticket: renderTicket, parametros: renderParameters };
  const administrative = ["metas", "ticket", "parametros"].includes(route);
  const guard = administrative ? `<section class="config-guard ${configurationUnlocked ? "unlocked" : ""}"><div><strong>${configurationUnlocked ? "Edição administrativa habilitada" : "Modo de consulta"}</strong><span>${configurationUnlocked ? "As alterações serão registradas e salvas automaticamente." : "Metas, mix e parâmetros estão protegidos contra alterações acidentais."}</span></div><button class="button ${configurationUnlocked ? "secondary" : "primary"}" type="button" data-toggle-config>${configurationUnlocked ? "Encerrar edição" : "Habilitar edição"}</button></section>` : "";
  el("content").innerHTML = guard + renderers[route]();
  if (administrative && !configurationUnlocked) el("content").querySelectorAll("[data-kind]").forEach(input => input.disabled = true);
}

function renderAlerts() {
  const alerts = [];
  const now = new Date();
  if (state.settings.year !== now.getFullYear() || state.settings.referenceMonth !== now.getMonth() + 1) {
    alerts.push(`Período histórico selecionado: ${MONTHS[state.settings.referenceMonth - 1]} de ${state.settings.year}.`);
  }
  const invalidRows = model.allRows.filter(row => row.consistency !== "OK").length;
  if (invalidRows) alerts.push(`${invalidRows} lançamento(s) precisam de revisão de consistência.`);
  const profiles = Object.values(state.params.profiles);
  if (activeRoute() === "parametros" && profiles.every(p => p.winRate === profiles[0].winRate && p.prospectConversion === profiles[0].prospectConversion)) alerts.push("Hunter, Farmer e End-to-End estão com taxas idênticas.");
  el("alerts").innerHTML = alerts.length ? `<div class="alert"><strong>⚠</strong><span>${alerts.join(" ")}</span></div>` : "";
}

function kpi(label, value, note, tone = "") {
  return `<article class="kpi ${tone}"><span class="label">${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function statusFor(row) {
  if (row.attainment >= 1) return ["green", "Na trajetória"];
  if (row.attainment >= .8) return ["amber", "Atenção"];
  return ["red", "Crítico"];
}

function selectedRow() {
  const executive = currentExecutive();
  if (!executive) return null;
  return model.executives.find(item => item.executive.id === executive.id).rows.find(row => row.year === state.settings.year && row.monthOfYear === state.settings.referenceMonth);
}

function managementInput(executiveId, year, month, field, label, value, options = {}) {
  const { min = 0, step = 1, prefix = "", hint = "" } = options;
  return `<label class="edit-field"><span>${label}</span><div class="input-shell">${prefix ? `<span>${prefix}</span>` : ""}<input type="number" min="${min}" step="${step}" data-kind="management" data-exec="${executiveId}" data-year="${year}" data-month="${month}" data-field="${field}" value="${n(value)}" aria-label="${label} · ${MONTHS[month-1]} de ${year}"></div>${hint ? `<small>${hint}</small>` : ""}</label>`;
}

function managementEditor(executive, row) {
  const input = inputEntry(state, executive.id, row.monthOfYear, row.year);
  return `<div class="management-layout">
    <article class="editor-card"><div class="card-title"><div><span class="step-label">1</span><h3>Funil e previsão</h3></div><span class="meta-label">Entradas do mês</span></div><div class="editor-grid">
      ${managementInput(executive.id,row.year,row.monthOfYear,"pipeline","Pipeline",input.pipeline,{prefix:"R$"})}
      ${managementInput(executive.id,row.year,row.monthOfYear,"strong","Strong",input.strong,{prefix:"R$"})}
      ${managementInput(executive.id,row.year,row.monthOfYear,"commit","Commit",input.commit,{prefix:"R$"})}
      ${managementInput(executive.id,row.year,row.monthOfYear,"managerAdjustment","Ajuste gerencial",input.managerAdjustment,{min:-999999999,prefix:"R$"})}
    </div></article>
    <article class="editor-card"><div class="card-title"><div><span class="step-label">2</span><h3>Resultados e carteira</h3></div><span class="meta-label">Realizado</span></div><div class="editor-grid">
      ${managementInput(executive.id,row.year,row.monthOfYear,"wonValue","Won",input.wonValue,{prefix:"R$"})}
      ${managementInput(executive.id,row.year,row.monthOfYear,"wonQty","Won — quantidade",input.wonQty)}
      ${managementInput(executive.id,row.year,row.monthOfYear,"lostValue","Lost",input.lostValue,{prefix:"R$"})}
      ${managementInput(executive.id,row.year,row.monthOfYear,"lostQty","Lost — quantidade",input.lostQty)}
      ${managementInput(executive.id,row.year,row.monthOfYear,"activeAccounts","Contas ativas",input.activeAccounts)}
    </div></article>
    <article class="editor-card result-card"><div class="card-title"><div><span class="step-label">3</span><h3>Resultado calculado</h3></div><span class="badge ${row.consistency === "OK" ? "green" : "red"}">${row.consistency}</span></div><dl class="result-list">
      <div><dt>Meta oficial</dt><dd>${money(row.target)}</dd></div><div><dt>Funil em aberto</dt><dd>${money(row.openPipeline)}</dd></div>
      <div><dt>Funil ponderado</dt><dd>${money(row.weightedPipeline)}</dd></div><div><dt>Cobertura disponível</dt><dd>${money(row.availableCoverage)}</dd></div>
      <div><dt>Gap com cobertura</dt><dd class="${row.gapWithCoverage > 0 ? "text-red" : "text-green"}">${money(row.gapWithCoverage)}</dd></div><div><dt>Funil mensal ÷ falta do mês</dt><dd>${multiple(row.funnelToCashGap)}</dd></div>
    </dl></article>
  </div>`;
}

function actionRows(executiveId) {
  const rows = state.actions.filter(item => item.executiveId === executiveId && Number(item.month) === state.settings.referenceMonth && Number(item.year) === state.settings.year);
  if (!rows.length) return `<div class="empty-state"><strong>Nenhuma ação registrada</strong><span>Registre o compromisso definido durante a reunião.</span><button class="button primary" type="button" data-add-action>Adicionar ação</button></div>`;
  return `<div class="table-wrap action-table"><table><thead><tr><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th></tr></thead><tbody>${rows.map(action => `<tr>
    <td class="editable wide"><input type="text" data-kind="action" data-action="${action.id}" data-field="description" value="${esc(action.description)}" aria-label="Descrição da ação"></td>
    <td class="editable"><input type="text" data-kind="action" data-action="${action.id}" data-field="owner" value="${esc(action.owner)}" aria-label="Responsável"></td>
    <td class="editable"><input type="date" data-kind="action" data-action="${action.id}" data-field="dueDate" value="${esc(action.dueDate)}" aria-label="Prazo"></td>
    <td class="editable"><select data-kind="action" data-action="${action.id}" data-field="priority" aria-label="Prioridade">${["Alta","Média","Baixa"].map(value=>`<option ${value===action.priority?"selected":""}>${value}</option>`).join("")}</select></td>
    <td class="editable"><select data-kind="action" data-action="${action.id}" data-field="status" aria-label="Status">${["Aberta","Em andamento","Concluída","Bloqueada"].map(value=>`<option ${value===action.status?"selected":""}>${value}</option>`).join("")}</select></td>
  </tr>`).join("")}</tbody></table></div>`;
}

function renderMeeting() {
  const executive = currentExecutive();
  if (!executive) return executiveRequired("Selecione o executivo da reunião", "O modo reunião registra dados, decisões e snapshots em um executivo específico.");
  const team = model.team.find(item => item.id === executive.id);
  const row = selectedRow();
  const [tone, status] = statusFor(team);
  const index = state.executives.findIndex(item => item.id === executive.id);
  const snapshots = state.snapshots.filter(item => item.executiveId === executive.id && item.year === state.settings.year && item.month === state.settings.referenceMonth);
  const lastSnapshot = snapshots.at(-1);
  const note = state.meetingNotes.find(item => item.executiveId === executive.id && item.month === state.settings.referenceMonth && item.year === state.settings.year);
  const gapDelta = lastSnapshot ? row.gapWithCoverage - lastSnapshot.gapWithCoverage : null;
  return `<section class="meeting-hero section">
    <div class="meeting-title"><div><span class="badge ${tone}">${status}</span><h2>${esc(executive.name)}</h2><p>${MONTHS[state.settings.referenceMonth-1]} de ${state.settings.year} · revisão executiva do funil</p></div>
      <div class="meeting-nav"><button class="icon-button" type="button" data-exec-step="-1" ${index===0?"disabled":""} aria-label="Executivo anterior">←</button><span>${index+1} de ${state.executives.length}</span><button class="icon-button" type="button" data-exec-step="1" ${index===state.executives.length-1?"disabled":""} aria-label="Próximo executivo">→</button></div>
    </div>
    <div class="decision-grid">
      <article><span>Atingimento acumulado</span><strong>${pct(team.attainment)}</strong><small>${money(team.wonYtd)} de ${money(team.targetYtd)}</small></article>
      <article><span>Gap com cobertura</span><strong class="${row.gapWithCoverage > 0 ? "text-red" : "text-green"}">${money(row.gapWithCoverage)}</strong><small>${gapDelta == null ? "Sem snapshot anterior" : `${gapDelta > 0 ? "+" : ""}${money(gapDelta)} desde o snapshot`}</small></article>
      <article><span>Funil mensal ÷ falta do mês</span><strong>${multiple(row.funnelToCashGap)}</strong><small>${row.funnelToCashGap != null && row.funnelToCashGap < 1 ? "Cobertura insuficiente" : "Cobertura compatível"}</small></article>
      <article><span>Última revisão</span><strong>${row.lastReview ? new Date(`${row.lastReview}T12:00:00`).toLocaleDateString("pt-BR") : "Pendente"}</strong><small>${snapshots.length} snapshot(s) no período</small></article>
    </div>
  </section>
  <section class="section"><div class="section-heading"><div><h2>Atualização do mês</h2><p>Revise os dados que sustentam o forecast antes de definir ações.</p></div></div>${managementEditor(executive,row)}</section>
  <section class="section meeting-decisions"><article class="panel"><div class="panel-header"><div><h3>Decisões e observações</h3><span>Registro da conversa com o executivo</span></div></div><div class="panel-body"><textarea class="meeting-note" data-kind="meeting-note" data-exec="${executive.id}" data-month="${state.settings.referenceMonth}" aria-label="Decisões e observações de ${esc(executive.name)}" placeholder="Registre causas do desvio, decisões e orientações...">${esc(note?.text || "")}</textarea></div></article>
    <article class="panel"><div class="panel-header"><div><h3>Fechamento da reunião</h3><span>Congele a posição para comparação semanal</span></div></div><div class="panel-body closing-actions"><button class="button primary" type="button" data-snapshot>Registrar snapshot</button><button class="button secondary" type="button" data-add-action>Adicionar ação</button><span>${lastSnapshot ? `Último: ${new Date(lastSnapshot.at).toLocaleString("pt-BR")}` : "Nenhum snapshot registrado"}</span></div></article></section>
  <section class="section"><div class="section-heading"><div><h2>Ações acordadas</h2><p>Responsável, prazo e status dos compromissos do mês.</p></div><button class="button secondary" type="button" data-add-action>Nova ação</button></div>${actionRows(executive.id)}</section>`;
}

function renderDashboard() {
  const d = model.dashboard;
  const title = state.settings.selectedExecutiveId ? state.executives.find(e => e.id === state.settings.selectedExecutiveId)?.name : "Gerência consolidada";
  return `
    <section class="section">
      <div class="section-heading"><div><h2>${esc(title)}</h2><p>Resultado acumulado e projeção do exercício.</p></div><span class="badge blue">${MONTHS[state.settings.referenceMonth - 1]} · ${state.settings.year}</span></div>
      <div class="kpi-grid">
        ${kpi("Meta acumulada", money(d.ytdTarget), `até ${MONTHS[state.settings.referenceMonth - 1]}`)}
        ${kpi("Ganhas acumuladas", money(d.wonYtd), `até ${MONTHS[state.settings.referenceMonth - 1]}`, d.wonYtd >= d.ytdTarget ? "good" : "")}
        ${kpi("Atingimento acumulado", pct(d.attainment), d.attainment >= 1 ? "na trajetória" : d.attainment >= .8 ? "atenção" : "crítico", d.attainment < .8 ? "critical" : "")}
        ${kpi("Previsão do ano", money(d.forecast), pct(d.totalTarget ? d.forecast / d.totalTarget : 0))}
        ${kpi("Falta projetada", money(d.projectedGap), pct(d.totalTarget ? d.projectedGap / d.totalTarget : 0), d.projectedGap > 0 ? "critical" : "good")}
        ${kpi("Cobertura anual do funil", multiple(d.funnelMultiple), `Backlog até o fim do exercício: ${money(d.openBacklog)}`)}
      </div>
    </section>
    <section class="section focus-strip"><div><span class="eyebrow">PRÓXIMA AÇÃO</span><h2>Conduzir revisão por executivo</h2><p>Comece pelos casos críticos e registre decisões, ações e o snapshot da semana.</p></div><button class="button primary" type="button" data-route-jump="reuniao">Iniciar reunião</button></section>
    <section class="section grid-2">
      <article class="panel"><div class="panel-header"><h3>Burn-up comercial</h3><span>Meta × Won × previsão</span></div><div class="panel-body">${burnupChart()}</div></article>
      <article class="panel"><div class="panel-header"><h3>Cobertura da carteira</h3><span>${d.activeAccounts} de ${d.totalAccounts} contas</span></div><div class="panel-body">${coverageGauge(d.coverage)}${rankBars("coverage")}</div></article>
    </section>
    <section class="section grid-3">
      <article class="panel"><div class="panel-header"><h3>Atingimento por executivo</h3></div><div class="panel-body">${rankBars("attainment")}</div></article>
      <article class="panel"><div class="panel-header"><h3>Falta projetada</h3></div><div class="panel-body">${rankBars("gapProjected")}</div></article>
      <article class="panel"><div class="panel-header"><h3>Cobertura anual do funil</h3></div><div class="panel-body">${rankBars("funnelMultiple")}</div></article>
    </section>
    <section class="section">
      <div class="section-heading"><div><h2>Diagnóstico por executivo</h2><p>Mesmos indicadores consolidados da planilha.</p></div></div>
      ${teamTable()}
    </section>`;
}

function aggregateMonths() {
  const selected = state.settings.selectedExecutiveId;
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const rows = model.allRows.filter(row => row.year === state.settings.year && row.monthOfYear === month && (!selected || row.executiveId === selected));
    return {
      month,
      target: rows.reduce((s, r) => s + r.target, 0),
      won: rows.reduce((s, r) => s + r.wonValue, 0),
      increment: month >= state.settings.referenceMonth ? rows.reduce((s, r) => s + r.strong * state.params.stageWeights.strong + r.commit * state.params.stageWeights.commit, 0) : 0,
    };
  });
}

function burnupChart() {
  const rows = aggregateMonths();
  let t = 0, w = 0, f = 0;
  const series = rows.map(row => ({ label: MONTHS[row.month - 1].slice(0, 3), target: t += row.target, won: w += row.won, forecast: f = w + (f - (w - row.won)) + row.increment }));
  const max = Math.max(...series.map(r => r.target), 1);
  const W = 760, H = 230, left = 52, top = 14, width = 685, height = 175;
  const point = (v, i) => `${left + (i * width / 11)},${top + height - (v / max * height)}`;
  const grid = [0, .25, .5, .75, 1].map(q => `<line class="chart-grid" x1="${left}" y1="${top + height - q * height}" x2="${left + width}" y2="${top + height - q * height}"/><text class="axis-label" x="0" y="${top + height - q * height + 4}">${number(max * q / 1000000, 1)} mi</text>`).join("");
  const referenceIndex = Math.max(0, Math.min(11, state.settings.referenceMonth - 1));
  const referenceX = left + referenceIndex * width / 11;
  const forecastPoints = series.map((r,i) => point(r.forecast,i)).join(" ");
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução da meta, ganhos e previsão">
    <defs><linearGradient id="forecast-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1595f5" stop-opacity=".18"/><stop offset="1" stop-color="#1595f5" stop-opacity="0"/></linearGradient><linearGradient id="forecast-line" x1="0" x2="1"><stop stop-color="#0b75d1"/><stop offset="1" stop-color="#49c5e8"/></linearGradient></defs>
    ${grid}
    <line class="chart-current" x1="${referenceX}" y1="${top}" x2="${referenceX}" y2="${top+height}"/><text class="chart-current-label" x="${referenceX}" y="10" text-anchor="middle">período atual</text>
    <polygon fill="url(#forecast-area)" points="${left},${top+height} ${forecastPoints} ${left+width},${top+height}"/>
    <polyline fill="none" stroke="#7f8995" stroke-width="3" points="${series.map((r,i) => point(r.target,i)).join(" ")}"/>
    <polyline fill="none" stroke="#247b45" stroke-width="3" points="${series.map((r,i) => point(r.won,i)).join(" ")}"/>
    <polyline fill="none" stroke="url(#forecast-line)" stroke-width="3.5" points="${forecastPoints}"/>
    <circle cx="${referenceX}" cy="${top + height - (series[referenceIndex].forecast / max * height)}" r="4.5" fill="#fff" stroke="#1595f5" stroke-width="3"/>
    ${series.map((r,i) => `<text class="axis-label" text-anchor="middle" x="${left + i * width / 11}" y="218">${r.label}</text>`).join("")}
  </svg></div><div class="legend"><span><i style="background:#7f8995"></i>Meta acumulada</span><span><i style="background:#247b45"></i>Won acumulado</span><span><i style="background:#1674c4"></i>Previsão</span></div>`;
}

function coverageGauge(value) {
  const v = Math.max(0, Math.min(1, n(value)));
  return `<div style="display:grid;place-items:center;padding:10px 0 22px"><div style="width:150px;height:75px;overflow:hidden;position:relative"><div style="width:150px;height:150px;border-radius:50%;background:conic-gradient(from 270deg,var(--blue) 0deg ${v*180}deg,#e7edf3 ${v*180}deg 180deg,transparent 180deg);position:absolute"></div><div style="width:104px;height:104px;background:white;border-radius:50%;position:absolute;left:23px;top:23px"></div><strong style="position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:1.35rem">${pct(v)}</strong></div></div>`;
}

function rankBars(field) {
  const rows = [...model.team].filter(x => x.name);
  const max = Math.max(...rows.map(r => n(r[field])), 1);
  return `<div class="rank-list">${rows.sort((a,b) => n(b[field])-n(a[field])).map(row => {
    const ratio = Math.max(0, n(row[field]) / max * 100);
    const formatted = field === "gapProjected" ? money(row[field]) : field === "attainment" || field === "coverage" ? pct(row[field]) : multiple(row[field]);
    const tone = field === "gapProjected" ? "red" : field === "attainment" ? "green" : "";
    return `<div class="rank-row"><span>${esc(row.name)}</span><div class="rank-track"><div class="rank-fill ${tone}" style="width:${ratio}%"></div></div><strong>${formatted}</strong></div>`;
  }).join("")}</div>`;
}

function teamTable() {
  return `<div class="table-wrap"><table><thead><tr><th>Executivo</th><th>Situação</th><th class="number">Meta acum.</th><th class="number">Won acum.</th><th class="number">Ating.</th><th class="number">Ticket realizado</th><th class="number">Win rate</th><th class="number">Cobertura</th><th class="number">Cobertura anual do funil</th></tr></thead><tbody>${model.team.map(row => { const [tone,status]=statusFor(row); return `<tr class="clickable-row"><td><button class="table-link" type="button" data-open-exec="${row.id}">${esc(row.name)}<span>Abrir revisão →</span></button></td><td><span class="badge ${tone}">${status}</span></td><td class="number">${money(row.targetYtd)}</td><td class="number">${money(row.wonYtd)}</td><td class="number"><strong>${pct(row.attainment)}</strong></td><td class="number">${row.ticketRealized == null ? "—" : money(row.ticketRealized)}</td><td class="number">${pct(row.winRate)}</td><td class="number">${pct(row.coverage)}</td><td class="number">${multiple(row.funnelMultiple)}</td></tr>`; }).join("")}</tbody></table></div>`;
}

function currentExecutive() {
  return state.executives.find(e => e.id === state.settings.selectedExecutiveId) || null;
}

function executiveRequired(title, message) {
  return `<section class="section"><div class="empty-state selection-required"><strong>${esc(title)}</strong><span>${esc(message)}</span><span>Use o campo Responsável no cabeçalho para continuar.</span></div></section>`;
}

function renderManagement() {
  const executive = currentExecutive();
  if (!executive) return executiveRequired("Selecione um executivo", "A gestão mensal altera lançamentos individuais e não pode operar no consolidado.");
  const item = model.executives.find(x => x.executive.id === executive.id);
  const current = item.rows.find(row => row.year === state.settings.year && row.monthOfYear === state.settings.referenceMonth);
  const editable = [
    ["pipeline", "Pipeline R$", "number"], ["strong", "Strong R$", "number"], ["commit", "Commit R$", "number"],
    ["wonValue", "Won R$", "number"], ["managerAdjustment", "Ajuste gerencial", "number"], ["wonQty", "Won qtd", "number"],
    ["lostValue", "Lost R$", "number"], ["lostQty", "Lost qtd", "number"], ["activeAccounts", "Contas ativas", "number"],
  ];
  return `<section class="section"><div class="section-heading"><div><h2>${esc(executive.name)} · ${MONTHS[state.settings.referenceMonth-1]}</h2><p>Atualização focada do funil e dos resultados do mês selecionado.</p></div><button class="button secondary" type="button" data-toggle-history>${managementHistoryOpen ? "Ocultar histórico" : "Consultar histórico de 24 meses"}</button></div>
    ${managementEditor(executive,current)}
  </section>
  ${managementHistoryOpen ? `<section class="section"><div class="section-heading"><div><h2>Histórico completo</h2><p>Entradas e cálculos dos 24 meses do modelo.</p></div><span class="badge blue">24 meses</span></div><div class="table-wrap dense-table"><table><thead><tr><th>Período</th><th class="number">Meta oficial</th><th class="number">Vendas necessárias</th>${editable.map(x => `<th class="number">${x[1]}</th>`).join("")}<th class="number">Funil aberto</th><th class="number">Funil ponderado</th><th class="number">Cobertura c/ carry</th><th class="number">Gap c/ cobertura</th><th class="number">Funil mensal ÷ falta do mês</th><th>Última revisão</th><th>Consistência</th></tr></thead><tbody>
      ${item.rows.map(row => { const input = inputEntry(state, executive.id, row.monthOfYear, row.year); const period = `${MONTHS[row.monthOfYear-1]} de ${row.year}`; return `<tr><td>${period}</td><td class="number calculated">${money(row.target)}</td><td class="number calculated">${number(row.plannedSales,2)}</td>${editable.map(([field,label]) => `<td class="editable"><input type="number" ${field === "managerAdjustment" ? "" : "min=\"0\""} step="1" data-kind="management" data-exec="${executive.id}" data-year="${row.year}" data-month="${row.monthOfYear}" data-field="${field}" value="${n(input[field])}" aria-label="${label} · ${period}"></td>`).join("")}<td class="number calculated">${money(row.openPipeline)}</td><td class="number calculated">${money(row.weightedPipeline)}</td><td class="number calculated">${money(row.availableCoverage)}</td><td class="number calculated">${money(row.gapWithCoverage)}</td><td class="number calculated">${multiple(row.funnelToCashGap)}</td><td class="calculated">${row.lastReview ? new Date(`${row.lastReview}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</td><td class="calculated ${row.consistency === "OK" ? "cell-ok" : "cell-error"}">${row.consistency}</td></tr>`; }).join("")}
    </tbody></table></div></section>` : ""}`;
}

function renderTeam() {
  const executive = currentExecutive();
  const overview = `<section class="section"><div class="section-heading"><div><h2>Visão da equipe</h2><p>Comparativo acumulado até ${MONTHS[state.settings.referenceMonth-1]}.</p></div></div>${teamTable()}</section>`;
  if (!executive) return overview + executiveRequired("Selecione um executivo para o detalhamento", "O comparativo acima permanece consolidado; o painel detalhado exige uma seleção explícita.");
  const row = model.team.find(x => x.id === executive.id);
  const ref = row.refRow;
  return `${overview}
    <section class="section"><div class="section-heading"><div><h2>Painel do executivo · ${esc(executive.name)}</h2><p>Situação do mês, cobertura, diagnóstico e carteira.</p></div></div>
      <div class="grid-3">
        <article class="input-card"><h3>1 · Situação do mês</h3><div class="rank-list"><div class="rank-row"><span>Meta oficial</span><div></div><strong>${money(ref.target)}</strong></div><div class="rank-row"><span>Carry recebido</span><div></div><strong>${money(ref.carryIn)}</strong></div><div class="rank-row"><span>Objetivo gerencial</span><div></div><strong>${money(ref.objective)}</strong></div><div class="rank-row"><span>Won no mês</span><div></div><strong>${money(ref.wonValue)}</strong></div></div></article>
        <article class="input-card"><h3>2 · Cobertura e gap</h3><div class="rank-list"><div class="rank-row"><span>Funil em aberto</span><div></div><strong>${money(ref.openPipeline)}</strong></div><div class="rank-row"><span>Funil ponderado</span><div></div><strong>${money(ref.weightedPipeline)}</strong></div><div class="rank-row"><span>Meta coberta</span><div></div><strong>${money(ref.covered)}</strong></div><div class="rank-row"><span>Gap oficial</span><div></div><strong>${money(ref.gapOfficial)}</strong></div></div></article>
        <article class="input-card"><h3>3 · Diagnóstico</h3><div class="rank-list"><div class="rank-row"><span>Win rate</span><div></div><strong>${pct(ref.winRate)}</strong></div><div class="rank-row"><span>Ticket realizado</span><div></div><strong>${ref.realizedTicket == null ? "—" : money(ref.realizedTicket)}</strong></div><div class="rank-row"><span>Cobertura</span><div></div><strong>${pct(row.coverage)}</strong></div><div class="rank-row"><span>Funil mensal ÷ falta do mês</span><div></div><strong>${multiple(ref.funnelToCashGap)}</strong></div></div></article>
      </div>
    </section>`;
}

function renderPlan() {
  const executive = currentExecutive();
  if (!executive) return executiveRequired("Selecione um executivo", "O plano M+3 e os compromissos são calculados para um responsável específico.");
  const plan = actionPlan(state, model, executive.id);
  return `<section class="section"><div class="section-heading"><div><h2>${esc(executive.name)} · plano financeiro M+3</h2><p>Conversão do gap em vendas, oportunidades e prospects.</p></div><span class="badge ${plan.triggered ? "amber" : "green"}">${plan.triggered ? "Plano acionado" : "Gap imaterial"}</span></div>
    <div class="kpi-grid">
      ${kpi("Meta oficial M+3", money(plan.future?.target || 0), plan.future ? `${MONTHS[plan.future.monthOfYear-1]} · ${plan.future.year}` : "fora do horizonte")}
      ${kpi("Falta base M+3", money(plan.futureBaseGap), "meta menos cobertura ponderada")}
      ${kpi("Déficit do mês", money(plan.current?.gapWithCoverage || 0), "com carry")}
      ${kpi("Receita nova necessária", money(plan.revenueNeeded), `${pct(state.params.cycle.m3)} no M+3`)}
      ${kpi("Oportunidades", number(plan.opportunities,1), `recomendado: ${plan.recommendedOpp}`)}
      ${kpi("Prospects", number(plan.prospects,1), `recomendado: ${plan.recommendedProspects}`)}
    </div></section>
    <section class="section grid-2">
      <article class="panel"><div class="panel-header"><h3>Distribuição da receita esperada</h3></div><div class="panel-body"><div class="rank-list"><div class="rank-row"><span>M+2</span><div class="rank-track"><div class="rank-fill" style="width:${state.params.cycle.m2*100}%"></div></div><strong>${money(plan.expectedM2)}</strong></div><div class="rank-row"><span>M+3</span><div class="rank-track"><div class="rank-fill" style="width:${state.params.cycle.m3*100}%"></div></div><strong>${money(plan.expectedM3)}</strong></div><div class="rank-row"><span>M+4</span><div class="rank-track"><div class="rank-fill" style="width:${state.params.cycle.m4*100}%"></div></div><strong>${money(plan.expectedM4)}</strong></div></div></div></article>
      <article class="panel"><div class="panel-header"><h3>Execução do mês</h3></div><div class="panel-body"><div class="rank-list"><div class="rank-row"><span>Prospects</span><div></div><strong>${plan.commitment.actualProspects} / ${plan.commitment.committedProspects}</strong></div><div class="rank-row"><span>Oportunidades</span><div></div><strong>${plan.commitment.actualOpportunities} / ${plan.commitment.committedOpportunities}</strong></div><div class="rank-row"><span>Viabilidade</span><div></div><strong>${plan.commitment.committedProspects > state.params.maxMonthlyProspects || plan.commitment.committedOpportunities > state.params.maxMonthlyOpportunities ? "ACIMA" : "OK"}</strong></div></div></div></article>
    </section>
    <section class="section"><div class="section-heading"><div><h2>Compromissos mensais</h2><p>Azul = preencher; demais colunas são calculadas.</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Período</th><th class="number">Comp. prospects</th><th class="number">Comp. oportunidades</th><th class="number">Prospects realizados</th><th class="number">Oportunidades geradas</th><th class="number">Ating. prospects</th><th class="number">Ating. oportunidades</th><th class="number">Opp. necessárias</th><th class="number">Prospecções necessárias</th><th>Consistência</th></tr></thead><tbody>${model.executives.find(x=>x.executive.id===executive.id).rows.map(row=>{const period=`${MONTHS[row.monthOfYear-1]} de ${row.year}`;const c=commitmentEntry(state,executive.id,row.monthOfYear,row.year);const opp=state.params.profiles[state.params.activeProfile].winRate>0?row.salesMissing/state.params.profiles[state.params.activeProfile].winRate:0;const prosp=state.params.profiles[state.params.activeProfile].prospectConversion>0?opp/state.params.profiles[state.params.activeProfile].prospectConversion:0;const consistency=(n(c.actualProspects)>0&&n(c.committedProspects)===0)||(n(c.actualOpportunities)>0&&n(c.committedOpportunities)===0)?"Realizado sem compromisso":"OK";const fields=[["committedProspects","Compromisso de prospects"],["committedOpportunities","Compromisso de oportunidades"],["actualProspects","Prospects realizados"],["actualOpportunities","Oportunidades geradas"]];return `<tr><td>${period}</td>${fields.map(([field,label])=>`<td class="editable"><input type="number" min="0" step="1" data-kind="commitment" data-exec="${executive.id}" data-year="${row.year}" data-month="${row.monthOfYear}" data-field="${field}" value="${n(c[field])}" aria-label="${label} · ${period}"></td>`).join("")}<td class="number calculated">${n(c.committedProspects)>0?pct(n(c.actualProspects)/n(c.committedProspects)):"—"}</td><td class="number calculated">${n(c.committedOpportunities)>0?pct(n(c.actualOpportunities)/n(c.committedOpportunities)):"—"}</td><td class="number calculated">${number(opp,1)}</td><td class="number calculated">${number(prosp,1)}</td><td class="calculated ${consistency==="OK"?"cell-ok":"cell-error"}">${consistency}</td></tr>`}).join("")}</tbody></table></div>
    </section>
    <section class="section"><div class="section-heading"><div><h2>Ações gerenciais</h2><p>Compromissos executáveis associados ao mês selecionado.</p></div><button class="button primary" type="button" data-add-action>Adicionar ação</button></div>${actionRows(executive.id)}</section>`;
}

function renderGoals() {
  const executive = currentExecutive();
  const planning = `<section class="section"><div class="section-heading"><div><h2>Planejamento anual</h2><p>Metas, vigência, sazonalidade e carteira.</p></div></div>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>Executivo</th><th class="number">Mês inicial</th><th class="number">Mês final</th><th class="number">Meta do exercício</th><th class="number">% T1</th><th class="number">% T2</th><th class="number">% T3</th><th class="number">% T4</th><th class="number">Contas</th><th>Validação</th></tr></thead><tbody>${state.executives.map(e=>{const valid=Math.abs(e.quarterShares.reduce((s,x)=>s+n(x),0)-1)<.00001&&e.startMonth<=e.endMonth;return `<tr><td>${e.id}</td><td><strong>${esc(e.name)}</strong></td><td class="editable"><input type="number" min="1" max="12" data-kind="executive" data-exec="${e.id}" data-field="startMonth" value="${e.startMonth}" aria-label="Mês inicial · ${esc(e.name)}"></td><td class="editable"><input type="number" min="1" max="12" data-kind="executive" data-exec="${e.id}" data-field="endMonth" value="${e.endMonth}" aria-label="Mês final · ${esc(e.name)}"></td><td class="editable"><input type="number" min="0" step="1000" data-kind="executive" data-exec="${e.id}" data-field="annualTarget" value="${e.annualTarget}" aria-label="Meta do exercício · ${esc(e.name)}"></td>${e.quarterShares.map((q,i)=>`<td class="editable"><input type="number" min="0" max="100" step="0.1" data-pct="1" data-kind="quarter" data-exec="${e.id}" data-index="${i}" value="${toPct(q)}" aria-label="Percentual T${i+1} · ${esc(e.name)}"></td>`).join("")}<td class="editable"><input type="number" min="0" data-kind="executive" data-exec="${e.id}" data-field="totalAccounts" value="${e.totalAccounts}" aria-label="Total de contas · ${esc(e.name)}"></td><td class="calculated ${valid?"cell-ok":"cell-error"}">${valid?"OK":"REVISAR"}</td></tr>`}).join("")}</tbody></table></div></section>`;
  if (!executive) return planning + executiveRequired("Selecione um executivo para editar a sazonalidade", "A tabela geral permanece disponível; pesos mensais e metas calculadas exigem uma seleção explícita.");
  const baseYear = Number(state.settings.baseYear);
  const targets = monthlyTargets(executive);
  return `${planning}
    <section class="section"><div class="section-heading"><div><h2>Distribuição mensal · ${esc(executive.name)}</h2><p>Percentual da meta do trimestre em cada mês (cada trimestre deve fechar 100%). Férias ou ausência: reduza o mês e compense nos outros dois.</p></div></div><div class="panel"><div class="panel-body horizontal-scroll"><div class="month-weights">${executive.monthWeights.map((w,i)=>`<label class="month-weight">${MONTHS[i].slice(0,3)}<input type="number" min="0" max="100" step="0.1" data-kind="month-weight" data-exec="${executive.id}" data-index="${i}" value="${Math.round(n(w)*100)/100}" aria-label="Peso de ${MONTHS[i]} · ${esc(executive.name)}"></label>`).join("")}</div></div></div></section>
    <section class="section"><div class="section-heading"><div><h2>Metas mensais calculadas</h2></div></div><div class="table-wrap"><table><thead><tr>${targets.map((_,i)=>`<th class="number">${MONTHS[i%12]} · ${baseYear+Math.floor(i/12)}</th>`).join("")}</tr></thead><tbody><tr>${targets.map(v=>`<td class="number calculated">${money(v)}</td>`).join("")}</tr></tbody></table></div></section>`;
}

function renderTicket() {
  return `<section class="section grid-2"><article><div class="section-heading"><div><h2>Linhas de negócio</h2><p>Cadastro e ticket médio.</p></div></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Linha</th><th class="number">Ticket médio</th><th>Validação</th></tr></thead><tbody>${state.businessLines.map(line=>`<tr><td>${line.id}</td><td class="editable"><input type="text" data-kind="line" data-line="${line.id}" data-field="name" value="${esc(line.name)}" aria-label="Nome da linha ${line.id}"></td><td class="editable"><input type="number" min="0" step="1000" data-kind="line" data-line="${line.id}" data-field="ticket" value="${line.ticket}" aria-label="Ticket médio · ${esc(line.name)}"></td><td class="calculated ${line.ticket>0?"cell-ok":"cell-error"}">${line.ticket>0?"OK":"REVISAR"}</td></tr>`).join("")}</tbody></table></div></article>
    <article><div class="section-heading"><div><h2>Ticket planejado</h2><p>Resultado do mix anual.</p></div></div><div class="panel"><div class="panel-body">${state.executives.map(e=>`<div class="rank-row" style="margin-bottom:14px"><span>${esc(e.name)}</span><div></div><strong>${money(plannedTicket(e,state.businessLines))}</strong></div>`).join("")}</div></div></article></section>
    <section class="section"><div class="section-heading"><div><h2>Mix anual por executivo</h2><p>A soma de cada linha deve ser igual a 100%.</p></div></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Executivo</th>${state.businessLines.map(l=>`<th class="number">${esc(l.name)}</th>`).join("")}<th class="number">Vendas necessárias</th><th class="number">Ticket planejado</th><th>Validação</th></tr></thead><tbody>${state.executives.map(e=>{const sum=Object.values(e.mix).reduce((s,x)=>s+n(x),0);const ticket=plannedTicket(e,state.businessLines);return `<tr><td>${e.id}</td><td><strong>${esc(e.name)}</strong></td>${state.businessLines.map(l=>`<td class="editable"><input type="number" min="0" max="100" step="0.1" data-pct="1" data-kind="mix" data-exec="${e.id}" data-line="${l.id}" value="${toPct(e.mix[l.id])}" aria-label="Mix de ${esc(l.name)} · ${esc(e.name)}"></td>`).join("")}<td class="number calculated">${ticket>0?number(e.annualTarget/ticket,2):"—"}</td><td class="number calculated">${money(ticket)}</td><td class="calculated ${Math.abs(sum-1)<.00001?"cell-ok":"cell-error"}">${Math.abs(sum-1)<.00001?"OK":"SOMA ≠ 100%"}</td></tr>`}).join("")}</tbody></table></div></section>`;
}

function paramInput(label, path, value, type="number", step="0.01", note="") {
  const id = `param-${path.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}`;
  const isPct = step === "pct";
  return `<div class="field"><label for="${id}">${label}${isPct ? " (%)" : ""}</label><input id="${id}" type="${type}" ${type==="number"?`step="${isPct ? "0.1" : step}" min="0"`:""} ${isPct ? 'data-pct="1"' : ""} data-kind="param" data-path="${path}" value="${isPct ? toPct(value) : esc(value)}">${note?`<small>${esc(note)}</small>`:""}</div>`;
}

function renderParameters() {
  const profiles = state.params.profiles;
  const cycleSum = n(state.params.cycle.m2)+n(state.params.cycle.m3)+n(state.params.cycle.m4);
  return `<section class="section"><div class="section-heading"><div><h2>Taxas operacionais por perfil</h2><p>O perfil ativo alimenta os cálculos do plano.</p></div></div><div class="panel"><div class="panel-body"><div class="form-grid"><div class="field"><label for="active-profile">Perfil ativo</label><select id="active-profile" data-kind="param" data-path="activeProfile">${Object.keys(profiles).map(p=>`<option ${p===state.params.activeProfile?"selected":""}>${p}</option>`).join("")}</select></div>${Object.entries(profiles).flatMap(([name,p])=>[paramInput(`${name} · Prospecção → Qualificação`,`profiles.${name}.prospectConversion`,p.prospectConversion,"number","pct"),paramInput(`${name} · Qualificação → Won`,`profiles.${name}.winRate`,p.winRate,"number","pct")]).join("")}</div></div></div></section>
    <section class="section grid-3">
      <article class="input-card"><h3>Probabilidade de fechamento por estágio</h3><div class="form-grid">${paramInput("Pipeline","stageWeights.pipeline",state.params.stageWeights.pipeline,"number","pct")}${paramInput("Strong","stageWeights.strong",state.params.stageWeights.strong,"number","pct")}${paramInput("Commit","stageWeights.commit",state.params.stageWeights.commit,"number","pct")}</div></article>
      <article class="input-card"><h3>Ciclo comercial (% da receita nova)</h3><div class="form-grid">${paramInput("M+2","cycle.m2",state.params.cycle.m2,"number","pct")}${paramInput("M+3","cycle.m3",state.params.cycle.m3,"number","pct")}${paramInput("M+4","cycle.m4",state.params.cycle.m4,"number","pct")}</div><p class="${Math.abs(cycleSum-1)<.00001&&state.params.cycle.m3>0?"cell-ok":"cell-error"}">${Math.abs(cycleSum-1)<.00001&&state.params.cycle.m3>0?"OK":"A soma deve ser 100% e M+3 deve ser maior que zero"}</p></article>
      <article class="input-card"><h3>Piso, capacidade e materialidade</h3><div class="form-grid"><div class="field"><label for="apply-floor">Aplicar mínimo de prospecção</label><select id="apply-floor" data-kind="param" data-path="applyFloor"><option value="true" ${state.params.applyFloor?"selected":""}>Sim</option><option value="false" ${!state.params.applyFloor?"selected":""}>Não</option></select></div>${paramInput("Mínimo de prospecção (% das vendas necessárias)","floorFactor",state.params.floorFactor,"number","pct")}${paramInput("Máx. prospects","maxMonthlyProspects",state.params.maxMonthlyProspects,"number","1")}${paramInput("Máx. oportunidades","maxMonthlyOpportunities",state.params.maxMonthlyOpportunities,"number","1")}${paramInput("Materialidade (% do ticket)","materiality",state.params.materiality,"number","pct")}${paramInput("Horizonte","panelHorizon",state.params.panelHorizon,"number","1")}</div></article>
    </section>`;
}


function handleAction(event) {
  const route = event.target.closest("[data-route-jump]");
  if (route) { location.hash = route.dataset.routeJump; return; }

  const openExecutive = event.target.closest("[data-open-exec]");
  if (openExecutive) {
    store.pushUndo({ type: "settings" });
    state.settings.selectedExecutiveId = openExecutive.dataset.openExec;
    store.persist({ type: "settings" });
    syncUndoButton();
    location.hash = "reuniao";
    return;
  }

  const step = event.target.closest("[data-exec-step]");
  if (step) {
    const current = currentExecutive();
    if (!current) return;
    const index = state.executives.findIndex(item => item.id === current.id);
    const next = state.executives[index + Number(step.dataset.execStep)];
    if (next) updateSetting("selectedExecutiveId", next.id);
    return;
  }

  if (event.target.closest("[data-toggle-history]")) {
    managementHistoryOpen = !managementHistoryOpen;
    render();
    return;
  }

  if (event.target.closest("[data-toggle-config]")) {
    configurationUnlocked = !configurationUnlocked;
    render();
    toast(configurationUnlocked ? "Edição administrativa habilitada." : "Configuração protegida.");
    return;
  }

  if (event.target.closest("[data-add-action]")) {
    const executive = currentExecutive();
    if (!executive) { toast("Selecione um executivo antes de adicionar uma ação."); return; }
    const id = store.newId();
    const ref = { type: "action", id };
    store.pushUndo(ref);
    const due = new Date();
    due.setDate(due.getDate() + 7);
    state.actions.push({
      id, executiveId: executive.id, month: state.settings.referenceMonth, year: state.settings.year, week: currentWeek(),
      description: "Nova ação", owner: executive.name, dueDate: due.toISOString().slice(0, 10),
      priority: "Alta", status: "Aberta", createdAt: new Date().toISOString(), completedAt: null,
    });
    audit(`${executive.id} · nova ação`, "", "Nova ação");
    store.persist(ref);
    syncUndoButton();
    render();
    toast("Ação adicionada.");
    return;
  }

  if (event.target.closest("[data-snapshot]")) {
    const executive = currentExecutive();
    if (!executive) { toast("Selecione um executivo antes de registrar o snapshot."); return; }
    const id = store.newId();
    const ref = { type: "snapshot", id };
    store.pushUndo(ref);
    const row = selectedRow();
    const team = model.team.find(item => item.id === executive.id);
    const commitment = commitmentEntry(state, executive.id, state.settings.referenceMonth, state.settings.year);
    state.snapshots.push({
      id, at: new Date().toISOString(), year: state.settings.year, month: state.settings.referenceMonth, week: currentWeek(), executiveId: executive.id,
      attainment: team.attainment, forecast: team.forecast,
      gapToSell: Math.max(0, row.target - row.wonValue), gapWithCoverage: row.gapWithCoverage,
      openPipeline: row.openPipeline, weightedPipeline: row.weightedPipeline, funnelMultiple: row.funnelToCashGap,
      committedProspects: n(commitment.committedProspects), committedOpportunities: n(commitment.committedOpportunities),
      actualProspects: n(commitment.actualProspects), actualOpportunities: n(commitment.actualOpportunities),
      openActions: state.actions.filter(a => a.executiveId === executive.id && a.status !== "Concluída").length,
    });
    audit(`${executive.id} · snapshot`, "", `${state.settings.year}-${state.settings.referenceMonth}`);
    store.persist(ref);
    syncUndoButton();
    render();
    toast("Snapshot semanal registrado.");
  }
}

function currentWeek() { return Math.min(4, Math.ceil(new Date().getDate() / 7)); }

// Validação mínima no cliente: evita enviar ao banco o que ele recusaria.
function validateEdit(kind, field, value) {
  if (typeof value === "number" && !Number.isFinite(value)) return "Valor numérico inválido.";
  if (kind === "management" && field !== "managerAdjustment" && value < 0) return "Valores do funil e de resultado não podem ser negativos.";
  if (kind === "commitment" && value < 0) return "Compromissos não podem ser negativos.";
  if (kind === "executive" && ["startMonth", "endMonth"].includes(field) && (value < 1 || value > 12)) return "Mês deve estar entre 1 e 12.";
  if (kind === "executive" && ["annualTarget", "totalAccounts"].includes(field) && value < 0) return "Valor não pode ser negativo.";
  if (kind === "line" && field === "ticket" && value <= 0) return "Ticket deve ser maior que zero.";
  if (["quarter", "mix"].includes(kind) && (value < 0 || value > 1)) return "Informe um percentual entre 0 e 100.";
  if (kind === "month-weight" && value < 0) return "Peso não pode ser negativo.";
  return null;
}

function handleEdit(event) {
  const input = event.target.closest("[data-kind]");
  if (!input) return;
  const ref = refFor(input);
  if (!ref) return;
  const numeric = input.type === "number";
  let value = numeric ? Number(input.value) : input.value;
  if (numeric && input.dataset.pct) value = Math.round(value * 10000) / 1000000;   // 25 -> 0.25 (o engine trabalha com frações)
  const kind = input.dataset.kind;
  const problem = validateEdit(kind, input.dataset.field, value);
  if (problem) { toast(problem); queueRender(); return; }
  store.pushUndo(ref);
  let previous;
  let label;

  if (kind === "management") {
    let item = state.managementEntries.find(x => x.executiveId === input.dataset.exec && Number(x.year) === ref.year && Number(x.month) === ref.month);
    if (!item) { item = inputEntry(state, input.dataset.exec, ref.month, ref.year); state.managementEntries.push(item); }
    previous = item[input.dataset.field]; item[input.dataset.field] = value; item.lastReview = new Date().toISOString().slice(0, 10);
    label = `${input.dataset.exec} · ${ref.year}-${ref.month} · ${input.dataset.field}`;
  } else if (kind === "commitment") {
    let item = state.commitments.find(x => x.executiveId === input.dataset.exec && Number(x.year) === ref.year && Number(x.month) === ref.month);
    if (!item) { item = commitmentEntry(state, input.dataset.exec, ref.month, ref.year); state.commitments.push(item); }
    previous = item[input.dataset.field]; item[input.dataset.field] = value; label = `${input.dataset.exec} · compromisso ${ref.year}-${ref.month} · ${input.dataset.field}`;
  } else if (["executive", "quarter", "month-weight", "mix"].includes(kind)) {
    const executive = state.executives.find(x => x.id === input.dataset.exec);
    if (kind === "executive") {
      previous = executive[input.dataset.field]; executive[input.dataset.field] = value; label = `${executive.id} · ${input.dataset.field}`;
      if (executive.startMonth > executive.endMonth) { store.undo(); state = store.state; syncUndoButton(); toast("Mês inicial não pode ser maior que o mês final."); queueRender(); return; }
    }
    if (kind === "quarter") { const index = Number(input.dataset.index); previous = executive.quarterShares[index]; executive.quarterShares[index] = value; label = `${executive.id} · T${index + 1}`; }
    if (kind === "month-weight") { const index = Number(input.dataset.index); previous = executive.monthWeights[index]; executive.monthWeights[index] = value; label = `${executive.id} · peso ${MONTHS[index]}`; }
    if (kind === "mix") { previous = executive.mix[input.dataset.line]; executive.mix[input.dataset.line] = value; label = `${executive.id} · mix ${input.dataset.line}`; }
  } else if (kind === "line") {
    const line = state.businessLines.find(x => x.id === input.dataset.line); previous = line[input.dataset.field]; line[input.dataset.field] = value; label = `${line.id} · ${input.dataset.field}`;
  } else if (kind === "param") {
    const parts = input.dataset.path.split("."); let target = state.params;
    for (const part of parts.slice(0, -1)) target = target[part];
    if (input.dataset.path === "applyFloor") value = input.value === "true";
    previous = target[parts.at(-1)]; target[parts.at(-1)] = value; label = `Parâmetro · ${input.dataset.path}`;
    if (input.dataset.path === "activeProfile") {
      const profile = state.params.profiles[value];
      if (profile) { state.params.maxMonthlyProspects = profile.maxProspects ?? state.params.maxMonthlyProspects; state.params.maxMonthlyOpportunities = profile.maxOpportunities ?? state.params.maxMonthlyOpportunities; }
    }
    if (["maxMonthlyProspects", "maxMonthlyOpportunities"].includes(input.dataset.path)) {
      const profile = state.params.profiles[state.params.activeProfile];
      if (profile) { if (input.dataset.path === "maxMonthlyProspects") profile.maxProspects = value; else profile.maxOpportunities = value; }
    }
  } else if (kind === "meeting-note") {
    let note = state.meetingNotes.find(item => item.executiveId === input.dataset.exec && Number(item.month) === ref.month && Number(item.year) === ref.year);
    if (!note) { note = { executiveId: input.dataset.exec, month: ref.month, year: ref.year, text: "", updatedAt: "" }; state.meetingNotes.push(note); }
    previous = note.text; note.text = value; note.updatedAt = new Date().toISOString(); label = `${input.dataset.exec} · observações da reunião`;
  } else if (kind === "action") {
    const action = state.actions.find(item => item.id === input.dataset.action);
    if (!action) return;
    previous = action[input.dataset.field]; action[input.dataset.field] = value; action.updatedAt = new Date().toISOString();
    if (input.dataset.field === "status") action.completedAt = value === "Concluída" ? new Date().toISOString() : null;
    label = `${action.id} · ${input.dataset.field}`;
  }
  if (previous === value) { store.discardLastUndo(); syncUndoButton(); return; }   // nada mudou (ex.: blur após edição já salva)
  audit(label, previous, value);
  store.persist(ref);
  syncUndoButton();
  queueRender();
}
