"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import SplashScreen from "./SplashScreen";
import { motion } from "framer-motion";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const shown = sessionStorage.getItem("neldia_splash_shown");
    if (shown) {
      setShowSplash(false);
      setAppReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setAppReady(true);
    sessionStorage.setItem("neldia_splash_shown", "true");
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {appReady && (
        <div className="flex min-h-screen">
          {/* Desktop sidebar */}
          {!isMobile && <Sidebar />}

          {/* Main content */}
          <motion.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className={
              isMobile
                ? "flex-1 px-3 pt-5 pb-24 min-h-screen"
                : "flex-1 p-8 ml-[260px]"
            }
          >
            {children}
          </motion.main>

          {/* Mobile bottom navigation */}
          {isMobile && <BottomNav />}
        </div>
      )}
    </>
  );
}
