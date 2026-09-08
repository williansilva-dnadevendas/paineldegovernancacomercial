#!/usr/bin/env node
// Exporta todas as tabelas em CSV e envia para o bucket privado "backups" do próprio projeto Supabase.
// Roda no GitHub Actions (semanal) com a chave secreta (sb_secret_... ou service_role) em um segredo — nunca no código.
// Uso local: SUPABASE_SERVICE_ROLE_KEY=... node scripts/backup.mjs
import { SUPABASE_URL } from "../app/config.js";

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("Defina SUPABASE_SERVICE_ROLE_KEY (segredo do repositório)."); process.exit(1); }
const TABLES = ["clients", "app_users", "parameters", "business_lines", "executives", "executive_mix", "management_entries", "commitments", "actions", "snapshots", "meeting_notes", "audit_log"];
// Chaves novas (sb_secret_...) vão só no cabeçalho apikey; chaves legadas (service_role JWT) precisam também do Bearer.
const headers = KEY.startsWith("sb_") ? { apikey: KEY } : { apikey: KEY, Authorization: `Bearer ${KEY}` };
const stamp = new Date().toISOString().slice(0, 10);

const csvCell = v => {
  if (v == null) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = rows => {
  if (!rows.length) return "";
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
  return [cols.join(","), ...rows.map(r => cols.map(c => csvCell(r[c])).join(","))].join("\n");
};

let total = 0;
for (const table of TABLES) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const order = table === "clients" ? "id" : table === "audit_log" ? "id" : "client_id";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=${order}`, { headers: { ...headers, Range: `${from}-${from + 999}`, Prefer: "count=exact" } });
    if (!res.ok && res.status !== 416) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const chunk = res.status === 416 ? [] : await res.json();
    rows.push(...chunk);
    if (chunk.length < 1000) break;
  }
  const body = toCsv(rows);
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/backups/${stamp}/${table}.csv`, { method: "POST", headers: { ...headers, "Content-Type": "text/csv", "x-upsert": "true" }, body });
  if (!up.ok) throw new Error(`upload ${table}: HTTP ${up.status} ${await up.text()}`);
  total += rows.length;
  console.log(`${table.padEnd(20)} ${String(rows.length).padStart(6)} linhas`);
}
console.log(`\nBackup ${stamp} concluído: ${TABLES.length} tabelas, ${total} linhas, no bucket backups/${stamp}/`);
