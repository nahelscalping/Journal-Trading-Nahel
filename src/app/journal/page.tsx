"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, X, TrendingUp, TrendingDown } from "lucide-react";
import { getTrades, saveTrade, deleteTrade, generateId, Trade } from "@/lib/store";

const defaultTrade: Omit<Trade, "id"> = {
  date: new Date().toISOString().split("T")[0],
  pair: "",
  type: "buy",
  entryPrice: 0,
  exitPrice: 0,
  quantity: 0,
  fees: 0,
  pnl: 0,
  pnlPercent: 0,
  notes: "",
  tags: [],
};

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [form, setForm] = useState(defaultTrade);

  useEffect(() => {
    setTrades(getTrades());
  }, []);

  const calcPnl = (f: typeof form) => {
    const diff = f.type === "buy"
      ? (f.exitPrice - f.entryPrice) * f.quantity
      : (f.entryPrice - f.exitPrice) * f.quantity;
    const pnl = Math.round((diff - f.fees) * 100) / 100;
    const pnlPercent = f.entryPrice > 0 && f.quantity > 0
      ? Math.round((pnl / (f.entryPrice * f.quantity)) * 10000) / 100
      : 0;
    return { pnl, pnlPercent };
  };

  const handleSubmit = () => {
    if (!form.pair || !form.entryPrice || !form.quantity) return;
    const { pnl, pnlPercent } = calcPnl(form);
    const trade: Trade = {
      ...form,
      pnl,
      pnlPercent,
      id: editingTrade?.id || generateId(),
    };
    saveTrade(trade);
    setTrades(getTrades());
    setShowForm(false);
    setEditingTrade(null);
    setForm(defaultTrade);
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setForm(trade);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteTrade(id);
    setTrades(getTrades());
  };

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl md:text-3xl font-bold"
        >
          Journal de Trades
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setForm(defaultTrade);
            setEditingTrade(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 glass-btn-primary rounded-2xl font-medium transition-all text-sm"
        >
          <Plus size={18} />
          Nouveau Trade
        </motion.button>
      </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">Prix d&apos;entrée ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.entryPrice || ""}
                      onChange={(e) => updateField("entryPrice", parseFloat(e.target.value) || 0)}
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
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">Quantité</label>
                    <input
                      type="number"
                      step="any"
                      value={form.quantity || ""}
                      onChange={(e) => updateField("quantity", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-muted mb-1 block">Frais ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.fees || ""}
                      onChange={(e) => updateField("fees", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {form.entryPrice > 0 && form.exitPrice > 0 && form.quantity > 0 && (
                  <div className="p-3 rounded-xl bg-surface-light">
                    <p className="text-sm text-text-muted">PnL estimé</p>
                    <p className={`text-lg font-bold ${calcPnl(form).pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      {calcPnl(form).pnl >= 0 ? "+" : ""}{calcPnl(form).pnl.toFixed(2)} $
                      <span className="text-sm ml-2">({calcPnl(form).pnlPercent.toFixed(2)}%)</span>
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
                    <p className="text-text-muted">Entrée</p>
                    <p className="font-medium">{trade.entryPrice.toFixed(2)} $</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Sortie</p>
                    <p className="font-medium">{trade.exitPrice.toFixed(2)} $</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Qté</p>
                    <p className="font-medium">{trade.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-text-muted">{trade.date}</span>
                  <span className={`text-sm font-bold ${
                    trade.pnl >= 0 ? "text-accent-green" : "text-accent-red"
                  }`}>
                    {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)} $
                  </span>
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
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Entrée</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Sortie</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">Quantité</th>
                    <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-5 py-4">PnL</th>
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
                      <td className="px-5 py-3.5 text-sm text-right">{trade.entryPrice.toFixed(2)} $</td>
                      <td className="px-5 py-3.5 text-sm text-right">{trade.exitPrice.toFixed(2)} $</td>
                      <td className="px-5 py-3.5 text-sm text-right">{trade.quantity}</td>
                      <td className={`px-5 py-3.5 text-sm text-right font-semibold ${
                        trade.pnl >= 0 ? "text-accent-green" : "text-accent-red"
                      }`}>
                        {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)} $
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
