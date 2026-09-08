// Smoke test de interface: sobe o site estático, substitui app/api.js por uma API simulada
// (sem rede) e percorre login → dashboard → reunião → edição → desfazer → snapshot.
// Uso: node tests/smoke.mjs   (requer playwright + chromium)
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || "playwright");

const root = path.resolve(new URL("..", import.meta.url).pathname);
const fixture = JSON.parse(await fs.readFile(path.join(root, "tests/fixtures/state-exemplo.json"), "utf8"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

const server = http.createServer(async (req, res) => {
  const file = path.join(root, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  try { res.writeHead(200, { "content-type": mime[path.extname(file)] || "text/plain" }); res.end(await fs.readFile(file)); }
  catch { res.writeHead(404); res.end("not found"); }
});
await new Promise(r => server.listen(4180, "127.0.0.1", r));

// Workspace simulado a partir do fixture (mesma lógica dos testes do store).
const wsSource = await fs.readFile(path.join(root, "tests/store.test.mjs"), "utf8");
const fakeApiModule = `
import { monthWeightsToPct } from "./store.js";
const s = ${JSON.stringify(fixture)};
${wsSource.slice(wsSource.indexOf("function workspaceFrom"), wsSource.indexOf("function fakeApi"))}
window.__calls = [];
let session = null;
export const api = {
  async session() { return session; },
  async signIn(email, password) { if (password !== "teste") { throw new Error("Invalid login credentials"); } session = { user: { email } }; return session; },
  async signOut() { session = null; },
  onAuthChange() {},
  async loadWorkspace() { return workspaceFrom(s); },
  async upsert(table, row, onConflict) { window.__calls.push({ op: "upsert", table, row, onConflict }); },
  async remove(table, match) { window.__calls.push({ op: "remove", table, match }); },
  async insertAudit(row) { window.__calls.push({ op: "audit", row }); },
};`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
await page.route("**/app/api.js", route => route.fulfill({ status: 200, contentType: "text/javascript", body: fakeApiModule }));

const check = (cond, msg) => { if (!cond) { throw new Error("FALHOU: " + msg); } console.log("ok -", msg); };

await page.goto("http://127.0.0.1:4180/");
await page.waitForSelector("#login:not([hidden])");
check(await page.isVisible("#login-form"), "tela de login aparece sem sessão");

await page.fill("#login-email", "gerente@exemplo.com");
await page.fill("#login-password", "errada");
await page.click("#login-button");
await page.waitForSelector("#login-error:not([hidden])");
check((await page.textContent("#login-error")).includes("incorretos"), "senha errada mostra mensagem clara");

await page.fill("#login-password", "teste");
await page.click("#login-button");
await page.waitForSelector("#app:not([hidden])");
check((await page.textContent("#page-title")).includes("Dashboard"), "login correto abre o dashboard");
check((await page.textContent("#user-name")).includes("Gerente Exemplo"), "nome do gerente vem do banco");
const kpis = await page.$$eval(".kpi strong", els => els.map(e => e.textContent));
check(kpis.length >= 6, `dashboard renderiza ${kpis.length} KPIs`);

// Reunião: selecionar executivo e editar pipeline
await page.selectOption("#month-control", "9");
await page.selectOption("#executive-control", "EXE-01");
await page.evaluate(() => { location.hash = "reuniao"; });
await page.waitForSelector('input[data-kind="management"][data-field="pipeline"]');
await page.fill('input[data-kind="management"][data-field="pipeline"]', "250000");
await page.dispatchEvent('input[data-kind="management"][data-field="pipeline"]', "change");
await page.waitForFunction(() => window.__calls.some(c => c.op === "upsert" && c.table === "management_entries"), null, { timeout: 3000 });
const up = await page.evaluate(() => window.__calls.filter(c => c.op === "upsert" && c.table === "management_entries").at(-1));
check(up.row.pipeline === 250000 && up.onConflict === "executive_id,year,month", "edição grava só o lançamento do mês (upsert por entidade)");
await page.waitForFunction(() => document.querySelector("#top-save-status").textContent.includes("Salvo"), null, { timeout: 3000 });
check(true, "status mostra 'Salvo'");

// Desfazer após salvar → deve gravar o valor anterior (defeito R1 da v0.4)
check(!(await page.isDisabled("#undo-button")), "botão Desfazer habilitado");
await page.click("#undo-button");
await page.waitForFunction(() => window.__calls.filter(c => c.op === "upsert" && c.table === "management_entries").length >= 2, null, { timeout: 3000 });
const undoRow = await page.evaluate(() => window.__calls.filter(c => c.op === "upsert" && c.table === "management_entries").at(-1));
check(undoRow.row.pipeline === 1500000, "desfazer persiste o valor anterior (1.500.000)");

// Validação no cliente: valor negativo não grava
const before = await page.evaluate(() => window.__calls.length);
await page.fill('input[data-kind="management"][data-field="wonValue"]', "-5");
await page.dispatchEvent('input[data-kind="management"][data-field="wonValue"]', "change");
await page.waitForTimeout(600);
check((await page.evaluate(() => window.__calls.length)) === before, "valor negativo é rejeitado antes de ir ao banco");

// Snapshot e ação
await page.click("[data-snapshot]");
await page.waitForFunction(() => window.__calls.some(c => c.op === "upsert" && c.table === "snapshots"), null, { timeout: 3000 });
const snap = await page.evaluate(() => window.__calls.find(c => c.op === "upsert" && c.table === "snapshots").row);
check(snap.executive_id === "e-0" && typeof snap.gap_to_cover === "number" && snap.gap_to_sell >= 0, "snapshot grava falta a vender e falta a cobrir");
await page.click("[data-add-action]");
await page.waitForFunction(() => window.__calls.some(c => c.op === "upsert" && c.table === "actions"), null, { timeout: 3000 });
check(true, "ação criada é gravada");

// Parâmetros: probabilidade de estágio vai em %
await page.evaluate(() => { location.hash = "parametros"; });
await page.waitForSelector("[data-toggle-config]");
await page.click("[data-toggle-config]");
await page.fill('input[data-path="stageWeights.strong"]', "60");
await page.dispatchEvent('input[data-path="stageWeights.strong"]', "change");
await page.waitForFunction(() => window.__calls.some(c => c.op === "upsert" && c.table === "parameters"), null, { timeout: 3000 });
const params = await page.evaluate(() => window.__calls.find(c => c.op === "upsert" && c.table === "parameters").row);
check(params.stage_probability.strong === 60 && params.cycle.m3 === 60, "parâmetros gravados em percentual (strong 60, m3 60)");

await page.screenshot({ path: path.join(root, "tests/smoke-dashboard.png"), fullPage: false });
check(errors.length === 0, `sem erros de console/página (${errors.join(" | ") || "nenhum"})`);

await browser.close(); server.close();
console.log("\nSMOKE OK");
