#!/usr/bin/env node
// Gera o SQL de carga inicial (seed) de um cliente a partir de um state.json da v0.4.
// Uso: node scripts/gerar-seed.mjs <state.json> <slug-do-cliente> "<Nome do cliente>" email1[,email2,...] > seed.sql
// O arquivo gerado contém dados do cliente e NÃO deve ser commitado no repositório.
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const [,, statePath, slug, clientName, emailsArg] = process.argv;
if (!statePath || !slug || !clientName || !emailsArg) {
  console.error('Uso: node scripts/gerar-seed.mjs <state.json> <slug> "<Nome do cliente>" email1[,email2]');
  process.exit(1);
}
const s = JSON.parse(fs.readFileSync(statePath, "utf8"));
const emails = emailsArg.split(",").map(e => e.trim()).filter(Boolean);

const q = v => v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`;
const j = v => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const pct = v => Math.round(num(v) * 100 * 10000) / 10000;          // 0.25 -> 25
const round4 = v => Math.round(v * 10000) / 10000;

// Distribuição mensal em % da meta do trimestre (fecha 100 por trimestre).
function monthPct(weights) {
  const out = [];
  for (let qtr = 0; qtr < 4; qtr++) {
    const w = [0, 1, 2].map(i => num(weights?.[qtr * 3 + i]));
    const sum = w.reduce((a, b) => a + b, 0);
    const p = sum > 0 ? w.map(x => round4(x / sum * 100)) : [33.3333, 33.3333, 33.3334];
    out.push(...p);
  }
  return out;
}

const clientId = randomUUID();
const baseYear = num(s.settings?.baseYear || s.settings?.year || new Date().getFullYear());
const lineIds = Object.fromEntries((s.businessLines || []).map(l => [l.id, randomUUID()]));
const execIds = Object.fromEntries((s.executives || []).map(e => [e.id, randomUUID()]));
const p = s.params || {};
const profiles = {};
for (const [name, pr] of Object.entries(p.profiles || {})) {
  profiles[name] = {
    prospect_conversion_pct: pct(pr.prospectConversion),
    win_rate_pct: pct(pr.winRate),
    max_prospects: num(p.maxMonthlyProspects || 150),
    max_opportunities: num(p.maxMonthlyOpportunities || 35),
  };
}
for (const name of ["Hunter", "Farmer", "End-to-End"]) profiles[name] ||= { prospect_conversion_pct: 20, win_rate_pct: 20, max_prospects: 150, max_opportunities: 35 };

const out = [];
out.push(`-- Seed gerado em ${new Date().toISOString()} a partir de ${statePath}`);
out.push(`-- Cliente: ${clientName} (${slug}) · ano-base ${baseYear}`);
out.push(`begin;`);
out.push(`insert into public.clients (id, slug, name, manager_name, base_year) values (${q(clientId)}, ${q(slug)}, ${q(clientName)}, ${q(s.settings?.manager || null)}, ${baseYear});`);
for (const email of emails) out.push(`insert into public.app_users (email, client_id, name) values (${q(email.toLowerCase())}, ${q(clientId)}, null) on conflict (email) do update set client_id = excluded.client_id;`);

out.push(`insert into public.parameters (client_id, profiles, stage_probability, cycle, apply_floor, floor_pct, materiality_pct, horizon_months, default_profile) values (${q(clientId)}, ${j(profiles)}, ${j({ pipeline: pct(p.stageWeights?.pipeline ?? .2), strong: pct(p.stageWeights?.strong ?? .5), commit: pct(p.stageWeights?.commit ?? .9) })}, ${j({ m2: pct(p.cycle?.m2 ?? .2), m3: pct(p.cycle?.m3 ?? .6), m4: pct(p.cycle?.m4 ?? .2) })}, ${p.applyFloor === false ? "false" : "true"}, ${pct(p.floorFactor ?? 1)}, ${pct(p.materiality ?? .5)}, ${num(p.panelHorizon || 12)}, ${q(p.activeProfile || "End-to-End")});`);

(s.businessLines || []).forEach((l, i) => out.push(`insert into public.business_lines (id, client_id, code, name, ticket, sort_order) values (${q(lineIds[l.id])}, ${q(clientId)}, ${q(l.id)}, ${q(l.name)}, ${num(l.ticket)}, ${i});`));

(s.executives || []).forEach((e, i) => {
  out.push(`insert into public.executives (id, client_id, code, name, profile, start_month, end_month, annual_target, quarter_pct, month_pct, total_accounts, sort_order) values (${q(execIds[e.id])}, ${q(clientId)}, ${q(e.id)}, ${q(e.name)}, ${q(e.profile || "End-to-End")}, ${num(e.startMonth || 1)}, ${num(e.endMonth || 12)}, ${num(e.annualTarget)}, ${j((e.quarterShares || [.25, .25, .25, .25]).map(pct))}, ${j(monthPct(e.monthWeights))}, ${num(e.totalAccounts)}, ${i});`);
  for (const l of s.businessLines || []) out.push(`insert into public.executive_mix (client_id, executive_id, line_id, pct) values (${q(clientId)}, ${q(execIds[e.id])}, ${q(lineIds[l.id])}, ${pct(e.mix?.[l.id] ?? 0)});`);
});

for (const x of s.managementEntries || []) {
  if (!execIds[x.executiveId]) continue;
  out.push(`insert into public.management_entries (client_id, executive_id, year, month, pipeline, strong, commit, won_value, won_qty, lost_value, lost_qty, active_accounts, manager_adjustment, adjustment_reason, last_review) values (${q(clientId)}, ${q(execIds[x.executiveId])}, ${num(x.year || baseYear)}, ${num(x.month)}, ${num(x.pipeline)}, ${num(x.strong)}, ${num(x.commit)}, ${num(x.wonValue)}, ${Math.round(num(x.wonQty))}, ${num(x.lostValue)}, ${Math.round(num(x.lostQty))}, ${Math.round(num(x.activeAccounts))}, ${num(x.managerAdjustment)}, ${q(x.adjustmentReason || null)}, ${x.lastReview ? q(x.lastReview) : "null"});`);
}
for (const x of s.commitments || []) {
  if (!execIds[x.executiveId]) continue;
  out.push(`insert into public.commitments (client_id, executive_id, year, month, committed_prospects, committed_opportunities, actual_prospects, actual_opportunities) values (${q(clientId)}, ${q(execIds[x.executiveId])}, ${num(x.year || baseYear)}, ${num(x.month)}, ${Math.round(num(x.committedProspects))}, ${Math.round(num(x.committedOpportunities))}, ${Math.round(num(x.actualProspects))}, ${Math.round(num(x.actualOpportunities))});`);
}
for (const a of s.actions || []) {
  if (!execIds[a.executiveId]) continue;
  out.push(`insert into public.actions (client_id, executive_id, description, owner, due_date, priority, status, origin_year, origin_month, created_at, completed_at) values (${q(clientId)}, ${q(execIds[a.executiveId])}, ${q(a.description || "")}, ${q(a.owner || "")}, ${a.dueDate ? q(a.dueDate) : "null"}, ${q(a.priority || "Alta")}, ${q(a.status || "Aberta")}, ${num(a.year || baseYear)}, ${num(a.month || 1)}, ${a.createdAt ? q(a.createdAt) : "now()"}, ${a.status === "Concluída" ? q(a.updatedAt || a.createdAt || new Date().toISOString()) : "null"});`);
}
for (const sn of s.snapshots || []) {
  if (!execIds[sn.executiveId]) continue;
  out.push(`insert into public.snapshots (client_id, executive_id, taken_at, year, month, attainment, forecast, gap_to_cover, open_pipeline, weighted_pipeline, funnel_coverage_pct) values (${q(clientId)}, ${q(execIds[sn.executiveId])}, ${q(sn.at || new Date().toISOString())}, ${num(sn.year || baseYear)}, ${num(sn.month)}, ${sn.attainment == null ? "null" : num(sn.attainment)}, ${sn.forecast == null ? "null" : num(sn.forecast)}, ${num(sn.gapWithCoverage)}, ${num(sn.openPipeline)}, ${num(sn.weightedPipeline)}, ${sn.funnelMultiple == null ? "null" : round4(num(sn.funnelMultiple) * 100)});`);
}
for (const n of s.meetingNotes || []) {
  if (!execIds[n.executiveId] || !n.text) continue;
  out.push(`insert into public.meeting_notes (client_id, executive_id, year, month, text) values (${q(clientId)}, ${q(execIds[n.executiveId])}, ${num(n.year || baseYear)}, ${num(n.month)}, ${q(n.text)});`);
}
out.push(`commit;`);
out.push(`-- Cliente ${clientName}: ${s.executives?.length || 0} executivos · ${s.businessLines?.length || 0} linhas · ${s.managementEntries?.length || 0} lançamentos · ${s.commitments?.length || 0} compromissos · ${s.actions?.length || 0} ações · ${s.snapshots?.length || 0} snapshots`);
process.stdout.write(out.join("\n") + "\n");
