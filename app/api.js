// api.js — única camada que fala com o Supabase (REST + Auth).
// Usa o cliente oficial via CDN; nada é instalado.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const fail = (error, context) => { const e = new Error(`${context}: ${error.message || error}`); e.cause = error; throw e; };

export const api = {
  async session() { const { data } = await supabase.auth.getSession(); return data.session; },
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) fail(error, "Login"); return data.session;
  },
  async signOut() { await supabase.auth.signOut(); },
  onAuthChange(fn) { return supabase.auth.onAuthStateChange((_event, session) => fn(session)); },

  async loadWorkspace(year) {
    const { data, error } = await supabase.rpc("load_workspace", { p_year: year || null });
    if (error) fail(error, "Carregar dados"); return data;
  },
  async upsert(table, rowOrRows, onConflict) {
    const { error } = await supabase.from(table).upsert(rowOrRows, { onConflict, ignoreDuplicates: false });
    if (error) fail(error, `Salvar ${table}`);
  },
  async remove(table, match) {
    const { error } = await supabase.from(table).delete().match(match);
    if (error) fail(error, `Excluir ${table}`);
  },
  async insertAudit(row) {
    const { error } = await supabase.from("audit_log").insert(row);
    if (error) throw error;
  },
  async ping() { const { data, error } = await supabase.rpc("ping"); if (error) fail(error, "Ping"); return data; },
};
