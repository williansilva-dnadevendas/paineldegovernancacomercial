// store.js — estado em memória no formato do engine, mapeamento para o banco
// e gravação por entidade. Não conhece DOM; recebe uma "api" injetada
// (app/api.js em produção, um objeto simulado nos testes).

const round4 = v => Math.round(v * 10000) / 10000;
const n = v => Number(v) || 0;
const frac = pctValue => n(pctValue) / 100;            // 25 -> 0.25
const pct = fracValue => round4(n(fracValue) * 100);   // 0.25 -> 25

// Converte pesos livres (v0.4) em % por trimestre (fecham 100 com tolerância de 0,01 p.p.;
// o engine normaliza por trimestre, então terços ficam exatos).
export function monthWeightsToPct(weights) {
  const out = [];
  for (let qtr = 0; qtr < 4; qtr++) {
    const w = [0, 1, 2].map(i => n(weights?.[qtr * 3 + i]));
    const sum = w.reduce((a, b) => a + b, 0);
    const p = sum > 0 ? w.map(x => round4(x / sum * 100)) : [33.3333, 33.3333, 33.3334];
    out.push(...p);
  }
  return out;
}

// ---------------------------------------------------------------- DB -> engine
export function buildState(ws, { referenceMonth, year, selectedExecutiveId } = {}) {
  const client = ws.client || {};
  const params = ws.parameters || {};
  const baseYear = Number(client.base_year || new Date().getFullYear());
  const lines = (ws.lines || []).filter(l => l.active !== false);
  const execs = (ws.executives || []).filter(e => e.active !== false);
  const lineCodeByUuid = Object.fromEntries(lines.map(l => [l.id, l.code]));
  const execCodeByUuid = Object.fromEntries(execs.map(e => [e.id, e.code]));
  const profiles = {};
  for (const [name, p] of Object.entries(params.profiles || {})) {
    profiles[name] = { prospectConversion: frac(p.prospect_conversion_pct), winRate: frac(p.win_rate_pct), maxProspects: n(p.max_prospects), maxOpportunities: n(p.max_opportunities) };
  }
  const activeProfile = params.default_profile && profiles[params.default_profile] ? params.default_profile : Object.keys(profiles)[0] || "End-to-End";
  profiles[activeProfile] ||= { prospectConversion: .2, winRate: .2, maxProspects: 150, maxOpportunities: 35 };

  const state = {
    settings: {
      manager: client.manager_name || "",
      baseYear,
      year: Number(year || baseYear),
      referenceMonth: Number(referenceMonth || new Date().getMonth() + 1),
      selectedExecutiveId: selectedExecutiveId || "",
      currentUser: ws.user?.name || ws.user?.email || "",
      clientName: client.name || "",
    },
    params: {
      activeProfile,
      profiles,
      stageWeights: { pipeline: frac(params.stage_probability?.pipeline ?? 20), strong: frac(params.stage_probability?.strong ?? 50), commit: frac(params.stage_probability?.commit ?? 90) },
      cycle: { m2: frac(params.cycle?.m2 ?? 20), m3: frac(params.cycle?.m3 ?? 60), m4: frac(params.cycle?.m4 ?? 20) },
      applyFloor: params.apply_floor !== false,
      floorFactor: frac(params.floor_pct ?? 100),
      maxMonthlyProspects: profiles[activeProfile].maxProspects,
      maxMonthlyOpportunities: profiles[activeProfile].maxOpportunities,
      materiality: frac(params.materiality_pct ?? 50),
      panelHorizon: Number(params.horizon_months || 12),
      thresholds: params.thresholds || {},
      weeksPerMonth: Number(params.weeks_per_month || 4),
    },
    businessLines: lines.map(l => ({ id: l.code, uuid: l.id, name: l.name, ticket: n(l.ticket) })),
    executives: execs.map(e => {
      const mix = {};
      for (const m of ws.mix || []) if (m.executive_id === e.id && lineCodeByUuid[m.line_id]) mix[lineCodeByUuid[m.line_id]] = frac(m.pct);
      for (const l of lines) mix[l.code] ??= 0;
      return {
        id: e.code, uuid: e.id, name: e.name, profile: e.profile || activeProfile,
        startMonth: Number(e.start_month || 1), endMonth: Number(e.end_month || 12),
        annualTarget: n(e.annual_target),
        quarterShares: (e.quarter_pct || [25, 25, 25, 25]).map(frac),
        monthWeights: (e.month_pct || Array(12).fill(33.3333)).map(n), // % por trimestre funcionam como pesos (o engine normaliza por trimestre)
        totalAccounts: n(e.total_accounts), mix,
      };
    }),
    managementEntries: (ws.entries || []).filter(x => execCodeByUuid[x.executive_id]).map(x => ({
      executiveId: execCodeByUuid[x.executive_id], year: Number(x.year), month: Number(x.month),
      pipeline: n(x.pipeline), strong: n(x.strong), commit: n(x.commit), wonValue: n(x.won_value), wonQty: n(x.won_qty),
      lostValue: n(x.lost_value), lostQty: n(x.lost_qty), activeAccounts: n(x.active_accounts),
      managerAdjustment: n(x.manager_adjustment), adjustmentReason: x.adjustment_reason || "", lastReview: x.last_review || "",
    })),
    commitments: (ws.commitments || []).filter(x => execCodeByUuid[x.executive_id]).map(x => ({
      executiveId: execCodeByUuid[x.executive_id], year: Number(x.year), month: Number(x.month),
      committedProspects: n(x.committed_prospects), committedOpportunities: n(x.committed_opportunities),
      actualProspects: n(x.actual_prospects), actualOpportunities: n(x.actual_opportunities),
    })),
    actions: (ws.actions || []).filter(a => execCodeByUuid[a.executive_id]).map(a => ({
      id: a.id, executiveId: execCodeByUuid[a.executive_id], year: Number(a.origin_year), month: Number(a.origin_month), week: a.origin_week || null,
      description: a.description || "", owner: a.owner || "", dueDate: a.due_date || "", priority: a.priority || "Alta", status: a.status || "Aberta",
      createdAt: a.created_at, completedAt: a.completed_at || null,
    })),
    snapshots: (ws.snapshots || []).filter(s => execCodeByUuid[s.executive_id]).map(s => ({
      id: s.id, at: s.taken_at, year: Number(s.year), month: Number(s.month), week: s.week || null, executiveId: execCodeByUuid[s.executive_id],
      attainment: s.attainment == null ? null : n(s.attainment), forecast: s.forecast == null ? null : n(s.forecast),
      gapWithCoverage: n(s.gap_to_cover), gapToSell: n(s.gap_to_sell), openPipeline: n(s.open_pipeline), weightedPipeline: n(s.weighted_pipeline),
      funnelMultiple: s.funnel_coverage_pct == null ? null : frac(s.funnel_coverage_pct),
    })),
    meetingNotes: (ws.notes || []).filter(x => execCodeByUuid[x.executive_id]).map(x => ({
      executiveId: execCodeByUuid[x.executive_id], year: Number(x.year), month: Number(x.month), text: x.text || "", updatedAt: x.updated_at,
    })),
    audit: [],
    _revision: 0,
  };
  return { state, ctx: { clientId: client.id, execUuid: Object.fromEntries(execs.map(e => [e.code, e.id])), lineUuid: Object.fromEntries(lines.map(l => [l.code, l.id])), user: ws.user || {} } };
}

// ---------------------------------------------------------------- engine -> DB rows
export function toRow(state, ctx, ref) {
  const by = state.settings.currentUser || ctx.user?.email || null;
  const exec = code => state.executives.find(e => e.id === code);
  switch (ref.type) {
    case "entry": {
      const x = state.managementEntries.find(i => i.executiveId === ref.exec && Number(i.year) === ref.year && Number(i.month) === ref.month);
      if (!x) return null;
      return { table: "management_entries", onConflict: "executive_id,year,month", row: {
        client_id: ctx.clientId, executive_id: ctx.execUuid[ref.exec], year: ref.year, month: ref.month,
        pipeline: n(x.pipeline), strong: n(x.strong), commit: n(x.commit), won_value: n(x.wonValue), won_qty: Math.round(n(x.wonQty)),
        lost_value: n(x.lostValue), lost_qty: Math.round(n(x.lostQty)), active_accounts: Math.round(n(x.activeAccounts)),
        manager_adjustment: n(x.managerAdjustment), adjustment_reason: x.adjustmentReason || null, last_review: x.lastReview || null, updated_by: by } };
    }
    case "commitment": {
      const x = state.commitments.find(i => i.executiveId === ref.exec && Number(i.year) === ref.year && Number(i.month) === ref.month);
      if (!x) return null;
      return { table: "commitments", onConflict: "executive_id,year,month", row: {
        client_id: ctx.clientId, executive_id: ctx.execUuid[ref.exec], year: ref.year, month: ref.month,
        committed_prospects: Math.round(n(x.committedProspects)), committed_opportunities: Math.round(n(x.committedOpportunities)),
        actual_prospects: Math.round(n(x.actualProspects)), actual_opportunities: Math.round(n(x.actualOpportunities)), updated_by: by } };
    }
    case "executive": {
      const e = exec(ref.exec); if (!e) return null;
      return { table: "executives", onConflict: "id", row: {
        id: ctx.execUuid[ref.exec], client_id: ctx.clientId, code: e.id, name: e.name, profile: e.profile || state.params.activeProfile,
        start_month: Number(e.startMonth), end_month: Number(e.endMonth), annual_target: n(e.annualTarget),
        quarter_pct: e.quarterShares.map(pct), month_pct: monthWeightsToPct(e.monthWeights), total_accounts: Math.round(n(e.totalAccounts)) } };
    }
    case "mix": {
      const e = exec(ref.exec); if (!e) return null;
      return { table: "executive_mix", onConflict: "executive_id,line_id", rows: state.businessLines.map(l => ({
        client_id: ctx.clientId, executive_id: ctx.execUuid[ref.exec], line_id: ctx.lineUuid[l.id], pct: pct(e.mix?.[l.id] ?? 0) })) };
    }
    case "line": {
      const l = state.businessLines.find(x => x.id === ref.line); if (!l) return null;
      return { table: "business_lines", onConflict: "id", row: { id: ctx.lineUuid[ref.line], client_id: ctx.clientId, code: l.id, name: l.name, ticket: n(l.ticket) } };
    }
    case "parameters": {
      const p = state.params; const profiles = {};
      for (const [name, pr] of Object.entries(p.profiles)) profiles[name] = {
        prospect_conversion_pct: pct(pr.prospectConversion), win_rate_pct: pct(pr.winRate),
        max_prospects: name === p.activeProfile ? Math.round(n(p.maxMonthlyProspects)) : Math.round(n(pr.maxProspects ?? 150)),
        max_opportunities: name === p.activeProfile ? Math.round(n(p.maxMonthlyOpportunities)) : Math.round(n(pr.maxOpportunities ?? 35)) };
      return { table: "parameters", onConflict: "client_id", row: {
        client_id: ctx.clientId, profiles, default_profile: p.activeProfile,
        stage_probability: { pipeline: pct(p.stageWeights.pipeline), strong: pct(p.stageWeights.strong), commit: pct(p.stageWeights.commit) },
        cycle: { m2: pct(p.cycle.m2), m3: pct(p.cycle.m3), m4: pct(p.cycle.m4) },
        apply_floor: !!p.applyFloor, floor_pct: pct(p.floorFactor), materiality_pct: pct(p.materiality), horizon_months: Number(p.panelHorizon) || 12 } };
    }
    case "note": {
      const x = state.meetingNotes.find(i => i.executiveId === ref.exec && Number(i.year) === ref.year && Number(i.month) === ref.month);
      if (!x) return null;
      return { table: "meeting_notes", onConflict: "executive_id,year,month", row: { client_id: ctx.clientId, executive_id: ctx.execUuid[ref.exec], year: ref.year, month: ref.month, text: x.text || "", updated_by: by } };
    }
    case "action": {
      const a = state.actions.find(i => i.id === ref.id);
      if (!a) return { table: "actions", delete: { id: ref.id } };
      return { table: "actions", onConflict: "id", row: {
        id: a.id, client_id: ctx.clientId, executive_id: ctx.execUuid[a.executiveId], description: a.description || "", owner: a.owner || "",
        due_date: a.dueDate || null, priority: a.priority, status: a.status, origin_year: Number(a.year), origin_month: Number(a.month), origin_week: a.week || null,
        completed_at: a.status === "Concluída" ? (a.completedAt || new Date().toISOString()) : null, updated_by: by } };
    }
    case "snapshot": {
      const s = state.snapshots.find(i => i.id === ref.id);
      if (!s) return { table: "snapshots", delete: { id: ref.id } };
      return { table: "snapshots", onConflict: "id", row: {
        id: s.id, client_id: ctx.clientId, executive_id: ctx.execUuid[s.executiveId], taken_at: s.at, year: Number(s.year), month: Number(s.month), week: s.week || null,
        attainment: s.attainment, forecast: s.forecast, gap_to_sell: s.gapToSell ?? null, gap_to_cover: s.gapWithCoverage, open_pipeline: s.openPipeline, weighted_pipeline: s.weightedPipeline,
        funnel_coverage_pct: s.funnelMultiple == null ? null : pct(s.funnelMultiple),
        committed_prospects: s.committedProspects ?? null, committed_opportunities: s.committedOpportunities ?? null,
        actual_prospects: s.actualProspects ?? null, actual_opportunities: s.actualOpportunities ?? null, open_actions: s.openActions ?? null, taken_by: by } };
    }
    default: return null;
  }
}

export const refKey = ref => [ref.type, ref.exec, ref.year, ref.month, ref.line, ref.id].filter(v => v !== undefined).join("|");

// ---------------------------------------------------------------- Store
export class Store {
  constructor(api, { debounceMs = 350, storage = null, now = () => new Date() } = {}) {
    this.api = api; this.debounceMs = debounceMs; this.storage = storage; this.now = now;
    this.state = null; this.ctx = null;
    this.undoStack = []; this.pending = new Map(); this.inFlight = 0;
    this.listeners = new Set(); this.status = { text: "Dados carregados", tone: "saved" };
  }
  onStatus(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  setStatus(text, tone = "saved") { this.status = { text, tone }; for (const fn of this.listeners) fn(this.status); }

  async load(year) {
    const prefs = this.readPrefs();
    const ws = await this.api.loadWorkspace(year || prefs.year || null);
    if (!ws?.client) throw new Error("Seu e-mail não está vinculado a nenhum cliente. Peça o cadastro ao consultor responsável.");
    const built = buildState(ws, { referenceMonth: prefs.referenceMonth, year: year || prefs.year, selectedExecutiveId: prefs.selectedExecutiveId });
    this.state = built.state; this.ctx = built.ctx;
    this.undoStack = []; this.pending.clear();
    this.setStatus("Dados carregados", "saved");
    return this.state;
  }

  // Preferências de tela (mês de referência, ano, executivo) ficam no navegador de cada usuário.
  readPrefs() { try { return JSON.parse(this.storage?.getItem("gc-prefs") || "{}"); } catch { return {}; } }
  savePrefs() { try { const s = this.state.settings; this.storage?.setItem("gc-prefs", JSON.stringify({ year: s.year, referenceMonth: s.referenceMonth, selectedExecutiveId: s.selectedExecutiveId })); } catch { /* ignorar */ } }

  // Chamar ANTES da mutação; ref = entidade que a mutação vai tocar.
  pushUndo(ref) {
    this.undoStack.push({ snapshot: structuredClone(this.state), ref });
    if (this.undoStack.length > 20) this.undoStack.shift();
  }
  get canUndo() { return this.undoStack.length > 0; }
  discardLastUndo() { this.undoStack.pop(); }
  undo() {
    const last = this.undoStack.pop();
    if (!last) return null;
    const { ref } = last;
    this.state = last.snapshot;
    if (ref && ref.type !== "settings") this.persist(ref);
    if (ref?.type === "settings") this.savePrefs();
    return ref;
  }

  audit(field, previous, next, reason = null) {
    const entry = { at: this.now().toISOString(), user: this.state.settings.currentUser, field, previous, next };
    this.state.audit.unshift(entry); this.state.audit = this.state.audit.slice(0, 100);
    if (this.api.insertAudit) this.api.insertAudit({ client_id: this.ctx.clientId, user_email: this.ctx.user?.email || null, entity: field, field, previous: previous ?? null, next: next ?? null, reason }).catch(() => {});
  }

  // Agenda a gravação da entidade (debounce por entidade).
  persist(ref) {
    if (!ref) return;
    if (ref.type === "settings") { this.savePrefs(); return; }
    const key = refKey(ref);
    clearTimeout(this.pending.get(key)?.timer);
    this.setStatus("Salvando alterações…", "saving");
    const timer = setTimeout(() => { this.pending.delete(key); this.flush(ref); }, this.debounceMs);
    this.pending.set(key, { ref, timer });
  }

  async flush(ref) {
    const spec = toRow(this.state, this.ctx, ref);
    if (!spec) return;
    this.inFlight++;
    try {
      if (spec.delete) await this.api.remove(spec.table, spec.delete);
      else if (spec.rows) await this.api.upsert(spec.table, spec.rows, spec.onConflict);
      else await this.api.upsert(spec.table, spec.row, spec.onConflict);
      this.lastError = null;
      if (--this.inFlight === 0 && this.pending.size === 0) this.setStatus(`Salvo ${this.now().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, "saved");
    } catch (error) {
      this.inFlight--;
      this.lastError = error;
      this.setStatus("Falha ao salvar", "error");
      if (this.onError) this.onError(error, ref);
    }
  }

  async flushAll() { const refs = [...this.pending.values()].map(p => { clearTimeout(p.timer); return p.ref; }); this.pending.clear(); await Promise.all(refs.map(r => this.flush(r))); }

  newId() { return (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`); }
}
