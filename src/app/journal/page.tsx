"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, X, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import {
  getTrades, saveTrade, deleteTrade, generateId,
  getCurrentCapital, calculateTradePnl, getSettings,
  Trade,
} from "@/lib/store";

type TradeForm = Omit<Trade, "id">;

const makeDefaultTrade = (capital: number): TradeForm => ({
  date: new Date().toISOString().split("T")[0],
  pair: "",
  type: "buy",
  entryPrice: 0,
  exitPrice: 0,
  amountInvested: capital,
  feePercent: 0.1,
  fees: 0,
  pnl: 0,
  pnlPercent: 0,
  notes: "",
  tags: [],
});

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [form, setForm] = useState<TradeForm>(makeDefaultTrade(1000));
  const [currentCapital, setCurrentCapital] = useState(1000);

  useEffect(() => {
    setTrades(getTrades());
    setCurrentCapital(getCurrentCapital());
  }, []);

  const liveCalc = calculateTradePnl(
    form.type,
    form.entryPrice,
    form.exitPrice,
    form.amountInvested,
    form.feePercent
  );

  const handleSubmit = () => {
    if (!form.pair || !form.entryPrice) return;
    const { pnl, pnlPercent, fees } = calculateTradePnl(
      form.type,
      form.entryPrice,
      form.exitPrice,
      form.amountInvested,
      form.feePercent
    );
    const trade: Trade = {
      ...form,
      pnl,
      pnlPercent,
      fees,
      id: editingTrade?.id || generateId(),
    };
    saveTrade(trade);
    setTrades(getTrades());
    setCurrentCapital(getCurrentCapital());
    setShowForm(false);
    setEditingTrade(null);
    setForm(makeDefaultTrade(getCurrentCapital()));
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setForm(trade);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteTrade(id);
    setTrades(getTrades());
    setCurrentCapital(getCurrentCapital());
  };

  const openNewTrade = () => {
    const cap = getCurrentCapital();
    setForm(makeDefaultTrade(cap));
    setEditingTrade(null);
    setShowForm(true);
  };

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const settings = getSettings();

  return (
    <div>
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl md:text-3xl font-bold"
        >
          Journal de Trades
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openNewTrade}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 glass-btn-primary rounded-2xl font-medium transition-all text-xs md:text-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nouveau Trade</span>
          <span className="sm:hidden">Ajouter</span>
        </motion.button>
      </div>

      {/* Capital banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-3 md:p-4 mb-3 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center glass-btn text-primary">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-xs text-text-muted">Capital actuel</p>
            <p className={`text-lg font-bold ${currentCapital >= settings.startingCapital ? "text-accent-green" : "text-accent-red"}`}>
              {currentCapital.toLocaleString("fr-FR")} $
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>Départ: {settings.startingCapital.toLocaleString("fr-FR")} $</span>
          <span className={`font-medium ${currentCapital >= settings.startingCapital ? "text-accent-green" : "text-accent-red"}`}>
            {currentCapital >= settings.startingCapital ? "+" : ""}
            {settings.startingCapital > 0 ? (((currentCapital - settings.startingCapital) / settings.startingCapital) * 100).toFixed(2) : 0}%
          </span>
        </div>
      </motion.div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingTrade ? "Modifier le trade" : "Nouveau Trade"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => updateField("date", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">Paire</label>
                    <input
                      type="text"
                      placeholder="BTC/USDT"
                      value={form.pair}
                      onChange={(e) => updateField("pair", e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-muted mb-1 block">Type</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateField("type", "buy")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        form.type === "buy"
                          ? "bg-accent-green/20 text-accent-green border border-accent-green/30"
                          : "bg-surface-light text-text-muted border border-border"
                      }`}
                    >
                      Achat (Long)
                    </button>
                    <button
                      onClick={() => updateField("type", "sell")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        form.type === "sell"
                          ? "bg-accent-red/20 text-accent-red border border-accent-red/30"
                          : "bg-surface-light text-text-muted border border-border"
                      }`}
                    >
                      Vente (Short)
                    </button>
                  </div>
                </div>

                {/* Amount invested - auto filled with current capital */}
                <div>
                  <label className="text-sm text-text-muted mb-1 flex items-center gap-2">
                    <DollarSign size={14} className="text-primary" />
                    Montant investi ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.amountInvested || ""}
                    onChange={(e) => updateField("amountInvested", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Auto-rempli avec votre capital actuel ({currentCapital.toLocaleString("fr-FR")} $)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">Prix d&apos;entrée ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.entryPrice || ""}
                      onChange={(e) => updateField("entryPrice", parseFloat(e.target.value) || 0)}
                      placeholder="80000"
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">Prix de sortie ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.exitPrice || ""}
                      onChange={(e) => updateField("exitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="90000"
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Fees in % */}
                <div>
                  <label className="text-sm text-text-muted mb-1 block">Frais (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.feePercent || ""}
                    onChange={(e) => updateField("feePercent", parseFloat(e.target.value) || 0)}
                    placeholder="0.1"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Frais estimés: {liveCalc.fees.toFixed(2)} $ (aller-retour)
                  </p>
                </div>

                {/* Live PnL preview */}
                {form.entryPrice > 0 && form.exitPrice > 0 && form.amountInvested > 0 && (
                  <div className={`p-4 rounded-2xl ${liveCalc.pnl >= 0 ? "bg-accent-green/10 border border-accent-green/20" : "bg-accent-red/10 border border-accent-red/20"}`}>
                    <p className="text-xs text-text-muted mb-1">Résultat estimé</p>
                    <div className="flex items-end gap-3">
                      <p className={`text-2xl font-bold ${liveCalc.pnl >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red"}`}>
                        {liveCalc.pnl >= 0 ? "+" : ""}{liveCalc.pnl.toFixed(2)} $
                      </p>
                      <p className={`text-sm font-medium mb-0.5 ${liveCalc.pnlPercent >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                        ({liveCalc.pnlPercent >= 0 ? "+" : ""}{liveCalc.pnlPercent.toFixed(2)}%)
                      </p>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      Capital après trade: {(currentCapital + liveCalc.pnl).toLocaleString("fr-FR")} $
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-text-muted mb-1 block">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Notes sur ce trade..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full py-3 glass-btn-primary rounded-2xl font-medium transition-all"
                >
                  {editingTrade ? "Modifier" : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trades list */}
      {trades.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-text-muted"
        >
          <TrendingUp size={56} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun trade enregistré</p>
          <p className="text-sm mt-1">Cliquez sur &quot;Nouveau Trade&quot; pour commencer</p>
        </motion.div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="md:hidden space-y-3">
            {trades.map((trade, i) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{trade.pair}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                      trade.type === "buy"
                        ? "bg-accent-green/15 text-accent-green"
                        : "bg-accent-red/15 text-accent-red"
                    }`}>
                      {trade.type === "buy" ? "ACHAT" : "VENTE"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(trade)}
                      className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-primary transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(trade.id)}
                      className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-accent-red transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-text-muted">Investi</p>
                    <p className="font-medium">{trade.amountInvested?.toFixed(0) || "—"} $</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Entrée</p>
                    <p className="font-medium">{trade.entryPrice.toFixed(2)} $</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Sortie</p>
                    <p className="font-medium">{trade.exitPrice.toFixed(2)} $</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-text-muted">{trade.date}</span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      trade.pnl >= 0 ? "text-accent-green" : "text-accent-red"
                    }`}>
                      {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)} $
                    </span>
                    <span className={`text-xs ml-1.5 ${
                      trade.pnlPercent >= 0 ? "text-accent-green" : "text-accent-red"
                    }`}>
                      ({trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Date</th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Paire</th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Type</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Investi</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Entrée</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Sortie</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">PnL</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">%</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-surface-light/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm">{trade.date}</td>
                      <td className="px-5 py-3.5 text-sm font-medium">{trade.pair}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          trade.type === "buy"
                            ? "bg-accent-green/15 text-accent-green"
                            : "bg-accent-red/15 text-accent-red"
                        }`}>
                          {trade.type === "buy" ? "ACHAT" : "VENTE"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right">{trade.amountInvested?.toFixed(0) || "—"} $</td>
                      <td className="px-5 py-3.5 text-sm text-right">{trade.entryPrice.toFixed(2)} $</td>
                      <td className="px-5 py-3.5 text-sm text-right">{trade.exitPrice.toFixed(2)} $</td>
                      <td className={`px-5 py-3.5 text-sm text-right font-semibold ${
                        trade.pnl >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}>
                        {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)} $
                      </td>
                      <td className={`px-5 py-3.5 text-sm text-right ${
                        trade.pnlPercent >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}>
                        {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(trade)}
                            className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-primary transition-colors"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(trade.id)}
                            className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-accent-red transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
