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
  const [cachedLogo] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("scalific_preloader_logo");
    }
    return null;
  });
  const [cachedColor] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("scalific_preloader_color");
    }
    return null;
  });

  const activeColor = brandColor || cachedColor || "#22C55E";
  const activeLogo = logoUrl || cachedLogo || "/assets/scalific-icon.svg";

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
          exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: '#ffffff', color: '#111827' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none font-sans"
        >
          {/* Subtle Ambient Glow */}
          <div
            style={{ backgroundColor: activeColor }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[80px] pointer-events-none transition-colors duration-500"
          />

          <div className="relative z-10 flex flex-col items-center space-y-6 max-w-xs text-center px-4">
            
            {/* Animated Circular Loader & Logo */}
            <div className="relative flex items-center justify-center w-28 h-28">
              {/* Spinning Round Loader SVG */}
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
              >
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="#F3F4F6"
                  strokeWidth="2"
                />
                {/* Animated colored segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke={activeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="80 250"
                  className="transition-colors duration-500"
                />
              </motion.svg>

              {/* Logo Card */}
              <div className="relative w-16 h-16 flex items-center justify-center rounded-xl p-1.5 bg-white shadow-sm border border-gray-100 overflow-hidden z-10">
                <img
                  src={activeLogo}
                  alt="Scalific Preloader Logo"
                  className="w-full h-full object-contain"
                  decoding="async"
                />
              </div>
            </div>

            {/* Brand Title & Loading Text */}
            <div className="space-y-2">
              <h2 className="text-lg font-display font-bold tracking-[0.2em] text-gray-900 uppercase">
                SCALIFIC
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-500"
                  style={{ backgroundColor: activeColor }}
                />
                <p className="text-[10px] font-medium tracking-wider text-gray-500 uppercase">
                  Loading system... <span style={{ color: activeColor }} className="transition-colors duration-500">{progress}%</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
