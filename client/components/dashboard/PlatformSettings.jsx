"use client";

import { useState, useEffect } from "react";
import { getLivePlatformsDebug } from "@/lib/api";

export default function PlatformSettings({ onLiveData, onRefresh }) {
  const [codeforces, setCodeforces] = useState("");
  const [leetcode, setLeetCode] = useState("");
  const [geeksforgeeks, setGeeksforGeeks] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const cf = localStorage.getItem("CODEFORCES_HANDLE") || "";
      const lc = localStorage.getItem("LEETCODE_USERNAME") || "";
      const gfg = localStorage.getItem("GEEKSFORGEEKS_USERNAME") || "";
      setCodeforces(cf);
      setLeetCode(lc);
      setGeeksforGeeks(gfg);
    } catch (e) {}
  }, []);

  const fetchLive = async (opts) => {
    setLoading(true);
    try {
      const liveResult = await getLivePlatformsDebug(opts);
      const data = liveResult.normalized || {};
      setResult(liveResult);

      if (onLiveData) {
        onLiveData({
          ...data,
          _statuses: liveResult.statuses || {},
        });
      }
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndFetch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const normalizedCodeforces = String(codeforces || "").trim();
    const normalizedLeetcode = String(leetcode || "").trim();
    const normalizedGeeksforGeeks = String(geeksforgeeks || "").trim();

    setCodeforces(normalizedCodeforces);
    setLeetCode(normalizedLeetcode);
    setGeeksforGeeks(normalizedGeeksforGeeks);

    try {
      localStorage.setItem("CODEFORCES_HANDLE", normalizedCodeforces);
      localStorage.setItem("LEETCODE_USERNAME", normalizedLeetcode);
      localStorage.setItem("GEEKSFORGEEKS_USERNAME", normalizedGeeksforGeeks);
    } catch (err) {}

    await fetchLive({
      codeforces: normalizedCodeforces || undefined,
      leetcode: normalizedLeetcode || undefined,
      geeksforgeeks: normalizedGeeksforGeeks || undefined,
    });

    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  const platformConfigs = [
    {
      title: "Codeforces",
      value: codeforces,
      url: codeforces ? `https://codeforces.com/profile/${codeforces}` : null,
      buttonClass:
        "bg-blue-600/20 p-6 rounded-xl border-2 border-blue-600/50 transition-colors",
    },
    {
      title: "LeetCode",
      value: leetcode,
      url: leetcode ? `https://leetcode.com/u/${leetcode}/` : null,
      buttonClass:
        "bg-yellow-600/20 p-6 rounded-xl border-2 border-yellow-500/50 transition-colors",
    },
    {
      title: "GeeksforGeeks",
      value: geeksforgeeks,
      url: geeksforgeeks
        ? `https://www.geeksforgeeks.org/profile/${geeksforgeeks}?tab=activity`
        : null,
      buttonClass:
        "bg-green-600/20 p-6 rounded-xl border-2 border-green-500/50 transition-colors",
    },
  ];

  return (
    <div className="mb-16" suppressHydrationWarning>

      {/* Top Gradient Banner */}
      <div
        suppressHydrationWarning
        role="button"
        tabIndex={0}
        onClick={handleSaveAndFetch}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && handleSaveAndFetch()
        }
        className="cursor-pointer relative p-8 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-2xl hover:scale-[1.02] transition-all duration-300 mb-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-4xl font-bold text-white tracking-wide">
            🚀 Connect Your Coding Platforms
          </h3>
          <p className="text-gray-200 mt-3 text-sm">
            Save handles & fetch live competitive programming stats instantly
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        suppressHydrationWarning
        onSubmit={handleSaveAndFetch}
        className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-8 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {/* Codeforces */}
        <div>
          <label className="text-sm text-gray-400 font-medium">
            Codeforces Handle
          </label>
          <input
            suppressHydrationWarning
            value={codeforces}
            onChange={(e) => setCodeforces(e.target.value)}
            placeholder="e.g. tourist"
            className="mt-3 w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
          />
        </div>

        {/* LeetCode */}
        <div>
          <label className="text-sm text-gray-400 font-medium">
            LeetCode Username
          </label>
          <input
            suppressHydrationWarning
            value={leetcode}
            onChange={(e) => setLeetCode(e.target.value)}
            placeholder="e.g. leetcode_user"
            className="mt-3 w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
          />
        </div>

        {/* GFG */}
        <div>
          <label className="text-sm text-gray-400 font-medium">
            GeeksforGeeks Username
          </label>
          <input
            suppressHydrationWarning
            value={geeksforgeeks}
            onChange={(e) => setGeeksforGeeks(e.target.value)}
            placeholder="e.g. rajesh123"
            className="mt-3 w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          />
        </div>

        {/* Status + Button */}
        <div className="lg:col-span-3 flex flex-col gap-6 mt-6">

          <div className="self-start">
            {loading && (
              <p className="text-blue-400 text-sm animate-pulse">
                Fetching live data...
              </p>
            )}
            {!loading && result && !result.error && (
              <p className="text-green-400 text-sm">
                ✔ Live data synced successfully!
              </p>
            )}
            {!loading && result && result.error && (
              <p className="text-red-400 text-sm">{result.error}</p>
            )}
          </div>

          <button
            suppressHydrationWarning
            type="submit"
            disabled={loading}
            className={`self-center bg-red-600/20 p-6 rounded-xl border-2 border-red-500/50 transition-colors${
              loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 hover:shadow-cyan-500/35 hover:shadow-xl"
            }`}
          >
            {loading ? "Updating..." : "Update Data"}
          </button>
        </div>
      </form>

      {/* Platform Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {platformConfigs.map((platform) => (
          <div
            key={platform.title}
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
          >
            <h4 className="text-2xl font-bold text-white">
              {platform.title}
            </h4>
            <p className="text-gray-400 mt-3">
              {platform.value || "Not set"}
            </p>

            <a
              href={platform.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 inline-block w-full text-center py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                platform.url
                  ? `${platform.buttonClass} shadow-lg hover:scale-[1.03]`
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
              {...(platform.url ? {} : { "aria-disabled": "true" })}
            >
              {platform.url ? "View Profile" : "Save handle to enable"}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
