// main.js — bootstrap: sessão, login, carregamento do store e início do app.
import { api } from "./api.js";
import { Store } from "./store.js";
import { initApp } from "./app.js";
import { APP_VERSION } from "./config.js";

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

console.info(`Governança Comercial ${APP_VERSION}`);
const session = await api.session();
if (session) start(); else show("login");
