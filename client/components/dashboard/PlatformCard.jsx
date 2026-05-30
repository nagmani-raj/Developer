"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { calculateScore, getRatingColor } from "@/lib/scoreCalculator";

const PLATFORM_THEMES = {
  leetcode: {
    gradient: "linear-gradient(145deg, #0f1629, #1a0f00)",
    accentColor: "#f97316",
    accentBg: "rgba(249,115,22,0.1)",
    accentBorder: "rgba(249,115,22,0.25)",
    glow: "rgba(249,115,22,0.15)",
    badge: "rgba(249,115,22,0.12)",
  },
  geeksforgeeks: {
    gradient: "linear-gradient(145deg, #0f1629, #001a0f)",
    accentColor: "#10b981",
    accentBg: "rgba(16,185,129,0.1)",
    accentBorder: "rgba(16,185,129,0.25)",
    glow: "rgba(16,185,129,0.15)",
    badge: "rgba(16,185,129,0.12)",
  },
  codeforces: {
    gradient: "linear-gradient(145deg, #0f1629, #00051a)",
    accentColor: "#3b82f6",
    accentBg: "rgba(59,130,246,0.1)",
    accentBorder: "rgba(59,130,246,0.25)",
    glow: "rgba(59,130,246,0.15)",
    badge: "rgba(59,130,246,0.12)",
  },
  default: {
    gradient: "linear-gradient(145deg, #0f1629, #111827)",
    accentColor: "#94a3b8",
    accentBg: "rgba(148,163,184,0.08)",
    accentBorder: "rgba(148,163,184,0.15)",
    glow: "rgba(148,163,184,0.08)",
    badge: "rgba(148,163,184,0.08)",
  },
};

const DIFFICULTY_CONFIG = [
  { key: "easy",   label: "Easy",   color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)" },
  { key: "medium", label: "Med",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)" },
  { key: "hard",   label: "Hard",   color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)" },
];

const LOGO_MAP = {
  leetcode: "/LeetCode_logo.png",
  geeksforgeeks: "/GeeksForGeeks_logo.png",
  codeforces: "/codeforces_logo.png",
};

export default function PlatformCard({ platform }) {
  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0, active: false });
  const platformName = (platform.name || "").toLowerCase();
  const theme = PLATFORM_THEMES[platformName] || PLATFORM_THEMES.default;
  const logo = LOGO_MAP[platformName];

  const isCodeforces = platformName === "codeforces";
  const isLeetCode = platformName === "leetcode";
  const hasDiffStats =
    Number.isFinite(platform.easy) &&
    Number.isFinite(platform.medium) &&
    Number.isFinite(platform.hard);

  const score = hasDiffStats ? calculateScore(platform.easy, platform.medium, platform.hard) : 0;
  const displayValue = (v) => (Number.isFinite(v) ? v.toLocaleString() : "—");

  const ratingOrRank =
    platform.rating != null && platform.rating !== ""
      ? platform.rating
      : platform.rank != null && platform.rank !== ""
      ? platform.rank
      : "—";

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  };
  const handleMouseLeave = () => setCursorGlow((p) => ({ ...p, active: false }));

  const total = Number.isFinite(platform.total) ? platform.total : 0;
  const maxForBar = Math.max(total, 1);

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: theme.gradient,
        border: `1px solid ${theme.accentBorder}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${theme.accentBorder}`,
      }}
    >
      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: cursorGlow.active ? 1 : 0,
          background: `radial-gradient(200px circle at ${cursorGlow.x}px ${cursorGlow.y}px, ${theme.glow}, transparent 70%)`,
        }}
      />

      {/* Animated top border */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)` }}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {logo ? (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5"
                style={{ background: theme.accentBg, border: `1px solid ${theme.accentBorder}` }}
              >
                <img src={logo} alt={platform.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <span className="text-2xl">{platform.icon}</span>
            )}
            <div>
              <h3 className="font-bold text-sm" style={{ color: "#f8fafc" }}>{platform.name}</h3>
              <p className="text-xs" style={{ color: theme.accentColor }}>
                {isCodeforces ? "Competitive" : isLeetCode ? "Algorithm" : "DSA"}
              </p>
            </div>
          </div>

          {/* Score badge */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{
              background: hasDiffStats ? theme.badge : "rgba(15,23,42,0.5)",
              border: `1px solid ${hasDiffStats ? theme.accentBorder : "rgba(148,163,184,0.1)"}`,
              color: hasDiffStats ? theme.accentColor : "#334155",
            }}
          >
            {hasDiffStats ? `+${score}` : "N/A"}
          </motion.div>
        </div>

        {/* Difficulty breakdown */}
        {!isCodeforces && hasDiffStats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DIFFICULTY_CONFIG.map(({ key, label, color, bg, border }) => (
              <div
                key={key}
                className="text-center p-2.5 rounded-xl"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <p className="text-xs font-semibold mb-0.5" style={{ color }}>{label}</p>
                <p className="text-lg font-black" style={{ color }}>
                  {platform[key] ?? "—"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Total solved progress */}
        {!isCodeforces && hasDiffStats && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "#475569" }}>Progress</span>
              <span style={{ color: "#94a3b8" }}>{total} solved</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(100, (total / (total + 50)) * 100)}%`,
                  background: `linear-gradient(90deg, ${theme.accentColor}80, ${theme.accentColor})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer stats */}
        <div
          className="flex justify-between items-center pt-3"
          style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}
        >
          <div>
            <p className="text-xs mb-0.5" style={{ color: "#334155" }}>
              {isCodeforces ? "Problems Solved" : "Total Solved"}
            </p>
            <p className="text-xl font-black" style={{ color: theme.accentColor }}>
              {displayValue(platform.total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-0.5" style={{ color: "#334155" }}>
              {isLeetCode ? "Contest Rating" : isCodeforces ? "Rating" : "Rating/Rank"}
            </p>
            <p className="text-base font-bold" style={{ color: "#94a3b8" }}>
              {ratingOrRank}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
