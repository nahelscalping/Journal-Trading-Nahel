"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
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
          <Sidebar />
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`flex-1 p-4 md:p-8 ${isMobile ? "pt-16" : "ml-[260px]"}`}
          >
            {children}
          </motion.main>
        </div>
      )}
    </>
  );
}
