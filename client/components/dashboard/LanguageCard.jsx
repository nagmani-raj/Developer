"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getLanguages } from "@/lib/api";

const LANG_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#f97316", "#a78bfa", "#34d399",
];

export default function LanguageCard({ refreshKey }) {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const lc  = typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg = typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;
        const data = await getLanguages({ leetcode: lc || undefined, geeksforgeeks: gfg || undefined });
        setLanguages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading languages:", err);
        setLanguages([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const maxProblems = Math.max(...languages.map((l) => l.problems || 0), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />

      {/* Header */}
      <div className="section-header mb-5">
        <div
          className="section-header-icon"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          💻
        </div>
        <h3 className="section-header-title gradient-text-green-cyan">
          Language Usage
        </h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3.5 w-20 rounded shimmer" />
                <div className="h-3.5 w-16 rounded shimmer" />
              </div>
              <div className="h-2 rounded-full shimmer" />
            </div>
          ))}
        </div>
      ) : languages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-3xl mb-3">🔍</span>
          <p className="text-sm font-medium" style={{ color: "#475569" }}>No language data yet</p>
          <p className="text-xs mt-1" style={{ color: "#334155" }}>Connect LeetCode or GFG to see your language stats</p>
        </div>
      ) : (
        <div className="space-y-4">
          {languages.map((lang, i) => {
            const color = LANG_COLORS[i % LANG_COLORS.length];
            const pct = Math.round((lang.problems / maxProblems) * 100);
            return (
              <motion.div
                key={lang.language}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 + 0.1 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className="text-sm font-medium" style={{ color: "#cbd5e1" }}>
                      {lang.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color }}>
                      {lang.problems}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                    >
                      {lang.percentage != null ? `${Math.round(lang.percentage)}%` : `${pct}%`}
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${lang.percentage ?? pct}%` }}
                    transition={{ delay: i * 0.07 + 0.3, duration: 0.9, ease: "easeOut" }}
                    style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
