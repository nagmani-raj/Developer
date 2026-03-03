"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Developer", href: "/developer" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-950/80 px-4 py-3 shadow-lg shadow-blue-600/10 backdrop-blur-md sm:px-6 sm:py-4"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <div className="text-2xl sm:text-3xl">{"\u26A1"}</div>
            <Link
              href="/"
              className="text-xl font-bold text-transparent transition-all bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-300 hover:to-purple-300 sm:text-2xl"
            >
              DevAnalyzer
            </Link>
          </motion.div>

          <div className="hidden items-center gap-8 sm:flex">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="group relative rounded-md px-4 py-2 text-lg font-semibold text-gray-300 transition-colors hover:text-white"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-700 text-gray-200 transition-colors hover:border-blue-500 hover:text-white sm:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open menu</span>
            <div className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </div>
          </button>
        </div>

        {isMenuOpen ? (
          <div className="mt-3 grid gap-1 rounded-lg border border-gray-800 bg-gray-900/70 p-2 sm:hidden">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </motion.nav>
  );
}
