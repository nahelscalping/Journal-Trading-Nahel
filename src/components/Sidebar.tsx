"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  ClipboardList,
  StickyNote,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "PRINCIPAL", items: [] },
  { href: "/dashboard", label: "Aperçu", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/calculator", label: "Calculatrice Spot", icon: Calculator },
  { label: "ANALYSE", items: [] },
  { href: "/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/simulator", label: "Simulateur", icon: LineChart },
  { href: "/neldia", label: "Nahel IA", icon: Bot },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/plans", label: "Plans", icon: ClipboardList },
  { label: "COMPTE", items: [] },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile menu on nav
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Mobile hamburger
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 glass-btn p-2.5 rounded-2xl"
        >
          <Menu size={22} />
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-screen w-72 glass z-50 flex flex-col"
                style={{ background: "rgba(6, 8, 15, 0.9)", backdropFilter: "blur(24px)" }}
              >
                <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
                  <img src="/logo.png" alt="Nahel Trading" className="w-10 h-10 rounded-xl" />
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    Nahel Trading
                  </span>
                  <button onClick={() => setMobileOpen(false)} className="ml-auto glass-btn p-2 rounded-xl">
                    <X size={18} />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                  {renderNav(navItems, pathname)}
                </nav>
                {renderUser()}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop sidebar
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        background: "rgba(6, 8, 15, 0.85)",
        backdropFilter: "blur(24px) saturate(150%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <img src="/logo.png" alt="Nahel Trading" className="w-10 h-10 rounded-xl" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent whitespace-nowrap"
            >
              Nahel Trading
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto glass-btn p-1.5 rounded-xl"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item, i) => {
          if ("items" in item && !item.href) {
            return (
              <AnimatePresence key={i}>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold tracking-widest text-text-muted/60 mt-6 mb-2 px-3 uppercase"
                  >
                    {item.label}
                  </motion.p>
                )}
              </AnimatePresence>
            );
          }

          const Icon = item.icon!;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-1 transition-all duration-200 group relative
                ${isActive
                  ? "glass-btn-primary"
                  : "text-text-muted hover:text-foreground"
                }`}
              style={isActive ? {} : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon size={19} className={isActive ? "text-white" : "group-hover:text-primary-light"} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[13px] font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {renderUser(collapsed)}
    </motion.aside>
  );
}

function renderNav(items: typeof navItems, pathname: string) {
  return items.map((item, i) => {
    if ("items" in item && !item.href) {
      return (
        <p key={i} className="text-[10px] font-semibold tracking-widest text-text-muted/60 mt-6 mb-2 px-3 uppercase">
          {item.label}
        </p>
      );
    }

    const Icon = item.icon!;
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.href}
        href={item.href!}
        className={`flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 transition-all duration-200
          ${isActive ? "glass-btn-primary" : "text-text-muted active:bg-white/5"}`}
      >
        <Icon size={20} className={isActive ? "text-white" : ""} />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  });
}

function renderUser(collapsed?: boolean) {
  return (
    <div className="border-t border-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm shadow-lg"
          style={{ boxShadow: "0 0 12px rgba(91, 110, 245, 0.3)" }}>
          N
        </div>
        {collapsed !== true && (
          <div>
            <p className="text-sm font-medium">Nahel</p>
            <p className="text-xs text-text-muted">Trader Spot</p>
          </div>
        )}
      </div>
    </div>
  );
}
