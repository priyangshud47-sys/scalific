"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SitePreloaderProps {
  isLoading: boolean;
  logoUrl?: string | null;
  brandColor?: string | null;
}

export default function SitePreloader({ isLoading, logoUrl, brandColor }: SitePreloaderProps) {
  const [progress, setProgress] = useState(15);
  const activeColor = brandColor || "#22C55E";
  const activeLogo = logoUrl || "/assets/scalific-icon.svg";

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="site-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F17] text-white overflow-hidden select-none font-sans"
        >
          {/* Dynamic Ambient Glowing Background Orb */}
          <div
            style={{ backgroundColor: activeColor }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none transition-colors duration-500"
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none mix-blend-overlay" />

          <div className="relative z-10 flex flex-col items-center space-y-8 max-w-xs text-center px-4">
            {/* Animated Logo Container */}
            <div className="relative flex items-center justify-center">
              {/* Outer Pulse Glow Ring */}
              <motion.div
                style={{ backgroundColor: activeColor }}
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.25, 0.6, 0.25],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-28 h-28 rounded-3xl blur-xl transition-colors duration-500"
              />

              {/* Spinning Dynamic Border Highlight */}
              <motion.div
                style={{ borderColor: `${activeColor}66` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute w-24 h-24 rounded-3xl border transition-colors duration-500"
              />

              {/* Logo Card */}
              <motion.div
                animate={{
                  scale: [1, 1.04, 1],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-20 h-20 rounded-2xl bg-white p-2.5 shadow-2xl flex items-center justify-center border border-white/20 overflow-hidden"
              >
                <img
                  src={activeLogo}
                  alt="Scalific Preloader Logo"
                  className="w-full h-full object-contain"
                  decoding="async"
                />
              </motion.div>
            </div>

            {/* Brand Title */}
            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold tracking-[0.2em] text-white uppercase">
                SCALIFIC
              </h2>
              <p
                style={{ color: activeColor }}
                className="text-[11px] font-medium tracking-widest uppercase transition-colors duration-500"
              >
                Digital Growth Agency
              </p>
            </div>

            {/* Loading Progress Bar & Percentage */}
            <div className="w-48 space-y-2">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div
                  initial={{ width: "15%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(to right, ${activeColor}, ${activeColor}dd)`,
                    boxShadow: `0 0 12px ${activeColor}`,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 px-0.5">
                <span>Loading system...</span>
                <span style={{ color: activeColor }}>{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
