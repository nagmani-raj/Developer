"use client";

import { useState, useEffect, useMemo } from "react";
import ProfileCard from "@/components/dashboard/ProfileCard";
import ScoreCard from "@/components/dashboard/ScoreCard";
import ProgressGraph from "@/components/dashboard/ProgressGraph";
import PlatformCard from "@/components/dashboard/PlatformCard";
import PlatformSettings from "@/components/dashboard/PlatformSettings";
import LanguageCard from "@/components/dashboard/LanguageCard";
import AlgorithmCard from "@/components/dashboard/AlgorithmCard";
import { getLivePlatformsDebug, getPlatforms } from "@/lib/api";

export default function Dashboard() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  // simple counter to force the analytics cards to re-fetch when handles change
  const [analyticsKey, setAnalyticsKey] = useState(0);

  const applyLiveData = (currentPlatforms, live) => {
    if (!live || typeof live !== "object") return currentPlatforms;
    const statuses = live._statuses || {};
    const isMissingIdentityError = (status) => {
      const msg = String(status?.error || "").toLowerCase();
      return (
        msg.includes("username not provided") ||
        msg.includes("handle not provided")
      );
    };

    return currentPlatforms.map((p) => {
      const name = (p.name || "").toLowerCase();
      const updated = { ...p };

      if (name === "leetcode" && live.leetcode) {
        const lc = live.leetcode;
        updated.easy = lc.easy ?? p.easy;
        updated.medium = lc.medium ?? p.medium;
        updated.hard = lc.hard ?? p.hard;
        updated.total = lc.totalSolved ?? p.total;
        updated.rating = lc.contestRating ?? p.rating;
        updated.rank = lc.contestGlobalRanking ?? p.rank;
      }
      if (
        name === "leetcode" &&
        statuses.leetcode &&
        !statuses.leetcode.ok &&
        !isMissingIdentityError(statuses.leetcode)
      ) {
        // Keep existing values on transient API failures.
      }

      if (name === "codeforces" && live.codeforces) {
        const cf = live.codeforces;
        updated.easy = null;
        updated.medium = null;
        updated.hard = null;
        updated.total = cf.totalSolved ?? p.total;
        updated.rating = cf.rating ?? p.rating;
        updated.rank = cf.rank ?? p.rank;
      }
      if (
        name === "codeforces" &&
        statuses.codeforces &&
        !statuses.codeforces.ok &&
        !isMissingIdentityError(statuses.codeforces)
      ) {
        // Keep existing values on transient API failures.
      }

      if (name === "geeksforgeeks" && live.geeksforgeeks) {
        const gfg = live.geeksforgeeks;
        updated.easy = gfg.easy ?? p.easy;
        updated.medium = gfg.medium ?? p.medium;
        updated.hard = gfg.hard ?? p.hard;
        updated.total = gfg.totalSolved ?? gfg.total ?? gfg.score ?? p.total;
        updated.rating = gfg.codingScore ?? gfg.score ?? p.rating;
        updated.rank = gfg.rank ?? p.rank;
      }
      if (
        name === "geeksforgeeks" &&
        statuses.geeksforgeeks &&
        !statuses.geeksforgeeks.ok &&
        !isMissingIdentityError(statuses.geeksforgeeks)
      ) {
        // Keep existing values on transient API failures.
      }

      return updated;
    });
  };

  const handleLiveData = (live) => {
    setPlatforms((prev) => applyLiveData(prev, live));
  };

  const handleRefreshAnalytics = () => {
    setAnalyticsKey((k) => k + 1);
  };

  useEffect(() => {
    const loadPlatforms = async () => {
      setLoading(true);
      try {
        const base = await getPlatforms();
        let platformsArr = Array.isArray(base) ? base : [];

        const cf = typeof window !== "undefined" ? localStorage.getItem("CODEFORCES_HANDLE") : null;
        const lc = typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg = typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;

        const liveResult = await getLivePlatformsDebug({
          codeforces: cf || undefined,
          leetcode: lc || undefined,
          geeksforgeeks: gfg || undefined,
        });
        const live = {
          ...(liveResult.normalized || {}),
          _statuses: liveResult.statuses || {},
        };

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

        acc.easy += Number(platform?.easy) || 0;
        acc.medium += Number(platform?.medium) || 0;
        acc.hard += Number(platform?.hard) || 0;
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
    <div className="space-y-12 pb-12">
      <section>
        <ProfileCard />
      </section>

      <section>
        <PlatformSettings onLiveData={handleLiveData} onRefresh={handleRefreshAnalytics} />
      </section>

      <section>
        <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          Coding Platforms
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-400 col-span-full">Loading platforms...</p>
          ) : platforms.length > 0 ? (
            platforms.map((platform) => <PlatformCard key={platform.id} platform={platform} />)
          ) : (
            <p className="text-gray-400 col-span-full">No platforms available</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
          Analytics Dashboard
        </h2>

        <div className="space-y-8">
          <ScoreCard aggregatedStats={aggregatedStats} loading={loading} />
          <ProgressGraph />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LanguageCard refreshKey={analyticsKey} />
        <AlgorithmCard refreshKey={analyticsKey} />
      </section>
    </div>
  );
}
