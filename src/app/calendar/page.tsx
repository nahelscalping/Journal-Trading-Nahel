"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { getTrades, getSettings, Trade } from "@/lib/store";

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface DayData {
  date: string;
  trades: Trade[];
  pnl: number;
  count: number;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function getWeekNumber(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfMonth = d.getDay();
  return Math.ceil((date.getDate() + firstDayOfMonth) / 7);
}

export default function CalendarPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    setTrades(getTrades());
  }, []);

  const settings = getSettings();

  // Build day data map for current month
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();
    trades.forEach((t) => {
      const d = t.date;
      // Check if trade is in current month
      const tDate = new Date(d);
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        if (!map.has(d)) {
          map.set(d, { date: d, trades: [], pnl: 0, count: 0 });
        }
        const day = map.get(d)!;
        day.trades.push(t);
        day.pnl = Math.round((day.pnl + t.pnl) * 100) / 100;
        day.count++;
      }
    });
    return map;
  }, [trades, year, month]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let totalPnl = 0;
    let tradeDays = 0;
    let wins = 0;
    let losses = 0;
    dayMap.forEach((d) => {
      totalPnl += d.pnl;
      tradeDays++;
      if (d.pnl >= 0) wins++;
      else losses++;
    });
    return { totalPnl: Math.round(totalPnl * 100) / 100, tradeDays, wins, losses };
  }, [dayMap]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const weeks = new Map<number, { pnl: number; days: number }>();
    dayMap.forEach((d) => {
      const date = new Date(d.date);
      const week = getWeekNumber(date);
      if (!weeks.has(week)) weeks.set(week, { pnl: 0, days: 0 });
      const w = weeks.get(week)!;
      w.pnl = Math.round((w.pnl + d.pnl) * 100) / 100;
      w.days++;
    });
    return weeks;
  }, [dayMap]);

  const { firstDay, daysInMonth } = getMonthDays(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const formatPnl = (pnl: number) => {
    if (Math.abs(pnl) >= 1000) {
      return `${pnl >= 0 ? "+" : ""}${(pnl / 1000).toFixed(1)}K`;
    }
    return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} $`;
  };

  // Build calendar grid (6 rows x 7 cols)
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="glass-btn p-2 rounded-xl">
            <ChevronLeft size={18} />
          </button>
          <motion.h1
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl md:text-2xl font-bold min-w-[200px] text-center"
          >
            {MONTHS_FR[month]} {year}
          </motion.h1>
          <button onClick={nextMonth} className="glass-btn p-2 rounded-xl">
            <ChevronRight size={18} />
          </button>
          <button onClick={goToday} className="glass-btn px-3 py-1.5 rounded-xl text-xs font-medium">
            Aujourd&apos;hui
          </button>
        </div>

        {/* Monthly stats bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-text-muted">Stats du mois :</span>
          <span className={`text-sm font-bold px-3 py-1 rounded-xl ${
            monthlyStats.totalPnl >= 0
              ? "bg-accent-green/15 text-accent-green"
              : "bg-accent-red/15 text-accent-red"
          }`}>
            {formatPnl(monthlyStats.totalPnl)}
          </span>
          <span className="text-xs text-text-muted">{monthlyStats.tradeDays} jours</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="glass-card p-3 md:p-4 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_FR.map((day) => (
                <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-text-muted py-2 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="aspect-square md:aspect-[4/3]" />;
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayData = dayMap.get(dateStr);
                const isToday = new Date().toISOString().split("T")[0] === dateStr;
                const isSelected = selectedDay?.date === dateStr;

                return (
                  <motion.button
                    key={dateStr}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => dayData && setSelectedDay(isSelected ? null : dayData)}
                    className={`aspect-square md:aspect-[4/3] rounded-xl md:rounded-2xl p-1 md:p-2 text-left transition-all relative overflow-hidden ${
                      dayData
                        ? dayData.pnl >= 0
                          ? "bg-accent-green/15 border border-accent-green/25 hover:border-accent-green/50"
                          : "bg-accent-red/15 border border-accent-red/25 hover:border-accent-red/50"
                        : "border border-transparent hover:bg-surface-light/30"
                    } ${isSelected ? "ring-2 ring-primary" : ""} ${
                      isToday ? "ring-1 ring-primary/50" : ""
                    }`}
                  >
                    <span className={`text-[10px] md:text-xs font-medium ${
                      isToday ? "text-primary" : dayData ? "text-foreground" : "text-text-muted/60"
                    }`}>
                      {day}
                    </span>

                    {dayData && (
                      <div className="mt-0.5">
                        <p className={`text-[9px] md:text-xs font-bold leading-tight ${
                          dayData.pnl >= 0 ? "text-accent-green" : "text-accent-red"
                        }`}>
                          {formatPnl(dayData.pnl)}
                        </p>
                        <p className="text-[8px] md:text-[10px] text-text-muted hidden md:block">
                          {dayData.count} trade{dayData.count > 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel: Weekly stats + Selected day */}
        <div className="w-full lg:w-72 space-y-4">
          {/* Weekly breakdown */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              Résumé par semaine
            </h3>
            <div className="space-y-2">
              {Array.from({ length: Math.ceil(daysInMonth / 7) + 1 }, (_, i) => i + 1).map((week) => {
                const weekData = weeklyStats.get(week);
                return (
                  <div key={week} className="flex items-center justify-between p-2.5 rounded-xl glass-btn">
                    <span className="text-xs text-text-muted">Semaine {week}</span>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        weekData
                          ? weekData.pnl >= 0 ? "text-accent-green" : "text-accent-red"
                          : "text-text-muted/40"
                      }`}>
                        {weekData ? formatPnl(weekData.pnl) : "—"}
                      </p>
                      {weekData && (
                        <p className="text-[10px] text-text-muted">{weekData.days} jour{weekData.days > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly summary */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3">Mois de {MONTHS_FR[month]}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">PnL total</span>
                <span className={`font-bold ${monthlyStats.totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {formatPnl(monthlyStats.totalPnl)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Jours verts</span>
                <span className="text-accent-green font-medium">{monthlyStats.wins}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Jours rouges</span>
                <span className="text-accent-red font-medium">{monthlyStats.losses}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Jours tradés</span>
                <span className="font-medium">{monthlyStats.tradeDays}</span>
              </div>
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              <h3 className="text-sm font-semibold mb-3">
                {new Date(selectedDay.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <div className={`text-center p-3 rounded-xl mb-3 ${
                selectedDay.pnl >= 0 ? "bg-accent-green/10" : "bg-accent-red/10"
              }`}>
                <p className={`text-xl font-bold ${
                  selectedDay.pnl >= 0 ? "text-accent-green neon-green" : "text-accent-red neon-red"
                }`}>
                  {selectedDay.pnl >= 0 ? "+" : ""}{selectedDay.pnl.toFixed(2)} $
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {selectedDay.count} trade{selectedDay.count > 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-2">
                {selectedDay.trades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-2.5 rounded-xl glass-btn text-xs">
                    <div className="flex items-center gap-2">
                      {trade.pnl >= 0
                        ? <TrendingUp size={12} className="text-accent-green" />
                        : <TrendingDown size={12} className="text-accent-red" />
                      }
                      <span className="font-medium">{trade.pair}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        trade.type === "buy" ? "bg-accent-green/15 text-accent-green" : "bg-accent-red/15 text-accent-red"
                      }`}>
                        {trade.type === "buy" ? "ACHAT" : "VENTE"}
                      </span>
                    </div>
                    <span className={`font-bold ${trade.pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                      {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)} $
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
