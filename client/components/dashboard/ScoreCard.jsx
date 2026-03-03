"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const RADIAN = Math.PI / 180;

export default function ScoreCard({ aggregatedStats, loading = false }) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setChartReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (loading) {
    return (
      <motion.div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-purple-600/50 backdrop-blur-md h-64 flex items-center justify-center">
        <p className="text-gray-400">Loading statistics...</p>
      </motion.div>
    );
  }

  if (!aggregatedStats || typeof aggregatedStats !== "object") {
    return (
      <motion.div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-purple-600/50 backdrop-blur-md h-64 flex items-center justify-center">
        <p className="text-red-300">Statistics unavailable. Check backend connection.</p>
      </motion.div>
    );
  }

  const easy = Number(aggregatedStats.easy) || 0;
  const medium = Number(aggregatedStats.medium) || 0;
  const hard = Number(aggregatedStats.hard) || 0;
  const totalSolved = Number(aggregatedStats.totalSolved) || easy + medium + hard || 1;

  const data = [
    { name: "Easy", value: easy, color: "#96dda8", textColor: "#153f23" },
    { name: "Medium", value: medium, color: "#eadf93", textColor: "#6b4f18" },
    { name: "Hard", value: hard, color: "#e7b1b1", textColor: "#7a2626" },
  ];

  const renderInsideLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={payload.textColor}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
      >
        {`-> ${payload.name}`}
      </text>
    );
  };

  const renderPieTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0]?.payload;
    const value = Number(point?.value) || 0;
    const pct = Math.round((value / totalSolved) * 100);
    const tooltipTheme =
      point?.name === "Easy"
        ? {
            background:
              "linear-gradient(135deg, rgba(7, 35, 22, 0.96), rgba(10, 51, 31, 0.94))",
            border: "#34d399",
            text: "#a7f3d0",
          }
        : point?.name === "Medium"
          ? {
              background:
                "linear-gradient(135deg, rgba(43, 33, 10, 0.96), rgba(74, 56, 17, 0.94))",
              border: "#facc15",
              text: "#fde68a",
            }
          : {
              background:
                "linear-gradient(135deg, rgba(49, 15, 15, 0.96), rgba(84, 24, 24, 0.94))",
              border: "#f87171",
              text: "#fecaca",
            };

    return (
      <div
        style={{
          background: tooltipTheme.background,
          border: `1px solid ${tooltipTheme.border}`,
          borderRadius: "12px",
          padding: "10px 12px",
          boxShadow: "0 10px 28px rgba(2, 6, 23, 0.5)",
        }}
      >
        <p style={{ color: tooltipTheme.text, margin: 0, fontWeight: 700 }}>
          {`${point?.name} : ${value} Problems (${pct}%)`}
        </p>
      </div>
    );
  };

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
      className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-purple-600/50 backdrop-blur-md overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/8 via-transparent to-pink-600/8" />

      <div className="relative z-10">
        {/* <h3 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Aggregated Statistics
        </h3> */}

        <div className="flex flex-col lg:flex-row items-center gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-full lg:w-80 h-80 min-h-[320px] min-w-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#222b49] via-[#1f2845] to-[#1a223a] shadow-[0_24px_60px_rgba(8,12,28,0.55)]"
          >
            {chartReady ? (
              <ResponsiveContainer width="100%" height={320} minWidth={0}>
                <PieChart>
                  <defs>
                    <filter id="sliceShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0b1020" floodOpacity="0.28" />
                    </filter>
                  </defs>

                  <Pie
                    data={data}
                    dataKey="value"
                    innerRadius={44}
                    outerRadius={112}
                    paddingAngle={1.5}
                    cornerRadius={3}
                    label={renderInsideLabel}
                    labelLine={false}
                    animationBegin={0}
                    animationDuration={900}
                    stroke="#f4f8f5"
                    strokeWidth={2}
                    filter="url(#sliceShadow)"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <text x="50%" y="48%" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="600">
                    Total Solved
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800">
                    {totalSolved}
                  </text>

                  <Tooltip content={renderPieTooltip} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Preparing chart...
              </div>
            )}
          </motion.div>

          <div className="flex-1 space-y-4">
            <motion.div whileHover={{ scale: 1.02, x: 6 }} className="bg-green-600/20 p-6 rounded-xl border-2 border-green-500/50 transition-colors">
              <p className="text-green-400 text-sm font-semibold mb-2">Easy Problems</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-green-300">{easy}</p>
                <p className="text-lg text-green-400">({Math.round((easy / totalSolved) * 100)}%)</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, x: 6 }} className="bg-yellow-600/20 p-6 rounded-xl border-2 border-yellow-500/50 transition-colors">
              <p className="text-yellow-400 text-sm font-semibold mb-2">Medium Problems</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-yellow-300">{medium}</p>
                <p className="text-lg text-yellow-400">({Math.round((medium / totalSolved) * 100)}%)</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, x: 6 }} className="bg-red-600/20 p-6 rounded-xl border-2 border-red-500/50 transition-colors">
              <p className="text-red-400 text-sm font-semibold mb-2">Hard Problems</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-red-300">{hard}</p>
                <p className="text-lg text-red-400">({Math.round((hard / totalSolved) * 100)}%)</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
