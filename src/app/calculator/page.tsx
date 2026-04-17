"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Percent, Wallet } from "lucide-react";
import { getCurrentCapital, getSettings, calculateTradePnl } from "@/lib/store";

export default function CalculatorPage() {
  const [capital, setCapital] = useState<number>(0);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [feePercent, setFeePercent] = useState<number>(0.1);

  useEffect(() => {
    const cap = getCurrentCapital();
    setCapital(cap);
  }, []);

  // Calculations based on amount invested (full capital)
  const amountInvested = capital;

  // Position in coins
  const coinsQuantity = entryPrice > 0 ? amountInvested / entryPrice : 0;

  // Stop loss PnL
  const slResult = entryPrice > 0 && stopLoss > 0
    ? calculateTradePnl("buy", entryPrice, stopLoss, amountInvested, feePercent)
    : { pnl: 0, pnlPercent: 0, fees: 0 };

  // Take profit PnL
  const tpResult = entryPrice > 0 && takeProfit > 0
    ? calculateTradePnl("buy", entryPrice, takeProfit, amountInvested, feePercent)
    : { pnl: 0, pnlPercent: 0, fees: 0 };

  // Risk/Reward ratio
  const risk = Math.abs(slResult.pnl);
  const reward = tpResult.pnl;
  const rr = risk > 0 ? reward / risk : 0;

  // Fees
  const fees = tpResult.fees;

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl md:text-3xl font-bold mb-1"
      >
        Calculatrice Spot
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-text-muted text-xs md:text-sm mb-4 md:mb-8"
      >
        Simulez vos trades avec votre capital actuel
      </motion.p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Input section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 space-y-5"
        >
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            Paramètres
          </h2>

          {/* Capital display */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={12} />
                Capital investi
              </label>
            </div>
            <input
              type="number"
              step="any"
              value={capital || ""}
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
              className="w-full text-2xl font-bold bg-transparent border-none px-0 focus:ring-0 text-primary"
              style={{ border: "none", boxShadow: "none", background: "transparent" }}
            />
            <p className="text-[11px] text-text-muted mt-1">
              Votre capital actuel: {getCurrentCapital().toLocaleString("fr-FR")} $
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-muted mb-1 block">Prix d&apos;entrée ($)</label>
              <input
                type="number"
                step="any"
                value={entryPrice || ""}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                placeholder="80000"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1 block">Stop Loss ($)</label>
              <input
                type="number"
                step="any"
                value={stopLoss || ""}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                placeholder="76000"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-muted mb-1 block">Take Profit ($)</label>
              <input
                type="number"
                step="any"
                value={takeProfit || ""}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                placeholder="90000"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1 flex items-center gap-1">
                <Percent size={12} />
                Frais (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={feePercent || ""}
                onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                placeholder="0.1"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Coins info */}
          {coinsQuantity > 0 && (
            <div className="p-3 rounded-xl glass-btn text-center">
              <p className="text-xs text-text-muted">Quantité de coins</p>
              <p className="text-sm font-medium">{coinsQuantity.toFixed(6)}</p>
            </div>
          )}
        </motion.div>

        {/* Results section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Take Profit result */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-accent-green" />
              <h3 className="text-sm font-semibold">Si Take Profit</h3>
            </div>
            {tpResult.pnl !== 0 ? (
              <div>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-accent-green neon-green">
                    +{tpResult.pnl.toFixed(2)} $
                  </p>
                  <p className="text-sm font-medium text-accent-green mb-1">
                    (+{tpResult.pnlPercent.toFixed(2)}%)
                  </p>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Capital après TP: {(capital + tpResult.pnl).toLocaleString("fr-FR")} $
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-text-muted">—</p>
            )}
          </div>

          {/* Stop Loss result */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={20} className="text-accent-red" />
              <h3 className="text-sm font-semibold">Si Stop Loss</h3>
            </div>
            {slResult.pnl !== 0 ? (
              <div>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-accent-red neon-red">
                    {slResult.pnl.toFixed(2)} $
                  </p>
                  <p className="text-sm font-medium text-accent-red mb-1">
                    ({slResult.pnlPercent.toFixed(2)}%)
                  </p>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Capital après SL: {(capital + slResult.pnl).toLocaleString("fr-FR")} $
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-text-muted">—</p>
            )}
          </div>

          {/* R:R Ratio */}
          <div className="glass-card p-6">
            <h3 className="text-sm text-text-muted mb-1">Ratio Risk / Reward</h3>
            <p className={`text-3xl font-bold ${rr >= 2 ? "text-accent-green neon-green" : rr >= 1 ? "text-accent-yellow" : "text-accent-red neon-red"}`}>
              {rr > 0 ? `1:${rr.toFixed(2)}` : "—"}
            </p>
            {rr > 0 && rr < 2 && (
              <div className="flex items-center gap-2 mt-3 text-accent-yellow text-xs">
                <AlertTriangle size={14} />
                <span>RR inférieur à 1:2 — risque élevé</span>
              </div>
            )}
          </div>

          {/* Fees */}
          <div className="glass-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-text-muted" />
              <span className="text-sm text-text-muted">Frais estimés (aller-retour)</span>
            </div>
            <p className="text-lg font-semibold text-accent-yellow">
              {fees > 0 ? `${fees.toFixed(2)} $` : "—"}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
