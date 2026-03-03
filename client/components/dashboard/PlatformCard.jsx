"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { calculateScore, getRatingColor } from "@/lib/scoreCalculator";

export default function PlatformCard({ platform }) {
  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0, active: false });
  const platformName = (platform.name || "").toLowerCase();
  const platformLogo =
    platformName === "leetcode"
      ? "/LeetCode_logo.png"
      : platformName === "geeksforgeeks"
        ? "/GeeksForGeeks_logo.png"
        : platformName === "codeforces"
          ? "/codeforces_logo.png"
          : null;
  const isCodeforces = platformName === "codeforces";
  const isLeetCode = platformName === "leetcode";
  const hasDifficultyStats =
    Number.isFinite(platform.easy) &&
    Number.isFinite(platform.medium) &&
    Number.isFinite(platform.hard);

  const score = hasDifficultyStats
    ? calculateScore(platform.easy, platform.medium, platform.hard)
    : 0;

  const displayValue = (value) => (Number.isFinite(value) ? value : "N/A");
  const ratingOrRank = isLeetCode
    ? platform.rating !== null && platform.rating !== undefined && platform.rating !== ""
      ? platform.rating
      : "N/A"
    : platform.rating !== null && platform.rating !== undefined && platform.rating !== ""
      ? platform.rating
      : platform.rank !== null && platform.rank !== undefined && platform.rank !== ""
        ? platform.rank
        : "N/A";

  const platformTheme =
    platformName === "leetcode"
      ? "bg-gradient-to-br from-slate-900 via-zinc-900 to-orange-950 border-orange-500/40"
      : platformName === "geeksforgeeks"
        ? "bg-gradient-to-br from-slate-900 via-zinc-900 to-emerald-950 border-emerald-500/40"
        : platformName === "codeforces"
          ? "bg-gradient-to-br from-slate-900 via-zinc-900 to-blue-950 border-blue-500/40"
          : "bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 border-slate-500/30";

  const glowColor =
    platformName === "leetcode"
      ? "rgba(249, 115, 22, 0.28)"
      : platformName === "geeksforgeeks"
        ? "rgba(16, 185, 129, 0.28)"
        : platformName === "codeforces"
          ? "rgba(59, 130, 246, 0.28)"
          : "rgba(148, 163, 184, 0.2)";

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursorGlow({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setCursorGlow((prev) => ({ ...prev, active: false }));
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${platformTheme} p-6 rounded-xl border backdrop-blur-md cursor-pointer group overflow-hidden relative`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: cursorGlow.active ? 1 : 0,
          background: `radial-gradient(220px circle at ${cursorGlow.x}px ${cursorGlow.y}px, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {platformLogo ? (
              <img
                src={platformLogo}
                alt={`${platform.name} logo`}
                className="h-9 w-9 rounded-md object-contain bg-black/20 p-1"
              />
            ) : (
              <span className="text-3xl">{platform.icon}</span>
            )}
            <h3 className="text-xl font-bold text-white">{platform.name}</h3>
          </div>
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
            <span className={`${getRatingColor(score)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
              {hasDifficultyStats ? `+${score}` : "N/A"}
            </span>
          </motion.div>
        </div>

        {!isCodeforces ? (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-green-500/20 p-3 rounded-lg text-center border border-green-500/30"
            >
              <p className="text-green-400 text-sm font-semibold">Easy</p>
              <p className="text-2xl font-bold text-green-300">{displayValue(platform.easy)}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-yellow-500/20 p-3 rounded-lg text-center border border-yellow-500/30"
            >
              <p className="text-yellow-400 text-sm font-semibold">Medium</p>
              <p className="text-2xl font-bold text-yellow-300">{displayValue(platform.medium)}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-red-500/20 p-3 rounded-lg text-center border border-red-500/30"
            >
              <p className="text-red-400 text-sm font-semibold">Hard</p>
              <p className="text-2xl font-bold text-red-300">{displayValue(platform.hard)}</p>
            </motion.div>
          </div>
        ) : null}

        {/* Footer Stats */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-600">
          <div>
            <p className="text-gray-400 text-sm">{isCodeforces ? "Questions Solved" : "Total Solved"}</p>
            <p className="text-xl font-bold text-white">{displayValue(platform.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">
              {isLeetCode ? "Contest Rating" : isCodeforces ? "Rating" : "Rating/Rank"}
            </p>
            <p className="text-lg font-bold text-blue-400">{ratingOrRank}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
