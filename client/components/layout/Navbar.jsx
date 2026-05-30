"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { name: "Home",      href: "/",          icon: "⚡" },
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Developer", href: "/developer", icon: "🐙" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveHref(window.location.pathname);
    }
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50"
    >
      {/* Nav Container */}
      <div
        className="mx-4 sm:mx-6 mt-3 rounded-2xl overflow-hidden"
        style={{
          background: scrolled
            ? "rgba(8, 12, 24, 0.92)"
            : "rgba(8, 12, 24, 0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(148,163,184,0.1)",
          boxShadow: scrolled
            ? "0 4px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.08)"
            : "0 2px 20px rgba(0,0,0,0.3)",
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      >
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                boxShadow: "0 0 16px rgba(59,130,246,0.4)",
              }}
            >
              ⚡
            </div>
            <Link href="/" className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span style={{ color: "#f8fafc" }}>Dev</span>
              <span className="gradient-text-blue-purple">Analyzer</span>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item, i) => {
              const isActive = activeHref === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 + 0.2 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setActiveHref(item.href)}
                    className="relative px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all duration-200"
                    style={{
                      color: isActive ? "#fff" : "rgba(148,163,184,0.85)",
                      background: isActive
                        ? "rgba(59,130,246,0.15)"
                        : "transparent",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: "rgba(59,130,246,0.12)",
                          border: "1px solid rgba(59,130,246,0.25)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                    {isActive && (
                      <span
                        className="relative z-10 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#3b82f6" }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>



          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((p) => !p)}
            className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg"
            style={{ border: "1px solid rgba(148,163,184,0.12)" }}
            aria-label="Toggle menu"
          >
            <motion.span
              animate={isMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block w-5 h-0.5 origin-center"
              style={{ background: "#94a3b8" }}
            />
            <motion.span
              animate={isMenuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              className="block w-5 h-0.5"
              style={{ background: "#94a3b8" }}
            />
            <motion.span
              animate={isMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block w-5 h-0.5 origin-center"
              style={{ background: "#94a3b8" }}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden sm:hidden"
              style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}
            >
              <div className="px-3 py-3 space-y-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => { setIsMenuOpen(false); setActiveHref(item.href); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                      style={{
                        color: activeHref === item.href ? "#fff" : "#94a3b8",
                        background: activeHref === item.href
                          ? "rgba(59,130,246,0.12)"
                          : "transparent",
                      }}
                    >
                      <span>{item.icon}</span>
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
