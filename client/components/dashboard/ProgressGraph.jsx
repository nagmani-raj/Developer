"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getWeeklyProgress } from "@/lib/api";

export default function ProgressGraph() {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setChartReady(true);
    });

    const loadProgress = async () => {
      try {
        const data = await getWeeklyProgress();
        setProgressData(data.days || []);
      } catch (error) {
        console.error("Error loading progress:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();

    return () => cancelAnimationFrame(frame);
  }, []);

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
      className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-cyan-600/50 backdrop-blur-md overflow-hidden relative group"
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative z-10">
        <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          📈 Weekly Progress
        </h3>

        {loading ? (
          <div className="h-80 flex items-center justify-center bg-gray-800/50 rounded-lg">
            <p className="text-gray-400">Loading progress...</p>
          </div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-full h-80 min-h-[320px] min-w-0"
          >
            {chartReady ? (
              <ResponsiveContainer width="100%" height={320} minWidth={0}>
                <LineChart data={progressData}>
                  <defs>
                    <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #06b6d4" }}
                    cursor={{ stroke: "#06b6d4", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="solved"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: "#06b6d4", r: 5 }}
                    activeDot={{ r: 7 }}
                    fillOpacity={1}
                    fill="url(#colorSolved)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Preparing chart...
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
