"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAlgorithms } from "@/lib/api";

const ALGO_COLORS = [
  "#8b5cf6", "#ec4899", "#3b82f6", "#f97316", "#10b981",
  "#f59e0b", "#06b6d4", "#ef4444", "#a78bfa", "#34d399",
];

export default function AlgorithmCard({ refreshKey }) {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const lc  = typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg = typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;
        const data = await getAlgorithms({ leetcode: lc || undefined, geeksforgeeks: gfg || undefined });
        setAlgorithms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading algorithms:", err);
        setAlgorithms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const totalProblems = useMemo(
    () => algorithms.reduce((s, a) => s + (a.count || 0), 0),
    [algorithms]
  );

  const visibleAlgorithms = useMemo(
    () => (showAll ? algorithms : algorithms.slice(0, 6)),
    [algorithms, showAll]
  );

  const canToggle = algorithms.length > 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          transform: "translate(-30%, -30%)",
        }}
      />

      {/* Header */}
      <div className="section-header mb-5">
        <div
          className="section-header-icon"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          🧩
        </div>
        <h3 className="section-header-title gradient-text-pink-purple">
          Algorithm Categories
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-xl shimmer" />
          ))}
        </div>
      ) : algorithms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-3xl mb-3">🧩</span>
          <p className="text-sm font-medium" style={{ color: "#475569" }}>No algorithm data yet</p>
          <p className="text-xs mt-1" style={{ color: "#334155" }}>Connect LeetCode or GFG to see your categories</p>
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            <AnimatePresence>
              {visibleAlgorithms.map((algo, i) => {
                const percent = totalProblems ? Math.round((algo.count / totalProblems) * 100) : 0;
                const color = ALGO_COLORS[i % ALGO_COLORS.length];
                return (
                  <motion.div
                    key={algo.category}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl group"
                    style={{
                      background: "rgba(15,23,42,0.5)",
                      border: "1px solid rgba(148,163,184,0.07)",
                    }}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                      />
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "#94a3b8" }}
                      >
                        {algo.category}
                      </span>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
                      >
                        {percent}%
                      </span>
                      <span className="text-sm font-bold" style={{ color }}>
                        {algo.count}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {canToggle && (
            <motion.button
              type="button"
              onClick={() => setShowAll((p) => !p)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="mt-4 w-full py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
                color: "#a78bfa",
              }}
            >
              {showAll ? `▲ Show Less` : `▼ Show All (${algorithms.length})`}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}
