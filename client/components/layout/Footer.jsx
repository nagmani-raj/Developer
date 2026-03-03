"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Globe, Twitter } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    {
      icon: <Github size={22} />,
      href: "https://github.com/nagmani-raj",
    },
    {
      icon: <Linkedin size={22} />,
      href: "https://www.linkedin.com/in/nagmani-raj/",
    },
    {
      icon: <Globe size={22} />,
      href: "https://nagmani-raj.vercel.app/",
    },
    {
      icon: <Twitter size={22} />,
      href: "https://x.com/Nagmaniraj317",
    },
  ];

  return (
    <motion.footer
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className=" bg-gray-950/80 backdrop-blur-md border-t border-gray-800/50 px-6 pt-6 shadow-lg shadow-blue-600/10"
>
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-3">
        <h2 className="mt-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wide">Contact Me</h2>

        <div className="flex items-center gap-6">
          {socialLinks.map((item, index) => (
            <motion.a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-purple-500 transition-all duration-300 shadow-md hover:shadow-purple-500/40"
            >
              {item.icon}
            </motion.a>
          ))}
        </div>

        <div className="w-24 h-[2px] bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />

        <p className="text-gray-400 text-sm text-center">
          ❤️ Developed by{" "}
          <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Nagmani Raj
          </span>
        </p>
      </div>
    </motion.footer>
  );
}




