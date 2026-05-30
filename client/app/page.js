"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "📊",
    title: "Aggregated Stats",
    desc: "All your coding stats unified in a single, beautiful dashboard.",
    color: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)",
    glow: "rgba(59,130,246,0.1)",
  },
  {
    icon: "🎯",
    title: "Performance Rating",
    desc: "Get a personalized developer score and achievement badges.",
    color: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.25)",
    glow: "rgba(139,92,246,0.1)",
  },
  {
    icon: "📈",
    title: "Track Progress",
    desc: "Monitor your weekly growth and problem-solving journey.",
    color: "rgba(6,182,212,0.12)",
    border: "rgba(6,182,212,0.25)",
    glow: "rgba(6,182,212,0.1)",
  },
];

const PLATFORMS = [
  { name: "LeetCode",      color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { name: "GeeksforGeeks", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { name: "Codeforces",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { name: "GitHub",        color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center"
    >
      {/* ── Hero ── */}
      <section className="w-full flex flex-col items-center text-center pt-12 pb-16 px-4">

        {/* Eyebrow badge */}
        <motion.div variants={itemVariants}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#93c5fd",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full pulse-dot"
              style={{ background: "#3b82f6" }}
            />
            Unified Competitive Programming Dashboard
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={itemVariants}
          className="max-w-4xl font-black leading-[1.08] tracking-tight mb-6"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #f8fafc 30%, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Track Every Line of Code{" "}
          </span>
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Across All Platforms
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="max-w-2xl text-base sm:text-lg leading-relaxed mb-8"
          style={{ color: "#64748b" }}
        >
          Connect{" "}
          {PLATFORMS.map((p, i) => (
            <span key={p.name}>
              <span
                className="font-semibold px-1.5 py-0.5 rounded-md text-sm"
                style={{ color: p.color, background: p.bg }}
              >
                {p.name}
              </span>
              {i < PLATFORMS.length - 1 ? " " : ""}
            </span>
          ))}{" "}
          and get powerful analytics to supercharge your competitive programming journey.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/dashboard"
              id="goto-dashboard"
              className="btn-primary text-base px-8 py-3"
              style={{ borderRadius: "14px", fontSize: "0.95rem" }}
            >
              Open Dashboard
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/developer"
              id="goto-developer"
              className="btn-ghost text-base px-8 py-3"
              style={{ borderRadius: "14px", fontSize: "0.95rem" }}
            >
              GitHub Explorer
              <span>🐙</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-2xl flex items-center justify-center gap-8 sm:gap-12 mb-16 py-5 px-8 rounded-2xl"
          style={{
            background: "rgba(15,23,42,0.5)",
            border: "1px solid rgba(148,163,184,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {[
            { val: "3+",  label: "Platforms" },
            { val: "∞",   label: "Stats Tracked" },
            { val: "100%", label: "Free" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black gradient-text-blue-purple">{s.val}</p>
              <p className="text-xs mt-1" style={{ color: "#475569" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="w-full max-w-5xl px-4 pb-20">
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: "#f8fafc" }}
          >
            Everything you need to level up
          </h2>
          <p style={{ color: "#475569" }} className="text-sm">
            One platform. All your competitive programming metrics.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="relative p-6 rounded-2xl overflow-hidden"
              style={{
                background: f.color,
                border: `1px solid ${f.border}`,
                boxShadow: `0 0 40px ${f.glow}`,
              }}
            >
              {/* Noise texture */}
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 80% 20%, ${f.border} 0%, transparent 60%)`,
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#f1f5f9" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </motion.div>
  );
}
