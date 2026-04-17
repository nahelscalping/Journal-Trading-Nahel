"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Bot, CalendarDays, MoreHorizontal,
  BarChart3, Calculator, LineChart, StickyNote, ClipboardList, Settings, X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const mainNav = [
  { href: "/dashboard", label: "Aperçu", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/neldia", label: "IA", icon: Bot },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
];

const moreNav = [
  { href: "/calculator", label: "Calculatrice", icon: Calculator },
  { href: "/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/simulator", label: "Simulateur", icon: LineChart },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/plans", label: "Plans", icon: ClipboardList },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreNav.some((i) => i.href === pathname);

  return (
    <>
      {/* More drawer overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 pb-8"
              style={{
                background: "rgba(8, 9, 20, 0.97)",
                backdropFilter: "blur(24px)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-text-muted uppercase tracking-widest">Menu</p>
                <button onClick={() => setShowMore(false)} className="glass-btn p-2 rounded-xl">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moreNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                        isActive
                          ? "bg-primary/20 border border-primary/30"
                          : "glass-btn"
                      }`}
                    >
                      <Icon size={22} className={isActive ? "text-primary" : "text-text-muted"} />
                      <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-text-muted"}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2"
        style={{
          background: "rgba(6, 8, 15, 0.92)",
          backdropFilter: "blur(24px) saturate(160%)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "env(safe-area-inset-bottom, 12px)",
          paddingTop: "10px",
        }}
      >
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                />
              )}
              <Icon
                size={22}
                className={isActive ? "text-primary" : "text-text-muted"}
              />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-text-muted"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center gap-1 px-4 py-1 relative"
        >
          {isMoreActive && (
            <motion.div
              layoutId="bottomNavIndicator"
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
            />
          )}
          <MoreHorizontal
            size={22}
            className={isMoreActive ? "text-primary" : "text-text-muted"}
          />
          <span className={`text-[10px] font-medium ${isMoreActive ? "text-primary" : "text-text-muted"}`}>
            Plus
          </span>
        </button>
      </div>
    </>
  );
}
