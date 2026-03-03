"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getLanguages } from "@/lib/api";

// props:
//   refreshKey - increment whenever the stored handles change so component refetches
export default function LanguageCard({ refreshKey }) {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguages = async () => {
      setLoading(true);
      try {
        // read stored usernames from localStorage (fallback to empty)
        const lc = typeof window !== "undefined" ? localStorage.getItem("LEETCODE_USERNAME") : null;
        const gfg = typeof window !== "undefined" ? localStorage.getItem("GEEKSFORGEEKS_USERNAME") : null;
        const data = await getLanguages({ leetcode: lc || undefined, geeksforgeeks: gfg || undefined });
        setLanguages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading languages:", error);
        setLanguages([]);
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, [refreshKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border-2 border-emerald-600/40"
    >
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 mb-5">
        Language Usage
      </h3>

      {loading ? (
        <p className="text-gray-400">Loading languages...</p>
      ) : languages.length === 0 ? (
        <p className="text-gray-400">No language data available</p>
      ) : (
        <div className="space-y-3">
          {languages.map((lang) => (
            <div key={lang.language}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-200 font-medium">{lang.language}</span>
                <span className="text-cyan-300">{lang.problems} problems</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  style={{ width: `${Math.max(0, Math.min(100, lang.percentage || 0))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
