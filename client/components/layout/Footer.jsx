"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Globe, Twitter } from "lucide-react";

const SOCIAL_LINKS = [
  {
    icon: <Github size={18} />,
    href: "https://github.com/nagmani-raj",
    label: "GitHub",
    color: "#94a3b8",
    hoverColor: "#f8fafc",
  },
  {
    icon: <Linkedin size={18} />,
    href: "https://www.linkedin.com/in/nagmani-raj/",
    label: "LinkedIn",
    color: "#94a3b8",
    hoverColor: "#60a5fa",
  },
  {
    icon: <Globe size={18} />,
    href: "https://nagmani-raj.vercel.app/",
    label: "Website",
    color: "#94a3b8",
    hoverColor: "#34d399",
  },
  {
    icon: <Twitter size={18} />,
    href: "https://x.com/Nagmaniraj317",
    label: "Twitter / X",
    color: "#94a3b8",
    hoverColor: "#38bdf8",
  },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative mt-8"
    >
      {/* Top divider */}
      <div className="section-divider" />

      <div
        className="px-6 py-6"
        style={{
          background: "rgba(5, 8, 16, 0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left — branding */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                boxShadow: "0 0 12px rgba(59,130,246,0.3)",
              }}
            >
              ⚡
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: "#f8fafc" }}>
                Dev<span className="gradient-text-blue-purple">Analyzer</span>
              </span>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                Unified Coding Profile Analyzer
              </p>
            </div>
          </div>

          {/* Center — credit */}
          <p className="text-xs" style={{ color: "#475569" }}>
            Built with ❤️ by{" "}
            <a
              href="https://nagmani-raj.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold gradient-text-blue-purple hover:opacity-80 transition-opacity"
            >
              Nagmani Raj
            </a>
          </p>

          {/* Right — socials */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((link, i) => (
              <motion.a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{
                  background: "rgba(15,23,42,0.7)",
                  border: "1px solid rgba(148,163,184,0.12)",
                  color: link.color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = link.hoverColor;
                  e.currentTarget.style.borderColor = link.hoverColor + "40";
                  e.currentTarget.style.background = link.hoverColor + "15";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = link.color;
                  e.currentTarget.style.borderColor = "rgba(148,163,184,0.12)";
                  e.currentTarget.style.background = "rgba(15,23,42,0.7)";
                }}
              >
                {link.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
