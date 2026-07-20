"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SitePreloaderProps {
  isLoading: boolean;
}

export default function SitePreloader({ isLoading }: SitePreloaderProps) {
  const [progress, setProgress] = useState(15);

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
          {/* Subtle Ambient Glowing Background Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none mix-blend-overlay" />

          <div className="relative z-10 flex flex-col items-center space-y-8 max-w-xs text-center px-4">
            {/* Animated Logo Container */}
            <div className="relative flex items-center justify-center">
              {/* Outer Pulse Glow Ring */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-28 h-28 rounded-3xl bg-emerald-500/20 blur-xl"
              />

              {/* Spinning Subtle Border Highlight */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute w-24 h-24 rounded-3xl border border-emerald-500/30"
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
                className="relative w-20 h-20 rounded-2xl bg-white p-2 shadow-2xl shadow-emerald-500/30 flex items-center justify-center border border-white/20"
              >
                <img
                  src="/assets/scalific-icon.svg"
                  alt="Scalific"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>

            {/* Brand Title */}
            <div className="space-y-1">
              <h2 className="text-xl font-display font-bold tracking-[0.2em] text-white uppercase">
                SCALIFIC
              </h2>
              <p className="text-[11px] font-medium tracking-widest text-emerald-400 uppercase">
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
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.8)]"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 px-0.5">
                <span>Loading system...</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
