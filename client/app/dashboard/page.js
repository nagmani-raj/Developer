"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ProfileCard from "@/components/dashboard/ProfileCard";
import ScoreCard from "@/components/dashboard/ScoreCard";
import PlatformCard from "@/components/dashboard/PlatformCard";
import PlatformSettings from "@/components/dashboard/PlatformSettings";
import LanguageCard from "@/components/dashboard/LanguageCard";
import AlgorithmCard from "@/components/dashboard/AlgorithmCard";
import { getLivePlatformsDebug, getPlatforms } from "@/lib/api";

function SectionHeader({ icon, title, subtitle, gradient }) {
  return (
    <div className="section-header mb-6">
      <div
        className="section-header-icon"
        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}
      >
        {icon}
      </div>
      <div>
        <h2
          className="section-header-title"
          style={{
            background: gradient || "linear-gradient(135deg,#60a5fa,#a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsKey, setAnalyticsKey] = useState(0);

  const applyLiveData = (currentPlatforms, live) => {
    if (!live || typeof live !== "object") return currentPlatforms;
    const statuses = live._statuses || {};
    const isMissingIdentityError = (status) => {
      const msg = String(status?.error || "").toLowerCase();
      return msg.includes("username not provided") || msg.includes("handle not provided");
    };

    return currentPlatforms.map((p) => {
      const name = (p.name || "").toLowerCase();
      const updated = { ...p };

      if (name === "leetcode" && live.leetcode) {
        const lc = live.leetcode;
        updated.easy   = lc.easy          ?? p.easy;
        updated.medium = lc.medium         ?? p.medium;
        updated.hard   = lc.hard           ?? p.hard;
        updated.total  = lc.totalSolved    ?? p.total;
        updated.rating = lc.contestRating  ?? p.rating;
        updated.rank   = lc.contestGlobalRanking ?? p.rank;
      }
      if (name === "codeforces" && live.codeforces) {
        const cf = live.codeforces;
        updated.easy   = null;
        updated.medium = null;
        updated.hard   = null;
        updated.total  = cf.totalSolved ?? p.total;
        updated.rating = cf.rating      ?? p.rating;
        updated.rank   = cf.rank        ?? p.rank;
      }
      if (name === "geeksforgeeks" && live.geeksforgeeks) {
        const gfg = live.geeksforgeeks;
        updated.easy   = gfg.easy           ?? p.easy;
        updated.medium = gfg.medium          ?? p.medium;
        updated.hard   = gfg.hard            ?? p.hard;
        updated.total  = gfg.totalSolved ?? gfg.total ?? gfg.score ?? p.total;
        updated.rating = gfg.codingScore ?? gfg.score ?? p.rating;
        updated.rank   = gfg.rank            ?? p.rank;
      }
      return updated;
    });
  };

  const handleLiveData = (live) =>
    setPlatforms((prev) => applyLiveData(prev, live));

  const handleRefreshAnalytics = () =>
    setAnalyticsKey((k) => k + 1);

  useEffect(() => {
    const loadPlatforms = async () => {
      setLoading(true);
      try {
        const base = await getPlatforms();
        let platformsArr = Array.isArray(base) ? base : [];
        const cf  = typeof window !== "undefined" ? localStorage.getItem("CODEFORCES_HANDLE") : null;
        const lc  = typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg = typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;

        const liveResult = await getLivePlatformsDebug({
          codeforces: cf || undefined,
          leetcode: lc || undefined,
          geeksforgeeks: gfg || undefined,
        });
        const live = { ...(liveResult.normalized || {}), _statuses: liveResult.statuses || {} };
        platformsArr = applyLiveData(platformsArr, live);
        setPlatforms(platformsArr);
      } catch (error) {
        console.error("Error loading platforms:", error);
        setPlatforms([]);
      } finally {
        setLoading(false);
      }
    };
    loadPlatforms();
  }, []);

  const aggregatedStats = useMemo(() => {
    const tracked = new Set(["leetcode", "geeksforgeeks"]);
    const totals = platforms.reduce(
      (acc, platform) => {
        const name = String(platform?.name || "").toLowerCase();
        if (!tracked.has(name)) return acc;
        acc.easy   += Number(platform?.easy)   || 0;
        acc.medium += Number(platform?.medium) || 0;
        acc.hard   += Number(platform?.hard)   || 0;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );
    return {
      easy: totals.easy,
      medium: totals.medium,
      hard: totals.hard,
      totalSolved: totals.easy + totals.medium + totals.hard,
    };
  }, [platforms]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 pb-12"
    >
      {/* ── Profile ── */}
      <section>
        <ProfileCard refreshKey={analyticsKey} />
      </section>

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── Connect Platforms ── */}
      <section>
        <PlatformSettings onLiveData={handleLiveData} onRefresh={handleRefreshAnalytics} />
      </section>

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── Coding Platforms ── */}
      <section>
        <SectionHeader
          icon="🏅"
          title="Coding Platforms"
          subtitle="Your live competitive programming statistics"
          gradient="linear-gradient(135deg,#60a5fa,#a78bfa)"
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl shimmer" />
            ))}
          </div>
        ) : platforms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {platforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        ) : (
          <div
            className="glass-card p-10 text-center"
            style={{ borderStyle: "dashed" }}
          >
            <span className="text-4xl mb-4 block">📡</span>
            <p className="font-semibold" style={{ color: "#475569" }}>No platforms found</p>
            <p className="text-sm mt-1" style={{ color: "#334155" }}>Connect your handles above to get started</p>
          </div>
        )}
      </section>

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── Analytics + Deep Insights — ek row mein ── */}
      <section>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

          {/* Left — Analytics / ScoreCard */}
          <div>
            <SectionHeader
              icon="📊"
              title="Analytics"
              subtitle="Aggregated problem-solving breakdown"
              gradient="linear-gradient(135deg,#f472b6,#a78bfa)"
            />
            <ScoreCard aggregatedStats={aggregatedStats} loading={loading} />
          </div>

          {/* Right — Deep Insights */}
          <div>
            <SectionHeader
              icon="🔬"
              title="Deep Insights"
              subtitle="Language usage and algorithm category breakdown"
              gradient="linear-gradient(135deg,#34d399,#22d3ee)"
            />
            <div className="grid grid-cols-1 gap-5">
              <LanguageCard refreshKey={analyticsKey} />
              <AlgorithmCard refreshKey={analyticsKey} />
            </div>
          </div>

        </div>
      </section>
    </motion.div>
  );
}
