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
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
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

export default function ProfileCard({ refreshKey = 0 }) {
  const [profileData, setProfileData] = useState(null);
  const [aggregatedStats, setAggregatedStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const applyLiveData = (currentPlatforms, live) => {
      if (!Array.isArray(currentPlatforms)) return [];
      if (!live || typeof live !== "object") return currentPlatforms;

      return currentPlatforms.map((platform) => {
        const name = String(platform?.name || "").toLowerCase();
        const updated = { ...platform };

        if (name === "leetcode" && live.leetcode) {
          const lc = live.leetcode;
          updated.easy = toNumber(lc.easy) ?? platform.easy;
          updated.medium = toNumber(lc.medium) ?? platform.medium;
          updated.hard = toNumber(lc.hard) ?? platform.hard;
          updated.total = toNumber(lc.totalSolved) ?? platform.total;
          updated.rating = toNumber(lc.contestRating) ?? platform.rating;
          updated.rank = toNumber(lc.contestGlobalRanking) ?? platform.rank;
        }

        if (name === "codeforces" && live.codeforces) {
          const cf = live.codeforces;
          updated.easy = null;
          updated.medium = null;
          updated.hard = null;
          updated.total = toNumber(cf.totalSolved) ?? platform.total;
          updated.rating = toNumber(cf.rating) ?? platform.rating;
          updated.rank = toNumber(cf.rank) ?? platform.rank;
        }

        if (name === "geeksforgeeks" && live.geeksforgeeks) {
          const gfg = live.geeksforgeeks;
          updated.easy = toNumber(gfg.easy) ?? platform.easy;
          updated.medium = toNumber(gfg.medium) ?? platform.medium;
          updated.hard = toNumber(gfg.hard) ?? platform.hard;
          updated.total =
            toNumber(gfg.totalSolved) ??
            toNumber(gfg.total) ??
            toNumber(gfg.score) ??
            platform.total;
          updated.rating = toNumber(gfg.codingScore) ?? toNumber(gfg.score) ?? platform.rating;
          updated.rank = toNumber(gfg.rank) ?? platform.rank;
        }

        return updated;
      });
    };

    const buildAggregatedStats = (platforms) => {
      const safePlatforms = Array.isArray(platforms) ? platforms : [];

      const totals = safePlatforms
        .map((p) => toNumber(p.total))
        .filter((n) => n !== null);
      const totalSolved = totals.reduce((sum, value) => sum + value, 0);

      const ratings = safePlatforms
        .map((p) => toNumber(p.rating))
        .filter((n) => n !== null);
      const averageRatingRaw =
        ratings.length > 0
          ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
          : 0;

      const totalScore = safePlatforms.reduce((sum, p) => {
        const easy = toNumber(p.easy);
        const medium = toNumber(p.medium);
        const hard = toNumber(p.hard);
        const total = toNumber(p.total);

        if (easy !== null && medium !== null && hard !== null) {
          return sum + calculateScore(easy, medium, hard);
        }

        // Fallback score for platforms without difficulty split (e.g., Codeforces).
        return sum + (total !== null ? total * 50 : 0);
      }, 0);

      return {
        totalSolved,
        totalScore,
        averageRating: Number(averageRatingRaw.toFixed(1)),
      };
    };

    const loadData = async () => {
      try {
        const [profile, basePlatforms] = await Promise.all([getProfile(), getPlatforms()]);

        const cf =
          typeof window !== "undefined" ? localStorage.getItem("CODEFORCES_HANDLE") : null;
        const lc =
          typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg =
          typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;
        const gh =
          typeof window !== "undefined"
            ? localStorage.getItem("GITHUB_USERNAME") ||
              localStorage.getItem("GITHUB_HANDLE") ||
              localStorage.getItem("LAST_GITHUB_USERNAME")
            : null;

        const liveResult = await getLivePlatformsDebug({
          codeforces: cf || undefined,
          leetcode: lc || undefined,
          geeksforgeeks: gfg || undefined,
        });

        const mergedPlatforms = applyLiveData(basePlatforms, liveResult.normalized || {});
        const stats = buildAggregatedStats(mergedPlatforms);
        const inferredName = inferDisplayNameFromHandles({
          codeforces: cf,
          leetcode: lc,
          geeksforgeeks: gfg,
          github: gh,
        });
        const resolvedName =
          inferredName || String(profile?.name || "").trim() || "Developer";

        setProfileData({
          ...(profile || {}),
          name: resolvedName,
        });
        setAggregatedStats(stats);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  if (loading) {
    return (
      <motion.div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-blue-600/50 backdrop-blur-md h-64 flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </motion.div>
    );
  }

  if (!profileData || !aggregatedStats) {
    return (
      <motion.div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-blue-600/50 backdrop-blur-md h-64 flex items-center justify-center">
        <p className="text-red-300">Backend data not available. Start backend on port 5000.</p>
      </motion.div>
    );
  }

  const ratingInfo = getRatingLevel(aggregatedStats.totalScore);
  const displayName = String(profileData?.name || "").trim() || "Developer";

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-blue-600/50 backdrop-blur-md overflow-hidden"
    >
      <div>
        <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
          <motion.div whileHover={{ scale: 1.05 }} className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-blue-400 shadow-lg shadow-blue-500/50">
              {profileData.name?.charAt(0) || "D"}
            </div>
          </motion.div>

          <div className="flex-1 min-w-0 bg-slate-900/60 border border-slate-700 rounded-xl p-4 md:p-5">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight text-cyan-300">
              {displayName}
            </h2>
            {profileData.bio ? <p className="text-gray-200 mb-1">{profileData.bio}</p> : null}
            {/* {profileData.email ? <p className="text-sm text-blue-200">{profileData.email}</p> : null} */}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30 hover:border-blue-500/60 transition-colors"
          >
            <p className="text-gray-400 text-sm">Total Solved</p>
            <p className="text-3xl font-bold text-blue-300">{aggregatedStats.totalSolved}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-yellow-600/20 p-4 rounded-lg border border-yellow-500/30 hover:border-yellow-500/60 transition-colors"
          >
            <p className="text-gray-400 text-sm">Total Score</p>
            <p className="text-3xl font-bold text-yellow-300">{aggregatedStats.totalScore}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-purple-600/20 p-4 rounded-lg border border-purple-500/30 hover:border-purple-500/60 transition-colors"
          >
            <p className="text-gray-400 text-sm">Avg Rating</p>
            <p className="text-3xl font-bold text-purple-300">{aggregatedStats.averageRating}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="bg-gradient-to-br from-green-600/20 to-blue-600/20 p-4 rounded-lg border-2 border-green-500/50 hover:border-green-500/100 transition-colors"
          >
            <p className="text-gray-400 text-sm">Level</p>
            <p className={`text-2xl font-bold ${ratingInfo.color}`}>{ratingInfo.level}</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
