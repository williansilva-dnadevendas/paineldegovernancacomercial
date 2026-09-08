import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { buildState, toRow, Store, monthWeightsToPct } from "../app/store.js";
import { calculateModel } from "../engine/engine.js";

const original = JSON.parse(await fs.readFile(new URL("./fixtures/state-exemplo.json", import.meta.url), "utf8"));

// Simula o que o banco devolveria em load_workspace() após o seed do mesmo state.
function workspaceFrom(s) {
  const clientId = "c-1";
  const lineUuid = Object.fromEntries(s.businessLines.map((l, i) => [l.id, `l-${i}`]));
  const execUuid = Object.fromEntries(s.executives.map((e, i) => [e.id, `e-${i}`]));
  const p = s.params;
  const P = v => Math.round(v * 100 * 10000) / 10000;
  return {
    client: { id: clientId, slug: "exemplo", name: "Cliente Exemplo", manager_name: s.settings.manager, base_year: s.settings.baseYear },
    user: { email: "gerente@exemplo.com", name: "Gerente" },
    parameters: {
      client_id: clientId, default_profile: p.activeProfile,
      profiles: Object.fromEntries(Object.entries(p.profiles).map(([k, v]) => [k, { prospect_conversion_pct: P(v.prospectConversion), win_rate_pct: P(v.winRate), max_prospects: p.maxMonthlyProspects, max_opportunities: p.maxMonthlyOpportunities }])),
      stage_probability: { pipeline: P(p.stageWeights.pipeline), strong: P(p.stageWeights.strong), commit: P(p.stageWeights.commit) },
      cycle: { m2: P(p.cycle.m2), m3: P(p.cycle.m3), m4: P(p.cycle.m4) },
      apply_floor: p.applyFloor, floor_pct: P(p.floorFactor), materiality_pct: P(p.materiality), horizon_months: p.panelHorizon,
    },
    lines: s.businessLines.map((l, i) => ({ id: lineUuid[l.id], code: l.id, name: l.name, ticket: l.ticket, sort_order: i, active: true })),
    executives: s.executives.map((e, i) => ({ id: execUuid[e.id], code: e.id, name: e.name, profile: "End-to-End", start_month: e.startMonth, end_month: e.endMonth, annual_target: e.annualTarget, quarter_pct: e.quarterShares.map(P), month_pct: monthWeightsToPct(e.monthWeights), total_accounts: e.totalAccounts, sort_order: i, active: true })),
    mix: s.executives.flatMap(e => s.businessLines.map(l => ({ executive_id: execUuid[e.id], line_id: lineUuid[l.id], pct: P(e.mix[l.id] || 0) }))),
    entries: s.managementEntries.map(x => ({ executive_id: execUuid[x.executiveId], year: x.year || s.settings.baseYear, month: x.month, pipeline: x.pipeline, strong: x.strong, commit: x.commit, won_value: x.wonValue, won_qty: x.wonQty, lost_value: x.lostValue, lost_qty: x.lostQty, active_accounts: x.activeAccounts, manager_adjustment: x.managerAdjustment || 0 })),
    commitments: [], actions: [], snapshots: [], notes: [],
  };
}

function fakeApi() {
  const calls = [];
  return { calls,
    async loadWorkspace() { return workspaceFrom(original); },
    async upsert(table, row, onConflict) { calls.push({ op: "upsert", table, row, onConflict }); },
    async remove(table, match) { calls.push({ op: "remove", table, match }); },
    async insertAudit(row) { calls.push({ op: "audit", row }); },
  };
}
const memStorage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const wait = ms => new Promise(r => setTimeout(r, ms));

test("estado carregado do banco reproduz os números do engine da v0.4", () => {
  const { state } = buildState(workspaceFrom(original), { referenceMonth: 8, year: 2026 });
  const a = calculateModel({ ...original, settings: { ...original.settings, referenceMonth: 8, year: 2026, selectedExecutiveId: "" } }).dashboard;
  const b = calculateModel(state).dashboard;
  for (const k of ["ytdTarget", "wonYtd", "forecast", "projectedGap", "funnelMultiple", "coverage"]) assert.ok(Math.abs(a[k] - b[k]) < 0.01, `${k}: ${a[k]} vs ${b[k]}`);
  const ta = calculateModel({ ...original, settings: { ...original.settings, referenceMonth: 8, year: 2026 } }).team;
  const tb = calculateModel(state).team;
  ta.forEach((t, i) => { assert.equal(t.id, tb[i].id); assert.ok(Math.abs(t.gapProjected - tb[i].gapProjected) < 0.01); assert.ok(Math.abs(t.refRow.gapWithCoverage - tb[i].refRow.gapWithCoverage) < 0.01); });
});

test("percentuais mensais fecham 100 por trimestre e preservam pesos 0 / 0,5", () => {
  const p = monthWeightsToPct([1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1]);
  for (let q = 0; q < 4; q++) assert.ok(Math.abs(p.slice(q * 3, q * 3 + 3).reduce((a, b) => a + b, 0) - 100) < 0.001);
  assert.deepEqual(p.slice(6, 9), [0, 50, 50]);
  assert.deepEqual(p.slice(0, 3), [33.3333, 33.3333, 33.3333]);
  const h = monthWeightsToPct([1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1]);
  assert.deepEqual(h.slice(6, 9), [20, 40, 40]);
});

test("mapeamento engine -> linha do banco converte frações em percentuais", () => {
  const { state, ctx } = buildState(workspaceFrom(original), { referenceMonth: 8 });
  const ex = toRow(state, ctx, { type: "executive", exec: "EXE-01" });
  assert.equal(ex.table, "executives"); assert.deepEqual(ex.row.quarter_pct, [25, 25, 25, 25]); assert.equal(ex.row.month_pct[6], 0);
  const pr = toRow(state, ctx, { type: "parameters" });
  assert.equal(pr.row.stage_probability.commit, 90); assert.equal(pr.row.cycle.m3, 60); assert.equal(pr.row.floor_pct, 100); assert.equal(pr.row.materiality_pct, 50);
  assert.equal(pr.row.default_profile, "End-to-End");
  const mx = toRow(state, ctx, { type: "mix", exec: "EXE-01" });
  assert.equal(mx.rows.length, 4); assert.equal(mx.rows.find(r => r.line_id === ctx.lineUuid["LIN-04"]).pct, 55);
});

test("edição grava só a entidade alterada, com debounce", async () => {
  const api = fakeApi(); const store = new Store(api, { debounceMs: 10, storage: memStorage() });
  await store.load();
  const ref = { type: "entry", exec: "EXE-01", year: 2026, month: 8 };
  store.pushUndo(ref);
  const item = store.state.managementEntries.find(x => x.executiveId === "EXE-01" && x.month === 8);
  item.pipeline = 250000; store.persist(ref);
  item.strong = 10000; store.persist(ref);
  await wait(40);
  const ups = api.calls.filter(c => c.op === "upsert");
  assert.equal(ups.length, 1, "duas edições seguidas geram um único upsert");
  assert.equal(ups[0].table, "management_entries"); assert.equal(ups[0].row.pipeline, 250000); assert.equal(ups[0].row.strong, 10000);
  assert.equal(ups[0].onConflict, "executive_id,year,month");
  assert.equal(store.status.tone, "saved");
});

test("desfazer depois do salvamento persiste o valor anterior (defeito R1 da v0.4)", async () => {
  const api = fakeApi(); const store = new Store(api, { debounceMs: 5, storage: memStorage() });
  await store.load();
  const ref = { type: "entry", exec: "EXE-01", year: 2026, month: 8 };
  const before = store.state.managementEntries.find(x => x.executiveId === "EXE-01" && x.month === 8).pipeline;
  store.pushUndo(ref);
  store.state.managementEntries.find(x => x.executiveId === "EXE-01" && x.month === 8).pipeline = 999; store.persist(ref);
  await wait(20);
  store.undo(); await wait(20);
  const ups = api.calls.filter(c => c.op === "upsert");
  assert.equal(ups.length, 2); assert.equal(ups[1].row.pipeline, before);
  assert.equal(store.state.managementEntries.find(x => x.executiveId === "EXE-01" && x.month === 8).pipeline, before);
});

test("desfazer a criação de uma ação exclui a linha no banco", async () => {
  const api = fakeApi(); const store = new Store(api, { debounceMs: 5, storage: memStorage() });
  await store.load();
  const id = "a-1"; const ref = { type: "action", id };
  store.pushUndo(ref);
  store.state.actions.push({ id, executiveId: "EXE-01", year: 2026, month: 8, description: "x", owner: "y", dueDate: "2026-09-10", priority: "Alta", status: "Aberta" });
  store.persist(ref); await wait(20);
  store.undo(); await wait(20);
  const ops = api.calls.filter(c => c.op !== "audit").map(c => c.op);
  assert.deepEqual(ops, ["upsert", "remove"]);
  assert.equal(api.calls.at(-1).match.id, id);
});

test("falha de gravação sinaliza erro e mantém último erro", async () => {
  const api = fakeApi(); api.upsert = async () => { throw new Error("rede indisponível"); };
  const store = new Store(api, { debounceMs: 5, storage: memStorage() });
  await store.load();
  const ref = { type: "note", exec: "EXE-01", year: 2026, month: 8 };
  store.state.meetingNotes.push({ executiveId: "EXE-01", year: 2026, month: 8, text: "obs" });
  store.persist(ref); await wait(20);
  assert.equal(store.status.tone, "error"); assert.match(store.lastError.message, /rede/);
});

test("e-mail sem cliente vinculado gera erro claro", async () => {
  const api = fakeApi(); api.loadWorkspace = async () => ({ client: null });
  const store = new Store(api, { storage: memStorage() });
  await assert.rejects(() => store.load(), /não está vinculado/);
});
