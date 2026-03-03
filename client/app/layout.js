export const metadata = {
  title: "Dev Analyzer",
  description: "Unified Coding Profile Analyzer",
};

import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className="bg-gray-950 text-white min-h-screen relative overflow-x-hidden flex flex-col"
      >
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-900/10 to-gray-950" />
          
          {/* Animated Blobs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-0" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        </div>

        <Navbar />
        <main className="flex-1 w-full px-6 pt-8 pb-5 max-w-7xl mx-auto relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}


