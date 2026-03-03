"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getAlgorithms } from "@/lib/api";

// refreshKey works same as in LanguageCard
export default function AlgorithmCard({ refreshKey }) {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlgorithms = async () => {
      setLoading(true);
      try {
        const lc = typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg = typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;
        const data = await getAlgorithms({ leetcode: lc || undefined, geeksforgeeks: gfg || undefined });
        setAlgorithms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading algorithms:", error);
        setAlgorithms([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlgorithms();
  }, [refreshKey]);

  const totalProblems = useMemo(
    () => algorithms.reduce((sum, algo) => sum + (algo.count || 0), 0),
    [algorithms]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border-2 border-fuchsia-600/40"
    >
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-fuchsia-300 mb-5">
        Algorithm Categories
      </h3>

      {loading ? (
        <p className="text-gray-400">Loading categories...</p>
      ) : algorithms.length === 0 ? (
        <p className="text-gray-400">No algorithm data available</p>
      ) : (
        <div className="space-y-3">
          {algorithms.map((algo) => {
            const percent = totalProblems ? Math.round((algo.count / totalProblems) * 100) : 0;
            return (
              <div key={algo.category} className="flex items-center justify-between bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
                <span className="text-gray-200">{algo.category}</span>
                <span className="text-pink-300 font-semibold">
                  {algo.count} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

