// Synchronisation cloud (Supabase) pour Nodex Trading.
//
// Stratégie :
// - localStorage reste la source rapide, utilisée partout synchrone.
// - Au login, on pull tout depuis Supabase. Si le cloud est vide et qu'on
//   a déjà des données locales, on pousse le local vers le cloud (migration).
// - À chaque save/delete, on push en best-effort vers le cloud (fire-and-forget).
//
// Les tables (`journal_trades`, `journal_plans`, `journal_notes`,
// `journal_settings`) sont créées via `supabase/migrations/0001_journal_tables.sql`.
// RLS garantit qu'un utilisateur ne voit que ses propres lignes.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import {
  type Trade,
  type TradingPlan,
  type Note,
  type UserSettings,
  getTrades,
  getPlans,
  getNotes,
  getSettings,
  saveSettings,
} from "./store";

// === MAPPERS (camelCase <-> snake_case) ===

type TradeRow = {
  id: string;
  user_id?: string;
  date: string | null;
  pair: string | null;
  trade_type: string | null;
  entry_price: number | null;
  exit_price: number | null;
  amount_invested: number | null;
  fee_percent: number | null;
  fees: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  notes: string | null;
  tags: string[] | null;
  screenshot: string | null;
  quantity: number | null;
  updated_at?: string;
};

function tradeToRow(t: Trade, userId: string): TradeRow {
  return {
    user_id: userId,
    id: t.id,
    date: t.date,
    pair: t.pair,
    trade_type: t.type,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    amount_invested: t.amountInvested,
    fee_percent: t.feePercent,
    fees: t.fees,
    pnl: t.pnl,
    pnl_percent: t.pnlPercent,
    notes: t.notes,
    tags: t.tags,
    screenshot: t.screenshot ?? null,
    quantity: t.quantity ?? null,
  };
}

function rowToTrade(r: TradeRow): Trade {
  return {
    id: r.id,
    date: r.date ?? "",
    pair: r.pair ?? "",
    type: (r.trade_type === "sell" ? "sell" : "buy") as Trade["type"],
    entryPrice: Number(r.entry_price ?? 0),
    exitPrice: Number(r.exit_price ?? 0),
    amountInvested: Number(r.amount_invested ?? 0),
    feePercent: Number(r.fee_percent ?? 0),
    fees: Number(r.fees ?? 0),
    pnl: Number(r.pnl ?? 0),
    pnlPercent: Number(r.pnl_percent ?? 0),
    notes: r.notes ?? "",
    tags: r.tags ?? [],
    screenshot: r.screenshot ?? undefined,
    quantity: r.quantity ?? undefined,
  };
}

type PlanRow = {
  id: string;
  user_id?: string;
  name: string | null;
  strategy: string | null;
  trading_hours: string | null;
  preferred_sessions: string | null;
  description: string | null;
  created_at: string | null;
  updated_at?: string;
};

function planToRow(p: TradingPlan, userId: string): PlanRow {
  return {
    user_id: userId,
    id: p.id,
    name: p.name,
    strategy: p.strategy,
    trading_hours: p.tradingHours,
    preferred_sessions: p.preferredSessions,
    description: p.description,
    created_at: p.createdAt,
  };
}

function rowToPlan(r: PlanRow): TradingPlan {
  return {
    id: r.id,
    name: r.name ?? "",
    strategy: r.strategy ?? "",
    tradingHours: r.trading_hours ?? "",
    preferredSessions: r.preferred_sessions ?? "",
    description: r.description ?? "",
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}

type NoteRow = {
  id: string;
  user_id?: string;
  title: string | null;
  content: string | null;
  folder: string | null;
  created_at: string | null;
  updated_at?: string;
};

function noteToRow(n: Note, userId: string): NoteRow {
  return {
    user_id: userId,
    id: n.id,
    title: n.title,
    content: n.content,
    folder: n.folder ?? null,
    created_at: n.createdAt,
  };
}

function rowToNote(r: NoteRow): Note {
  return {
    id: r.id,
    title: r.title ?? "",
    content: r.content ?? "",
    folder: r.folder ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}

type SettingsRow = {
  user_id?: string;
  starting_capital: number | null;
  display_name: string | null;
};

// === PUSH (localStorage -> cloud) ===

/** Remplace toute la collection distante par la collection locale. */
async function replaceAll<RowType extends Record<string, unknown>>(
  client: SupabaseClient,
  userId: string,
  table: string,
  rows: RowType[]
): Promise<void> {
  // 1) supprime l'existant côté cloud (scope par user via RLS)
  const { error: delErr } = await client.from(table).delete().eq("user_id", userId);
  if (delErr) throw delErr;
  // 2) upsert si non vide
  if (rows.length > 0) {
    const { error } = await client.from(table).upsert(rows);
    if (error) throw error;
  }
}

export async function pushAll(userId: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const trades = getTrades().map((t) => tradeToRow(t, userId));
  const plans = getPlans().map((p) => planToRow(p, userId));
  const notes = getNotes().map((n) => noteToRow(n, userId));
  const settings = getSettings();

  await Promise.all([
    replaceAll(client, userId, "journal_trades", trades),
    replaceAll(client, userId, "journal_plans", plans),
    replaceAll(client, userId, "journal_notes", notes),
    client.from("journal_settings").upsert({
      user_id: userId,
      starting_capital: settings.startingCapital,
      display_name: settings.displayName,
    }),
  ]);
}

export async function pushTrade(userId: string, trade: Trade): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("journal_trades").upsert(tradeToRow(trade, userId));
  if (error) throw error;
}

export async function deleteTradeRemote(userId: string, id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("journal_trades").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

export async function pushPlan(userId: string, plan: TradingPlan): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("journal_plans").upsert(planToRow(plan, userId));
  if (error) throw error;
}

export async function deletePlanRemote(userId: string, id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("journal_plans").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

export async function pushNote(userId: string, note: Note): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("journal_notes").upsert(noteToRow(note, userId));
  if (error) throw error;
}

export async function deleteNoteRemote(userId: string, id: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("journal_notes").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

export async function pushSettings(userId: string, settings: UserSettings): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.from("journal_settings").upsert({
    user_id: userId,
    starting_capital: settings.startingCapital,
    display_name: settings.displayName,
  });
  if (error) throw error;
}

// === PULL (cloud -> localStorage) ===

export type CloudSnapshot = {
  trades: Trade[];
  plans: TradingPlan[];
  notes: Note[];
  settings: SettingsRow | null;
};

export async function pullAll(userId: string): Promise<CloudSnapshot> {
  const client = getSupabase();
  if (!client) return { trades: [], plans: [], notes: [], settings: null };

  const [tradesRes, plansRes, notesRes, settingsRes] = await Promise.all([
    client.from("journal_trades").select("*").eq("user_id", userId).order("date", { ascending: false }),
    client.from("journal_plans").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    client.from("journal_notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    client.from("journal_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (tradesRes.error) throw tradesRes.error;
  if (plansRes.error) throw plansRes.error;
  if (notesRes.error) throw notesRes.error;
  if (settingsRes.error) throw settingsRes.error;

  return {
    trades: (tradesRes.data ?? []).map(rowToTrade),
    plans: (plansRes.data ?? []).map(rowToPlan),
    notes: (notesRes.data ?? []).map(rowToNote),
    settings: (settingsRes.data as SettingsRow | null) ?? null,
  };
}

/** Écrit le snapshot cloud dans localStorage (sans passer par les setters qui re-dispatchent). */
export function applySnapshotToLocal(snap: CloudSnapshot): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("neldia_trades", JSON.stringify(snap.trades));
  localStorage.setItem("neldia_plans", JSON.stringify(snap.plans));
  localStorage.setItem("neldia_notes", JSON.stringify(snap.notes));
  if (snap.settings) {
    const current = getSettings();
    saveSettings({
      ...current,
      startingCapital: Number(snap.settings.starting_capital ?? current.startingCapital),
      displayName: snap.settings.display_name ?? current.displayName,
    });
  }
  // Notifie les pages abonnées qu'il faut re-rendre avec les nouvelles données.
  window.dispatchEvent(new CustomEvent("nodex-data-refreshed"));
}

// === SYNC INITIALE (login) ===

/**
 * À appeler juste après le login.
 * - Si le cloud a des données → pull (le cloud gagne).
 * - Si le cloud est vide mais qu'on a des données locales → push (migration).
 * - Sinon → rien.
 */
export async function syncAfterLogin(userId: string): Promise<"pulled" | "pushed" | "noop"> {
  const snap = await pullAll(userId);
  const cloudHasData =
    snap.trades.length > 0 || snap.plans.length > 0 || snap.notes.length > 0 || snap.settings !== null;

  if (cloudHasData) {
    applySnapshotToLocal(snap);
    return "pulled";
  }

  const localHasData =
    getTrades().length > 0 || getPlans().length > 0 || getNotes().length > 0;
  if (localHasData) {
    await pushAll(userId);
    return "pushed";
  }
  return "noop";
}
