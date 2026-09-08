// main.js — bootstrap: sessão, login, carregamento do store e início do app.
import { api } from "./api.js";
import { Store } from "./store.js";
import { initApp } from "./app.js";
import { APP_VERSION, ACCESS_EMAIL_PREFIX, ACCESS_EMAIL_DOMAIN, ACCESS_DEFAULT_CLIENT } from "./config.js";

const el = id => document.getElementById(id);
const show = id => { for (const v of ["login", "loading", "app"]) el(v).hidden = v !== id; };
const store = new Store(api, { storage: window.localStorage });
let started = false;

async function start() {
  show("loading");
  el("loading-text").textContent = "Carregando dados…";
  try {
    await store.load();
    if (!started) { initApp(store); started = true; } else { location.reload(); return; }
    show("app");
  } catch (error) {
    show("login");
    showLoginError(error.message);
    await api.signOut().catch(() => {});
  }
}

function showLoginError(message) {
  const box = el("login-error");
  box.textContent = message;
  box.hidden = !message;
}

el("login-form").addEventListener("submit", async event => {
  event.preventDefault();
  showLoginError("");
  el("login-button").disabled = true;
  try {
    await api.signIn(el("login-email").value, el("login-password").value);
    await start();
  } catch (error) {
    showLoginError(/invalid login/i.test(error.message) ? "E-mail ou senha incorretos." : error.message);
  } finally {
    el("login-button").disabled = false;
  }
});

el("logout-button").addEventListener("click", async () => {
  if (store.pending.size || store.inFlight) await store.flushAll();
  await api.signOut();
  location.reload();
});

// Acesso pelo link: …/#k=CHAVE (opcional: &c=slug-do-cliente). Faz o login com a conta
// compartilhada do cliente e guarda a sessão; a chave é removida da barra de endereço.
function accessKeyFromUrl() {
  const raw = (location.hash.startsWith("#") ? location.hash.slice(1) : "") || location.search.slice(1);
  const params = new URLSearchParams(raw);
  const key = params.get("k");
  if (!key) return null;
  return { key, slug: params.get("c") || ACCESS_DEFAULT_CLIENT };
}

async function loginByLink(access) {
  show("loading");
  el("loading-text").textContent = "Entrando pelo link…";
  try {
    await api.signIn(`${ACCESS_EMAIL_PREFIX}-${access.slug}@${ACCESS_EMAIL_DOMAIN}`, access.key);
    history.replaceState(null, "", location.pathname + location.search);
    await start();
  } catch (error) {
    show("login");
    showLoginError("Link de acesso inválido ou expirado. Peça o link atualizado ao consultor responsável.");
  }
}

console.info(`Governança Comercial ${APP_VERSION}`);
const access = accessKeyFromUrl();
const session = await api.session();
if (access) loginByLink(access); else if (session) start(); else show("login");
