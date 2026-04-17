"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Target, DollarSign, AlertTriangle, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SimPoint {
  month: number;
  label: string;
  equity: number;
  drawdown: number;
  peakEquity: number;
  totalTrades: number;
  totalFees: number;
}

function simulate(
  capital: number, riskPercent: number, winRate: number,
  avgRR: number, tradesPerMonth: number, feePercent: number, months: number
): SimPoint[] {
  const points: SimPoint[] = [];
  let equity = capital;
  let peak = capital;
  let totalFees = 0;
  let totalTrades = 0;

  // Seed for deterministic but realistic simulation
  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  }

  points.push({
    month: 0, label: "Départ", equity: capital,
    drawdown: 0, peakEquity: capital, totalTrades: 0, totalFees: 0,
  });

  for (let m = 1; m <= months; m++) {
    for (let t = 0; t < tradesPerMonth; t++) {
      const riskAmount = equity * (riskPercent / 100);
      const positionSize = riskAmount; // what we risk
      const fee = positionSize * (feePercent / 100) * 2; // entry + exit
      totalFees += fee;
      totalTrades++;

      // Use pseudo-random with win rate probability
      const isWin = pseudoRandom() * 100 < winRate;

      if (isWin) {
        // Win: gain = risk * R:R ratio, minus fees
        equity += riskAmount * avgRR - fee;
      } else {
        // Loss: lose the risk amount, plus fees
        equity -= riskAmount + fee;
      }

      equity = Math.round(equity * 100) / 100;

      if (equity <= 0) { equity = 0; break; }
      if (equity > peak) peak = equity;
    }

    const drawdown = peak > 0 ? Math.round(((peak - equity) / peak) * 10000) / 100 : 0;

    points.push({
      month: m,
      label: m <= 12 ? `M${m}` : `M${m}`,
      equity: Math.round(equity * 100) / 100,
      drawdown,
      peakEquity: Math.round(peak * 100) / 100,
      totalTrades,
      totalFees: Math.round(totalFees * 100) / 100,
    });

    if (equity <= 0) break;
  }

  return points;
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

const redTooltip = {
  ...neonTooltip,
  border: "1px solid rgba(255, 59, 92, 0.3)",
  color: "#ff3b5c",
  boxShadow: "0 0 20px rgba(255, 59, 92, 0.15)",
};

export default function SimulatorPage() {
  const [capital, setCapital] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [winRate, setWinRate] = useState(55);
  const [avgRR, setAvgRR] = useState(2);
  const [tradesPerMonth, setTradesPerMonth] = useState(20);
  const [feePercent, setFeePercent] = useState(0.1);
  const [months, setMonths] = useState(12);

  const data = useMemo(
    () => simulate(capital, riskPercent, winRate, avgRR, tradesPerMonth, feePercent, months),
    [capital, riskPercent, winRate, avgRR, tradesPerMonth, feePercent, months]
  );

  const lastPoint = data[data.length - 1];
  const totalReturn = capital > 0 ? Math.round(((lastPoint.equity - capital) / capital) * 10000) / 100 : 0;
  const maxDrawdown = Math.max(...data.map((d) => d.drawdown));

  // Expected edge calculation
  const expectedEdge = (winRate / 100) * avgRR - (1 - winRate / 100);

  const presets = [
    { label: "6 mois", value: 6 },
    { label: "1 an", value: 12 },
    { label: "2 ans", value: 24 },
    { label: "3 ans", value: 36 },
  ];

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="text-xl md:text-3xl font-bold mb-1">
        Simulateur Long Terme
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-text-muted text-xs md:text-sm mb-4 md:mb-8">
        Projetez vos performances selon votre stratégie
      </motion.p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-5 md:p-6 space-y-5">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Zap size={18} className="text-primary" /> Paramètres
          </h2>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block uppercase tracking-wider">Capital initial ($)</label>
            <input type="number" value={capital || ""} onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
              className="glass-input w-full px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">
              Risque/trade: <span className="text-primary font-bold">{riskPercent}%</span>
              <span className="text-text-muted/60 ml-1">({(capital * riskPercent / 100).toFixed(0)} $)</span>
            </label>
            <input type="range" min="0.5" max="10" step="0.5" value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value))} className="w-full accent-primary" />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">
              Win Rate: <span className="text-accent-green font-bold">{winRate}%</span>
            </label>
            <input type="range" min="30" max="80" step="1" value={winRate}
              onChange={(e) => setWinRate(parseInt(e.target.value))} className="w-full accent-[#00e676]" />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">
              R:R moyen: <span className="text-accent-yellow font-bold">1:{avgRR}</span>
            </label>
            <input type="range" min="1" max="5" step="0.5" value={avgRR}
              onChange={(e) => setAvgRR(parseFloat(e.target.value))} className="w-full accent-[#ffd600]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Trades/mois</label>
              <input type="number" value={tradesPerMonth || ""} onChange={(e) => setTradesPerMonth(parseInt(e.target.value) || 0)}
                className="glass-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Frais (%)</label>
              <input type="number" step="0.01" value={feePercent || ""} onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                className="glass-input w-full px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block uppercase tracking-wider">Horizon</label>
            <div className="flex gap-2 flex-wrap">
              {presets.map((p) => (
                <button key={p.value} onClick={() => setMonths(p.value)}
                  className={`px-4 py-2 rounded-2xl text-xs font-medium transition-all ${
                    months === p.value ? "glass-btn-primary" : "glass-btn text-text-muted"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Edge indicator */}
          <div className={`p-3 rounded-2xl text-center ${
            expectedEdge > 0 ? "bg-accent-green/10 border border-accent-green/20" : "bg-accent-red/10 border border-accent-red/20"
          }`}>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Espérance mathématique</p>
            <p className={`text-lg font-bold ${expectedEdge > 0 ? "text-accent-green neon-green" : "text-accent-red neon-red"}`}>
              {expectedEdge > 0 ? "+" : ""}{(expectedEdge * 100).toFixed(0)}% par trade
            </p>
            <p className="text-[10px] text-text-muted mt-1">
              {expectedEdge > 0 ? "Stratégie profitable" : "Stratégie perdante"}
            </p>
          </div>
        </motion.div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: DollarSign, label: "Capital final", value: `${lastPoint.equity.toLocaleString("fr-FR")} $`,
                color: lastPoint.equity >= capital ? "text-accent-green neon-green" : "text-accent-red neon-red" },
              { icon: TrendingUp, label: "Rendement", value: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(1)}%`,
                color: totalReturn >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red" },
              { icon: AlertTriangle, label: "Max DD", value: `${maxDrawdown.toFixed(1)}%`,
                color: maxDrawdown > 20 ? "text-accent-red neon-red" : maxDrawdown > 10 ? "text-accent-yellow" : "text-accent-green neon-green" },
              { icon: Target, label: "Total Trades", value: lastPoint.totalTrades.toString(), color: "text-primary neon-blue" },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }} className="glass-card p-4">
                <kpi.icon size={16} className={`mb-2 ${kpi.color}`} />
                <p className={`text-lg md:text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Equity projection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card p-5 md:p-6">
            <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Projection d&apos;équité
            </h3>
            <p className="text-xs text-text-muted mb-4">Évolution simulée du capital</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="simEq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e676" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                  <filter id="simGl"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00e676" floodOpacity="0.5"/></filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                <Tooltip contentStyle={neonTooltip} />
                <Area type="monotone" dataKey="equity" stroke="#00e676" strokeWidth={2.5}
                  fill="url(#simEq)" filter="url(#simGl)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Drawdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass-card p-5 md:p-6">
            <h3 className="text-base font-semibold mb-1">Drawdown</h3>
            <p className="text-xs text-text-muted mb-4">Exposition au risque</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="ddG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b5c" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ff3b5c" stopOpacity={0.02} />
                  </linearGradient>
                  <filter id="ddGl"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ff3b5c" floodOpacity="0.4"/></filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,45,90,0.25)" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} reversed />
                <Tooltip contentStyle={redTooltip} />
                <Area type="monotone" dataKey="drawdown" stroke="#ff3b5c" strokeWidth={2}
                  fill="url(#ddG)" filter="url(#ddGl)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Fees */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Impact frais</p>
              <p className="text-xl font-bold text-accent-yellow">{lastPoint.totalFees.toLocaleString("fr-FR")} $</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Frais / Capital</p>
              <p className="text-xl font-bold text-accent-yellow">
                {capital > 0 ? ((lastPoint.totalFees / capital) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Frais moy. / trade</p>
              <p className="text-xl font-bold text-text-muted">
                {lastPoint.totalTrades > 0 ? (lastPoint.totalFees / lastPoint.totalTrades).toFixed(2) : 0} $
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
