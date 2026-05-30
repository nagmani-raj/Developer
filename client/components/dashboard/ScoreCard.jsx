"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const RADIAN = Math.PI / 180;

const DIFFICULTY_DATA_TEMPLATE = [
  { name: "Easy",   color: "#10b981", textColor: "#064e3b", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.25)" },
  { name: "Medium", color: "#f59e0b", textColor: "#78350f", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)", glow: "rgba(245,158,11,0.25)" },
  { name: "Hard",   color: "#ef4444", textColor: "#7f1d1d", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",  glow: "rgba(239,68,68,0.25)"  },
];

function LoadingSkeleton() {
  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 h-64 rounded-2xl shimmer" />
        <div className="flex-1 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
      </div>
    </div>
  );
}

const renderInsideLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
  if (payload.value === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={payload.textColor} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {payload.name}
    </text>
  );
};

const renderPieTooltip = ({ active, payload }, totalSolved) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const value = Number(point?.value) || 0;
  const pct = Math.round((value / totalSolved) * 100);
  return (
    <div
      style={{
        background: "rgba(10,14,26,0.96)",
        border: `1px solid ${point?.color}50`,
        borderRadius: "10px",
        padding: "8px 12px",
        boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
      }}
    >
      <p style={{ color: point?.color, fontWeight: 700, fontSize: "0.8rem", margin: 0 }}>
        {point?.name}: {value} ({pct}%)
      </p>
    </div>
  );
};

export default function ScoreCard({ aggregatedStats, loading = false }) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setChartReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (!aggregatedStats || typeof aggregatedStats !== "object") {
    return (
      <div className="glass-card p-6 flex items-center gap-3" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
        <span className="text-2xl">⚠️</span>
        <p className="text-sm" style={{ color: "#fca5a5" }}>Statistics unavailable. Check backend connection.</p>
      </div>
    );
  }

  const easy       = Number(aggregatedStats.easy) || 0;
  const medium     = Number(aggregatedStats.medium) || 0;
  const hard       = Number(aggregatedStats.hard) || 0;
  const totalSolved = Number(aggregatedStats.totalSolved) || easy + medium + hard || 1;

  const data = DIFFICULTY_DATA_TEMPLATE.map((d, i) => ({
    ...d,
    value: [easy, medium, hard][i],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6 sm:p-8 relative overflow-hidden"
    >
      {/* Section header */}
      <div className="section-header mb-6">
        <div
          className="section-header-icon"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          🥧
        </div>
        <h3 className="section-header-title gradient-text-pink-purple">
          Problem Breakdown
        </h3>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Pie chart */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="w-full lg:w-72 h-64 flex-shrink-0 rounded-2xl flex items-center justify-center relative"
          style={{
            background: "rgba(10,14,26,0.6)",
            border: "1px solid rgba(148,163,184,0.08)",
          }}
        >
          {chartReady ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <defs>
                  <filter id="sliceShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
                  </filter>
                </defs>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={52}
                  outerRadius={100}
                  paddingAngle={2}
                  cornerRadius={4}
                  label={renderInsideLabel}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={900}
                  stroke="transparent"
                  filter="url(#sliceShadow)"
                >
                  {data.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <text x="50%" y="47%" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">Total</text>
                <text x="50%" y="57%" textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800">{totalSolved}</text>
                <Tooltip content={(props) => renderPieTooltip(props, totalSolved)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "#334155" }}>
              Preparing chart...
            </div>
          )}
        </motion.div>

        {/* Difficulty stats — one row */}
        <div className="w-full grid grid-cols-3 gap-4">
          {data.map((d, i) => {
            const pct = Math.round((d.value / totalSolved) * 100);
            return (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-4 rounded-xl relative overflow-hidden"
                style={{ background: d.bg, border: `1px solid ${d.border}` }}
              >
                {/* BG accent */}
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-5xl font-black opacity-5 select-none"
                  style={{ color: d.color }}
                >
                  {d.name[0]}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold" style={{ color: d.color }}>{d.name} Problems</p>
                    <p className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${d.color}20`, color: d.color }}>
                      {pct}%
                    </p>
                  </div>
                  <div className="flex items-end gap-3">
                    <p className="text-3xl font-black" style={{ color: d.color }}>{d.value}</p>
                    <div className="flex-1 mb-1.5">
                      <div className="progress-bar">
                        <motion.div
                          className="progress-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1 + 0.4, duration: 0.8, ease: "easeOut" }}
                          style={{ background: `linear-gradient(90deg, ${d.color}60, ${d.color})` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
