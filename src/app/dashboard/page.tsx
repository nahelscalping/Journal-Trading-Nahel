"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Award, Wallet } from "lucide-react";
import { getStats, getTrades, getCurrentCapital, getSettings } from "@/lib/store";
import { useDataRefresh } from "@/lib/useDataRefresh";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const neonTooltip = {
  backgroundColor: "rgba(3, 16, 33, 0.95)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "14px",
  color: "#ffffff",
  boxShadow: "0 0 20px rgba(0, 0, 0, 0.4)",
  padding: "10px 14px",
  fontSize: "12px",
};

export default function DashboardPage() {
  const [stats, setStats] = useState(getStats());
  const [trades, setTrades] = useState(getTrades());
  const [capital, setCapital] = useState(0);
  const [settings, setSettingsState] = useState(getSettings());

  const refresh = useCallback(() => {
    setStats(getStats());
    setTrades(getTrades());
    setCapital(getCurrentCapital());
    setSettingsState(getSettings());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useDataRefresh(refresh);

  const recentTrades = trades.slice(0, 5);

  const dailyMap = new Map<string, number>();
  let cumulative = 0;
  trades.slice().reverse().forEach((t) => {
    dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.pnl);
  });
  const dailyPnL = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, pnl]) => {
      cumulative += pnl;
      return { date, pnl: Math.round(pnl * 100) / 100, cumulative: Math.round(cumulative * 100) / 100 };
    });

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-3xl font-bold">Vue d&apos;ensemble</h1>

      {/* Capital banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-3 md:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/25 to-accent-green/15 border border-primary/20 shrink-0">
            <Wallet size={17} className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Mon capital</p>
            <p className={`text-lg md:text-xl font-bold ${capital >= settings.startingCapital ? "text-accent-green neon-green" : "text-accent-red neon-red"}`}>
              {capital.toLocaleString("fr-FR")} $
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl shrink-0 ${
          stats.capitalGrowthPercent >= 0
            ? "bg-accent-green/15 text-accent-green"
            : "bg-accent-red/15 text-accent-red"
        }`}>
          {stats.capitalGrowthPercent >= 0 ? "+" : ""}{stats.capitalGrowthPercent.toFixed(2)}%
        </span>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[
          { icon: BarChart3, label: "Trades", value: stats.totalTrades.toString(), color: "text-primary" },
          { icon: Target, label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, color: "text-accent-green" },
          { icon: stats.totalPnl >= 0 ? TrendingUp : TrendingDown, label: "PnL",
            value: `${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(0)} $`,
            color: stats.totalPnl >= 0 ? "text-accent-green" : "text-accent-red" },
          { icon: Award, label: "P.Factor", value: stats.profitFactor.toFixed(2), color: "text-accent-yellow" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-3 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 md:w-9 md:h-9 rounded-xl flex items-center justify-center glass-btn ${s.color} shrink-0`}>
                <s.icon size={14} />
              </div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`text-lg md:text-2xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 glass-card p-3 md:p-6">
          <p className="text-sm font-semibold mb-0.5">P&L Journalier</p>
          <p className="text-[11px] text-text-muted mb-3">Évolution du compte</p>
          {dailyPnL.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyPnL} barCategoryGap="20%">
                <defs>
                  <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="redBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.4} />
                  </linearGradient>
                  <filter id="glowGreen"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4ade80" floodOpacity="0.4"/></filter>
                  <filter id="glowRed"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f87171" floodOpacity="0.4"/></filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={neonTooltip} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {dailyPnL.map((entry, index) => (
                    <Cell key={index}
                      fill={entry.pnl >= 0 ? "url(#greenBar)" : "url(#redBar)"}
                      filter={entry.pnl >= 0 ? "url(#glowGreen)" : "url(#glowRed)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <BarChart3 size={36} className="mb-2 opacity-20" />
              <p className="text-sm">Aucun trade enregistré</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-3 md:p-6">
          <p className="text-sm font-semibold mb-3">Derniers Trades</p>
          {recentTrades.length > 0 ? (
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-2.5 rounded-2xl glass-btn">
                  <div>
                    <p className="font-medium text-sm">{trade.pair}</p>
                    <p className="text-[10px] text-text-muted">{trade.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${trade.pnl >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red"}`}>
                      {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)} $
                    </span>
                    <p className={`text-[10px] ${trade.pnlPercent >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-28 text-text-muted text-xs">
              Aucun trade récent
            </div>
          )}
        </motion.div>
      </div>

      {stats.equityCurve.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-3 md:p-6">
          <p className="text-sm font-semibold mb-0.5">Courbe d&apos;équité</p>
          <p className="text-[11px] text-text-muted mb-3">Évolution cumulative</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.equityCurve}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
                <filter id="glowLine"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#4ade80" floodOpacity="0.5"/></filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
              <Tooltip contentStyle={neonTooltip} />
              <Area type="monotone" dataKey="equity" stroke="#4ade80" strokeWidth={2.5}
                fill="url(#equityGrad)" filter="url(#glowLine)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
