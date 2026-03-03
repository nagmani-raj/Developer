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
      className="flex min-h-[80vh] flex-col items-center justify-center pb-[29px] text-center"
    >
      <motion.h1
        variants={itemVariants}
        className="mb-6 max-w-4xl text-5xl font-bold leading-tight sm:text-6xl md:text-7xl"
      >
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Unified Coding Profile
        </span>
        <br />
        <span className="text-white">Analyzer</span>
        <br />
        <span className="text-4xl sm:text-5xl">{"\uD83D\uDE80"}</span>
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="mb-8 max-w-3xl px-1 text-lg leading-relaxed text-gray-300 sm:text-xl"
      >
        Connect all your coding platforms like <span className="font-semibold text-orange-400">LeetCode</span>,
        <span className="font-semibold text-green-400"> GeeksforGeeks</span>,
        <span className="font-semibold text-blue-400"> Codeforces</span> in one place.
        Get powerful analytics and track your problem-solving journey across all platforms simultaneously.
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="mb-12 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3"
      >
        {[
          {
            icon: "\uD83D\uDCCA",
            title: "Aggregated Stats",
            desc: "See all your stats in one dashboard",
          },
          {
            icon: "\uD83C\uDFAF",
            title: "Performance Rate",
            desc: "Get personalized rating & badges",
          },
          {
            icon: "\uD83D\uDCC8",
            title: "Track Progress",
            desc: "Monitor your weekly improvement",
          },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05, y: -5 }}
            className="rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-md transition-colors hover:border-blue-500/50"
          >
            <p className="mb-3 text-4xl">{feature.icon}</p>
            <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto"
        >
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-bold transition-all hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 sm:w-auto sm:px-10 sm:text-lg"
          >
            Go to Dashboard -&gt;
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto"
        >
          <button
            className="w-full rounded-xl border-2 border-blue-600 px-8 py-4 text-base font-bold text-blue-400 transition-all hover:border-purple-600 hover:bg-purple-600/10 hover:text-purple-400 sm:w-auto sm:px-10 sm:text-lg"
          >
            Learn More v
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
