"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { calculateScore, getRatingLevel } from "@/lib/scoreCalculator";
import { getLivePlatformsDebug, getPlatforms, getProfile } from "@/lib/api";

function normalizeHandleToName(handle) {
  const raw = String(handle || "").trim();
  if (!raw) return "";
  const withSpaces = raw
    .replace(/[_\-.]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = withSpaces
    .split(" ")
    .map((part) => part.replace(/^\d+|\d+$/g, ""))
    .filter(Boolean);
  if (tokens.length === 0) return "";
  return tokens
    .slice(0, 3)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function inferDisplayNameFromHandles(handles) {
  const priority = [handles.leetcode, handles.codeforces, handles.geeksforgeeks, handles.github];
  for (const handle of priority) {
    const normalized = normalizeHandleToName(handle);
    if (normalized.length >= 3) return normalized;
  }
  return "";
}

// ── Loading Skeleton ──
function ProfileSkeleton() {
  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex items-start gap-5 mb-6">
        <div className="w-20 h-20 rounded-2xl shimmer flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 rounded-lg shimmer" />
          <div className="h-4 w-64 rounded shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl shimmer" />
        ))}
      </div>
    </div>
  );
}

export default function ProfileCard({ refreshKey = 0 }) {
  const [profileData, setProfileData] = useState(null);
  const [aggregatedStats, setAggregatedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const toNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const applyLiveData = (platforms, live) => {
      if (!Array.isArray(platforms)) return [];
      if (!live || typeof live !== "object") return platforms;
      return platforms.map((platform) => {
        const name = String(platform?.name || "").toLowerCase();
        const upd = { ...platform };
        if (name === "leetcode" && live.leetcode) {
          const lc = live.leetcode;
          upd.easy   = toNumber(lc.easy)          ?? platform.easy;
          upd.medium = toNumber(lc.medium)         ?? platform.medium;
          upd.hard   = toNumber(lc.hard)           ?? platform.hard;
          upd.total  = toNumber(lc.totalSolved)    ?? platform.total;
          upd.rating = toNumber(lc.contestRating)  ?? platform.rating;
          upd.rank   = toNumber(lc.contestGlobalRanking) ?? platform.rank;
        }
        if (name === "codeforces" && live.codeforces) {
          const cf = live.codeforces;
          upd.easy   = null;
          upd.medium = null;
          upd.hard   = null;
          upd.total  = toNumber(cf.totalSolved) ?? platform.total;
          upd.rating = toNumber(cf.rating)      ?? platform.rating;
          upd.rank   = toNumber(cf.rank)        ?? platform.rank;
        }
        if (name === "geeksforgeeks" && live.geeksforgeeks) {
          const gfg = live.geeksforgeeks;
          upd.easy   = toNumber(gfg.easy)           ?? platform.easy;
          upd.medium = toNumber(gfg.medium)          ?? platform.medium;
          upd.hard   = toNumber(gfg.hard)            ?? platform.hard;
          upd.total  = toNumber(gfg.totalSolved) ?? toNumber(gfg.total) ?? toNumber(gfg.score) ?? platform.total;
          upd.rating = toNumber(gfg.codingScore) ?? toNumber(gfg.score) ?? platform.rating;
          upd.rank   = toNumber(gfg.rank)            ?? platform.rank;
        }
        return upd;
      });
    };

    const buildStats = (platforms) => {
      const safe = Array.isArray(platforms) ? platforms : [];
      const totals = safe.map((p) => toNumber(p.total)).filter((n) => n !== null);
      const totalSolved = totals.reduce((s, v) => s + v, 0);
      const ratings = safe.map((p) => toNumber(p.rating)).filter((n) => n !== null);
      const averageRating =
        ratings.length > 0
          ? Number((ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1))
          : 0;
      const totalScore = safe.reduce((sum, p) => {
        const e = toNumber(p.easy), m = toNumber(p.medium), h = toNumber(p.hard), t = toNumber(p.total);
        if (e !== null && m !== null && h !== null) return sum + calculateScore(e, m, h);
        return sum + (t !== null ? t * 50 : 0);
      }, 0);
      return { totalSolved, totalScore, averageRating };
    };

    const loadData = async () => {
      try {
        const [profile, basePlatforms] = await Promise.all([getProfile(), getPlatforms()]);
        const cf  = typeof window !== "undefined" ? localStorage.getItem("CODEFORCES_HANDLE") : null;
        const lc  = typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg = typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;
        const gh  = typeof window !== "undefined"
          ? localStorage.getItem("GITHUB_USERNAME") || localStorage.getItem("GITHUB_HANDLE") || localStorage.getItem("LAST_GITHUB_USERNAME")
          : null;

        const liveResult = await getLivePlatformsDebug({
          codeforces: cf || undefined,
          leetcode: lc || undefined,
          geeksforgeeks: gfg || undefined,
        });
        const merged = applyLiveData(basePlatforms, liveResult.normalized || {});
        const stats  = buildStats(merged);
        const inferredName = inferDisplayNameFromHandles({ codeforces: cf, leetcode: lc, geeksforgeeks: gfg, github: gh });
        const resolvedName = inferredName || String(profile?.name || "").trim() || "Developer";
        setProfileData({ ...(profile || {}), name: resolvedName });
        setAggregatedStats(stats);
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  if (loading) return <ProfileSkeleton />;

  if (error || !profileData || !aggregatedStats) {
    return (
      <div
        className="glass-card p-6 flex items-center gap-4 rounded-2xl"
        style={{ borderColor: "rgba(239,68,68,0.2)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(239,68,68,0.15)" }}>⚠️</div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#fca5a5" }}>Backend not available</p>
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Start the backend server on port 5000 to load profile data.</p>
        </div>
      </div>
    );
  }

  const ratingInfo = getRatingLevel(aggregatedStats.totalScore);
  const displayName = String(profileData?.name || "").trim() || "Developer";
  const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const statItems = [
    {
      label: "Problems Solved",
      value: aggregatedStats.totalSolved,
      icon: "🏆",
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      border: "rgba(59,130,246,0.2)",
    },
    {
      label: "Total Score",
      value: aggregatedStats.totalScore,
      icon: "⭐",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.2)",
    },
    {
      label: "Avg Rating",
      value: aggregatedStats.averageRating,
      icon: "📈",
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      border: "rgba(139,92,246,0.2)",
    },
    {
      label: "Level",
      value: ratingInfo.level,
      icon: "🎖️",
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.2)",
      isText: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6 sm:p-8 relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />

      <div className="relative z-10">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start gap-5 mb-7">
          {/* Avatar */}
          <motion.div whileHover={{ scale: 1.05 }} className="flex-shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white relative"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
                boxShadow: "0 0 30px rgba(59,130,246,0.35), 0 8px 20px rgba(0,0,0,0.4)",
              }}
            >
              {initials}
              {/* Online dot */}
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 pulse-dot"
                style={{
                  background: "#10b981",
                  borderColor: "var(--bg-base)",
                  boxShadow: "0 0 8px rgba(16,185,129,0.6)",
                }}
              />
            </div>
          </motion.div>

          {/* Name & info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "#f8fafc" }}>
                {displayName}
              </h2>
              <span
                className="badge badge-blue"
                style={{ fontSize: "0.7rem" }}
              >
                {ratingInfo.level}
              </span>
            </div>
            {profileData.bio && (
              <p className="text-sm leading-relaxed mb-2" style={{ color: "#64748b" }}>
                {profileData.bio}
              </p>
            )}
            <p className="text-xs" style={{ color: "#334155" }}>
              Competitive Programmer · Developer
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statItems.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.3, duration: 0.5 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="p-4 rounded-xl relative overflow-hidden"
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{stat.icon}</span>
                <p className="text-xs font-medium" style={{ color: "#475569" }}>
                  {stat.label}
                </p>
              </div>
              <p
                className="text-2xl font-black stat-number"
                style={{ color: stat.color }}
              >
                {stat.isText ? stat.value : stat.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
