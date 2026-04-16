"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Award, Wallet, Percent } from "lucide-react";
import { getStats, getTrades, getCurrentCapital, getSettings } from "@/lib/store";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function StatCard({ icon: Icon, label, value, color, delay, subtitle }: {
  icon: React.ElementType; label: string; value: string; color: string; delay: number; subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center glass-btn ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </motion.div>
  );
}

const neonTooltip = {
  backgroundColor: "rgba(6, 8, 15, 0.95)",
  border: "1px solid rgba(0, 230, 118, 0.3)",
  borderRadius: "14px",
  color: "#00e676",
  boxShadow: "0 0 20px rgba(0, 230, 118, 0.15)",
  padding: "12px 16px",
  fontSize: "13px",
};

export default function DashboardPage() {
  const [stats, setStats] = useState(getStats());
  const [trades, setTrades] = useState(getTrades());
  const [capital, setCapital] = useState(0);
  const [settings, setSettingsState] = useState(getSettings());

  useEffect(() => {
    setStats(getStats());
    setTrades(getTrades());
    setCapital(getCurrentCapital());
    setSettingsState(getSettings());
  }, []);

  const recentTrades = trades.slice(0, 5);

  // Build daily PnL data for bar chart
  const dailyMap = new Map<string, number>();
  let cumulative = 0;
  const sortedTrades = trades.slice().reverse();
  sortedTrades.forEach((t) => {
    dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.pnl);
  });
  const dailyPnL = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, pnl]) => {
      cumulative += pnl;
      return { date, pnl: Math.round(pnl * 100) / 100, cumulative: Math.round(cumulative * 100) / 100 };
    });

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl md:text-3xl font-bold mb-6"
      >
        Vue d&apos;ensemble
      </motion.h1>

      {/* Capital banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/25 to-accent-green/15 border border-primary/20">
            <Wallet size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Mon capital</p>
            <p className={`text-xl font-bold ${capital >= settings.startingCapital ? "text-accent-green neon-green" : "text-accent-red neon-red"}`}>
              {capital.toLocaleString("fr-FR")} $
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold px-3 py-1 rounded-xl ${
            stats.capitalGrowthPercent >= 0
              ? "bg-accent-green/15 text-accent-green"
              : "bg-accent-red/15 text-accent-red"
          }`}>
            {stats.capitalGrowthPercent >= 0 ? "+" : ""}{stats.capitalGrowthPercent.toFixed(2)}%
          </span>
          <span className="text-xs text-text-muted">depuis {settings.startingCapital.toLocaleString("fr-FR")} $</span>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard icon={BarChart3} label="Trades" value={stats.totalTrades.toString()} color="text-primary" delay={0.1} />
        <StatCard icon={Target} label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="text-accent-green" delay={0.15} />
        <StatCard icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown} label="PnL Total"
          value={`${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)} $`}
          color={stats.totalPnl >= 0 ? "text-accent-green" : "text-accent-red"} delay={0.2} />
        <StatCard icon={Award} label="Profit Factor" value={stats.profitFactor.toFixed(2)} color="text-accent-yellow" delay={0.25} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* P&L bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card p-5 md:p-6"
        >
          <div className="mb-1">
            <h2 className="text-base font-semibold">P&L Journalier & Cumulé</h2>
            <p className="text-xs text-text-muted">Évolution du compte sur la période</p>
          </div>
          {dailyPnL.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyPnL} barCategoryGap="20%">
                <defs>
                  <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e676" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#00e676" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="redBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b5c" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ff3b5c" stopOpacity={0.4} />
                  </linearGradient>
                  <filter id="glowGreen">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00e676" floodOpacity="0.4"/>
                  </filter>
                  <filter id="glowRed">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ff3b5c" floodOpacity="0.4"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={neonTooltip} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {dailyPnL.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.pnl >= 0 ? "url(#greenBar)" : "url(#redBar)"}
                      filter={entry.pnl >= 0 ? "url(#glowGreen)" : "url(#glowRed)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-text-muted">
              <BarChart3 size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Aucun trade enregistré</p>
              <p className="text-xs mt-1 text-text-muted/60">Ajoutez vos premiers trades dans le Journal</p>
            </div>
          )}
        </motion.div>

        {/* Recent trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-5 md:p-6"
        >
          <h2 className="text-base font-semibold mb-4">Derniers Trades</h2>
          {recentTrades.length > 0 ? (
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 rounded-2xl glass-btn">
                  <div>
                    <p className="font-medium text-sm">{trade.pair}</p>
                    <p className="text-[11px] text-text-muted">{trade.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      trade.pnl >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red"
                    }`}>
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
            <div className="flex flex-col items-center justify-center h-48 text-text-muted text-sm">
              <p className="text-xs">Aucun trade récent</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Equity curve */}
      {stats.equityCurve.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 md:p-6 mt-4 md:mt-6"
        >
          <div className="mb-1">
            <h2 className="text-base font-semibold">Courbe d&apos;équité</h2>
            <p className="text-xs text-text-muted">Évolution cumulative du capital</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.equityCurve}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e676" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
                <filter id="glowLine">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00e676" floodOpacity="0.5"/>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
              <Tooltip contentStyle={neonTooltip} />
              <Area type="monotone" dataKey="equity" stroke="#00e676" strokeWidth={2.5}
                fill="url(#equityGrad)" filter="url(#glowLine)"
                activeDot={{ r: 5, fill: "#00e676", strokeWidth: 0, style: { filter: "drop-shadow(0 0 6px rgba(0,230,118,0.6))" } }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
