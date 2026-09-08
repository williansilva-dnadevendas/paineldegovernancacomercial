import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { actionPlan, calculateModel, calculateExecutive, monthlyTargets, plannedTicket } from "../engine/engine.js";

const state = JSON.parse(await fs.readFile(new URL("./fixtures/state-exemplo.json", import.meta.url), "utf8"));

function close(actual, expected, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} deveria ser ${expected}`);
}

test("ticket médio planejado replica o mix da planilha", () => {
  close(plannedTicket(state.executives[0], state.businessLines), 52434.45692883895, 0.0001);
});

test("distribuição mensal considera pesos e sazonalidade", () => {
  const eduardo = monthlyTargets(state.executives[0]);
  const felipe = monthlyTargets(state.executives[1]);
  close(eduardo[6], 0);
  close(eduardo[7], 250000);
  close(felipe[6], 100000);
  close(felipe[7], 200000);
});

test("dashboard consolidado reconcilia com a planilha corrigida", () => {
  const dashboard = calculateModel(state).dashboard;
  close(dashboard.ytdTarget, 4533333.333333334);
  close(dashboard.wonYtd, 233600);
  close(dashboard.attainment, 0.05152941176470587, 1e-10);
  close(dashboard.forecast, 1534150);
  close(dashboard.projectedGap, 5465850);
  close(dashboard.openBacklog, 4282500);
  close(dashboard.funnelMultiple, 0.6329067155355877, 1e-10);
  close(dashboard.coverage, 0.0475, 1e-10);
});

test("carry transfere somente excedente positivo e reinicia no mês 13", () => {
  const custom = structuredClone(state);
  custom.managementEntries.push({ executiveId: "EXE-01", month: 1, wonValue: 300000, wonQty: 1 });
  const rows = calculateExecutive(custom, custom.executives[0]).rows;
  assert.ok(rows[0].surplus > 0);
  close(rows[1].carryIn, rows[0].surplus);
  close(rows[12].carryIn, 0);
});

test("validação exige coerência entre Lost valor e quantidade", () => {
  const custom = structuredClone(state);
  custom.managementEntries.push({ executiveId: "EXE-01", month: 1, lostValue: 10000, lostQty: 0 });
  const row = calculateExecutive(custom, custom.executives[0]).rows[0];
  assert.match(row.consistency, /Lost valor × qtd/);
});

test("dados realizados são isolados por exercício", () => {
  const custom = structuredClone(state);
  custom.settings.year = custom.settings.baseYear + 1;
  const dashboard = calculateModel(custom).dashboard;
  close(dashboard.wonYtd, 0);
  close(dashboard.forecast, 0);
});

test("fator do piso governa o mínimo de prospecção", () => {
  const custom = structuredClone(state);
  custom.params.floorFactor = 0;
  const plan = actionPlan(custom, calculateModel(custom), "EXE-01");
  close(plan.floorOpp, 0);
  close(plan.floorProspects, 0);
});

test("forecast individual está disponível para snapshots", () => {
  const team = calculateModel(state).team.find(item => item.id === "EXE-01");
  assert.ok(Number.isFinite(team.forecast));
  close(team.forecast, 262000);
});

test("validação sinaliza valores negativos", () => {
  const custom = structuredClone(state);
  custom.managementEntries.push({ executiveId: "EXE-01", year: 2026, month: 1, pipeline: -1000, activeAccounts: -1 });
  const row = calculateExecutive(custom, custom.executives[0]).rows[0];
  assert.match(row.consistency, /Valor negativo/);
});
