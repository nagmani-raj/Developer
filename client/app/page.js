"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[80vh] text-center pb-[29px]"
    >
      {/* Title */}
      <motion.h1
        variants={itemVariants}
        className="text-6xl md:text-7xl font-bold mb-6 max-w-4xl leading-tight"
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          Unified Coding Profile
        </span>
        <br />
        <span className="text-white">Analyzer</span>
        <br />
        <span className="text-5xl">🚀</span>
      </motion.h1>

      {/* Description */}
      <motion.p
        variants={itemVariants}
        className="text-xl text-gray-300 max-w-3xl mb-8 leading-relaxed"
      >
        Connect all your coding platforms like <span className="text-orange-400 font-semibold">LeetCode</span>, 
        <span className="text-green-400 font-semibold"> GeeksforGeeks</span>, 
        <span className="text-blue-400 font-semibold"> Codeforces</span> in one place. 
        Get powerful analytics and track your problem-solving journey across all platforms simultaneously.
      </motion.p>

      {/* Features Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-3xl"
      >
        {[
          { icon: "📊", title: "Aggregated Stats", desc: "See all your stats in one dashboard" },
          { icon: "🎯", title: "Performance Rate", desc: "Get personalized rating & badges" },
          { icon: "📈", title: "Track Progress", desc: "Monitor your weekly improvement" },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-md hover:border-blue-500/50 transition-colors"
          >
            <p className="text-4xl mb-3">{feature.icon}</p>
            <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Button */}
      <motion.div
        variants={itemVariants}
        className="flex gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70"
          >
            Go to Dashboard →
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            className="border-2 border-blue-600 hover:border-purple-600 text-blue-400 hover:text-purple-400 px-10 py-4 rounded-xl text-lg font-bold transition-all hover:bg-purple-600/10"
          >
            Learn More ↓
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
