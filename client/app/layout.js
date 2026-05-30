export const metadata = {
  title: "DevAnalyzer — Unified Coding Profile Analyzer",
  description:
    "Aggregate LeetCode, GeeksforGeeks, Codeforces & GitHub stats in one beautiful dashboard.",
};

import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="min-h-screen relative overflow-x-hidden flex flex-col">
        
        {/* ── Animated Background Canvas ── */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Deep base */}
          <div className="absolute inset-0" style={{ background: "var(--bg-base)" }} />
          
          {/* Primary gradient overlay */}
          <div className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(59,130,246,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(139,92,246,0.1) 0%, transparent 55%)",
            }}
          />

          {/* Blobs */}
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full animate-blob animation-delay-0"
            style={{ background: "rgba(59,130,246,0.07)", filter: "blur(80px)" }}
          />
          <div
            className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full animate-blob animation-delay-2000"
            style={{ background: "rgba(139,92,246,0.07)", filter: "blur(80px)" }}
          />
          <div
            className="absolute -bottom-20 left-1/3 w-[450px] h-[450px] rounded-full animate-blob animation-delay-4000"
            style={{ background: "rgba(6,182,212,0.06)", filter: "blur(80px)" }}
          />

          {/* Grid */}
          <div className="absolute inset-0 bg-grid-pattern" />
        </div>

        <Navbar />
        <main className="flex-1 w-full px-4 sm:px-6 pt-6 pb-8 max-w-7xl mx-auto relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
