"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Target, DollarSign, Wallet, Percent } from "lucide-react";
import { getStats, getTrades } from "@/lib/store";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const neonTooltip = {
  backgroundColor: "rgba(6, 8, 15, 0.95)",
  border: "1px solid rgba(0, 230, 118, 0.3)",
  borderRadius: "14px",
  color: "#00e676",
  boxShadow: "0 0 20px rgba(0, 230, 118, 0.15)",
  padding: "12px 16px",
  fontSize: "13px",
};

export default function StatsPage() {
  const [stats, setStats] = useState(getStats());
  const [trades, setTrades] = useState(getTrades());

  useEffect(() => {
    setStats(getStats());
    setTrades(getTrades());
  }, []);

  const pairMap = new Map<string, number>();
  trades.forEach((t) => pairMap.set(t.pair, (pairMap.get(t.pair) || 0) + t.pnl));
  const pairData = Array.from(pairMap.entries()).map(([pair, pnl]) => ({
    pair, pnl: Math.round(pnl * 100) / 100,
  }));

  const winLossData = [
    { name: "Gains", value: stats.wins, color: "#00e676" },
    { name: "Pertes", value: stats.losses, color: "#ff3b5c" },
  ];

  const dailyMap = new Map<string, number>();
  trades.forEach((t) => dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.pnl));
  const dailyData = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }));

  const hasTrades = trades.length > 0;

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl md:text-3xl font-bold mb-3 md:mb-8"
      >
        Statistiques
      </motion.h1>

      {!hasTrades ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-text-muted">
          <BarChart3 size={56} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">Aucune statistique disponible</p>
          <p className="text-sm mt-1 text-text-muted/60">Ajoutez des trades dans le Journal pour voir vos stats</p>
        </motion.div>
      ) : (
        <>
          {/* Capital Growth Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5 md:p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent-green/20 border border-primary/20">
                  <Wallet size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Croissance du capital</p>
                  <div className="flex items-end gap-3">
                    <p className={`text-2xl md:text-3xl font-bold ${stats.capitalGrowthPercent >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red"}`}>
                      {stats.capitalGrowthPercent >= 0 ? "+" : ""}{stats.capitalGrowthPercent.toFixed(2)}%
                    </p>
                    <p className="text-sm text-text-muted mb-1">effet composé inclus</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-xs text-text-muted">Départ</p>
                  <p className="font-semibold">{stats.startingCapital.toLocaleString("fr-FR")} $</p>
                </div>
                <div className="text-2xl text-text-muted">→</div>
                <div className="text-center">
                  <p className="text-xs text-text-muted">Actuel</p>
                  <p className={`font-semibold ${stats.currentCapital >= stats.startingCapital ? "text-accent-green" : "text-accent-red"}`}>
                    {stats.currentCapital.toLocaleString("fr-FR")} $
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
            {[
              { icon: BarChart3, label: "Trades", value: stats.totalTrades, color: "text-primary neon-blue" },
              { icon: Target, label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, color: "text-accent-green neon-green" },
              { icon: stats.totalPnl >= 0 ? TrendingUp : TrendingDown, label: "PnL Total",
                value: `${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)} $`,
                color: stats.totalPnl >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red" },
              { icon: DollarSign, label: "Profit Factor", value: stats.profitFactor.toFixed(2), color: "text-accent-yellow" },
              { icon: Percent, label: "Croissance", value: `${stats.capitalGrowthPercent >= 0 ? "+" : ""}${stats.capitalGrowthPercent.toFixed(1)}%`,
                color: stats.capitalGrowthPercent >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card p-5 text-center">
                <s.icon size={22} className={`mx-auto mb-2 ${s.color}`} />
                <p className={`text-xl md:text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Capital growth curve */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }} className="glass-card p-5 md:p-6">
              <h2 className="text-base font-semibold mb-1">Évolution du capital</h2>
              <p className="text-xs text-text-muted mb-4">Capital avec effet composé</p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.equityCurve}>
                  <defs>
                    <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e676" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                    </linearGradient>
                    <filter id="gl"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00e676" floodOpacity="0.5"/></filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <Tooltip contentStyle={neonTooltip} />
                  <Area type="monotone" dataKey="equity" stroke="#00e676" strokeWidth={2.5} fill="url(#eqG)" filter="url(#gl)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Win/Loss pie */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }} className="glass-card p-5 md:p-6">
              <h2 className="text-base font-semibold mb-1">Répartition Gains/Pertes</h2>
              <p className="text-xs text-text-muted mb-4">Distribution des résultats</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <defs>
                    <filter id="pgG"><feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00e676" floodOpacity="0.4"/></filter>
                    <filter id="pgR"><feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff3b5c" floodOpacity="0.4"/></filter>
                  </defs>
                  <Pie data={winLossData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value"
                    stroke="none" label={{ fontSize: 12, fill: "#e2e8f0" }}>
                    {winLossData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} filter={index === 0 ? "url(#pgG)" : "url(#pgR)"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={neonTooltip} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Capital growth % curve */}
            {stats.capitalHistory.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }} className="glass-card p-5 md:p-6">
                <h2 className="text-base font-semibold mb-1">Croissance en %</h2>
                <p className="text-xs text-text-muted mb-4">Pourcentage de progression depuis le départ</p>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={stats.capitalHistory}>
                    <defs>
                      <linearGradient id="gpG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5B6EF5" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#5B6EF5" stopOpacity={0} />
                      </linearGradient>
                      <filter id="glB"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#5B6EF5" floodOpacity="0.5"/></filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{...neonTooltip, border: "1px solid rgba(91,110,245,0.3)", color: "#7B8AF7"}} />
                    <Area type="monotone" dataKey="growthPct" stroke="#5B6EF5" strokeWidth={2.5} fill="url(#gpG)" filter="url(#glB)"
                      name="Croissance %" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* PnL by pair */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }} className="glass-card p-5 md:p-6">
              <h2 className="text-base font-semibold mb-1">PnL par Paire</h2>
              <p className="text-xs text-text-muted mb-4">Performance par actif</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pairData} barCategoryGap="25%">
                  <defs>
                    <linearGradient id="gB2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e676" stopOpacity={0.9} /><stop offset="100%" stopColor="#00e676" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="rB2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff3b5c" stopOpacity={0.9} /><stop offset="100%" stopColor="#ff3b5c" stopOpacity={0.3} />
                    </linearGradient>
                    <filter id="gBg"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00e676" floodOpacity="0.4"/></filter>
                    <filter id="rBg"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ff3b5c" floodOpacity="0.4"/></filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
                  <XAxis dataKey="pair" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={neonTooltip} />
                  <Bar dataKey="pnl" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {pairData.map((entry, index) => (
                      <Cell key={index}
                        fill={entry.pnl >= 0 ? "url(#gB2)" : "url(#rB2)"}
                        filter={entry.pnl >= 0 ? "url(#gBg)" : "url(#rBg)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Daily PnL */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }} className="glass-card p-5 md:p-6 lg:col-span-2">
              <h2 className="text-base font-semibold mb-1">PnL Journalier</h2>
              <p className="text-xs text-text-muted mb-4">Résultat quotidien</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={neonTooltip} />
                  <Bar dataKey="pnl" radius={[8, 8, 0, 0]} maxBarSize={28}>
                    {dailyData.map((entry, index) => (
                      <Cell key={index}
                        fill={entry.pnl >= 0 ? "url(#gB2)" : "url(#rB2)"}
                        filter={entry.pnl >= 0 ? "url(#gBg)" : "url(#rBg)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
