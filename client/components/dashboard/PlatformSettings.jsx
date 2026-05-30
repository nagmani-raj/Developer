"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLivePlatformsDebug } from "@/lib/api";

const PLATFORM_CONFIG = {
  codeforces: {
    label: "Codeforces",
    key: "CODEFORCES_HANDLE",
    placeholder: "e.g. tourist",
    icon: "/codeforces_logo.png",
    emoji: "🔵",
    accentColor: "#3b82f6",
    focusRing: "rgba(59,130,246,0.4)",
    badgeBg: "rgba(59,130,246,0.12)",
    badgeBorder: "rgba(59,130,246,0.3)",
    inputFocus: "rgba(59,130,246,0.6)",
  },
  leetcode: {
    label: "LeetCode",
    key: "LEETCODE_USERNAME",
    placeholder: "e.g. john_doe",
    icon: "/LeetCode_logo.png",
    emoji: "🟠",
    accentColor: "#f97316",
    focusRing: "rgba(249,115,22,0.4)",
    badgeBg: "rgba(249,115,22,0.12)",
    badgeBorder: "rgba(249,115,22,0.3)",
    inputFocus: "rgba(249,115,22,0.6)",
  },
  geeksforgeeks: {
    label: "GeeksforGeeks",
    key: "GEEKSFORGEEKS_USERNAME",
    placeholder: "e.g. rajesh_kumar",
    icon: "/GeeksForGeeks_logo.png",
    emoji: "🟢",
    accentColor: "#10b981",
    focusRing: "rgba(16,185,129,0.4)",
    badgeBg: "rgba(16,185,129,0.12)",
    badgeBorder: "rgba(16,185,129,0.3)",
    inputFocus: "rgba(16,185,129,0.6)",
  },
};

export default function PlatformSettings({ onLiveData, onRefresh }) {
  const [values, setValues] = useState({ codeforces: "", leetcode: "", geeksforgeeks: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      setValues({
        codeforces: localStorage.getItem("CODEFORCES_HANDLE") || "",
        leetcode: localStorage.getItem("LEETCODE_USERNAME") || "",
        geeksforgeeks: localStorage.getItem("GEEKSFORGEEKS_USERNAME") || "",
      });
    } catch (e) {}
  }, []);

  const handleChange = (key, val) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSaveAndFetch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const normalized = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, String(v || "").trim()])
    );
    setValues(normalized);
    try {
      Object.entries(PLATFORM_CONFIG).forEach(([key, cfg]) => {
        localStorage.setItem(cfg.key, normalized[key]);
      });
    } catch {}

    setLoading(true);
    try {
      const liveResult = await getLivePlatformsDebug({
        codeforces: normalized.codeforces || undefined,
        leetcode: normalized.leetcode || undefined,
        geeksforgeeks: normalized.geeksforgeeks || undefined,
      });
      const data = liveResult.normalized || {};
      setResult(liveResult);
      if (onLiveData) {
        onLiveData({ ...data, _statuses: liveResult.statuses || {} });
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }

    if (typeof onRefresh === "function") onRefresh();
  };

  return (
    <div suppressHydrationWarning>
      {/* ── Section Header ── */}
      <div className="section-header mb-6">
        <div
          className="section-header-icon"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          🔗
        </div>
        <div>
          <h2 className="section-header-title gradient-text-blue-purple">
            Connect Platforms
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
            Save your handles to fetch live competitive programming stats
          </p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <form
        suppressHydrationWarning
        onSubmit={handleSaveAndFetch}
        className="glass-card p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
            <div key={key}>
              {/* Platform label with icon */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">{cfg.emoji}</span>
                <label
                  className="text-sm font-semibold"
                  style={{ color: cfg.accentColor }}
                >
                  {cfg.label}
                </label>
                {values[key] && (
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: cfg.badgeBg,
                      border: `1px solid ${cfg.badgeBorder}`,
                      color: cfg.accentColor,
                    }}
                  >
                    Connected
                  </span>
                )}
              </div>

              {/* Input */}
              <div className="relative">
                <input
                  suppressHydrationWarning
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={cfg.placeholder}
                  className="input-premium pr-10"
                  style={{
                    "--focus-color": cfg.inputFocus,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = cfg.inputFocus;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${cfg.focusRing}30`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
                {values[key] && (
                  <button
                    type="button"
                    onClick={() => handleChange(key, "")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "rgba(148,163,184,0.15)", color: "#64748b" }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status + Submit row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4"
          style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}
        >
          {/* Status messages */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#60a5fa" }}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Fetching live data...
              </motion.div>
            )}
            {!loading && result && !result.error && (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#34d399" }}
              >
                <span className="text-base">✅</span>
                Live data synced successfully!
              </motion.div>
            )}
            {!loading && result && result.error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#f87171" }}
              >
                <span className="text-base">❌</span>
                {result.error}
              </motion.div>
            )}
            {!loading && !result && <div className="text-sm" style={{ color: "#334155" }}>Enter your handles and click Update.</div>}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            suppressHydrationWarning
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="btn-primary whitespace-nowrap"
            style={{ minWidth: "140px" }}
          >
            {loading ? (
              <>
                <span
                  className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                />
                Updating...
              </>
            ) : (
              <>
                <span>⟳</span>
                Update Data
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* ── Platform profile links ── */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => {
          const handle = values[key];
          const profileUrl =
            key === "codeforces"
              ? handle ? `https://codeforces.com/profile/${handle}` : null
              : key === "leetcode"
              ? handle ? `https://leetcode.com/u/${handle}/` : null
              : handle ? `https://www.geeksforgeeks.org/user/${handle}/` : null;

          return (
            <motion.div
              key={key}
              whileHover={{ y: -3 }}
              className="glass-card p-4 flex items-center gap-3"
              style={{
                borderColor: handle ? `${cfg.accentColor}25` : "rgba(148,163,184,0.08)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: handle ? cfg.badgeBg : "rgba(15,23,42,0.5)" }}
              >
                {cfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: handle ? cfg.accentColor : "#334155" }}>
                  {cfg.label}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "#475569" }}>
                  {handle || "Not connected"}
                </p>
              </div>
              {profileUrl ? (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{
                    background: cfg.badgeBg,
                    border: `1px solid ${cfg.badgeBorder}`,
                    color: cfg.accentColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  View ↗
                </a>
              ) : (
                <span
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                  style={{ background: "rgba(15,23,42,0.5)", color: "#334155" }}
                >
                  —
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
