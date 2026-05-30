"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LAST_GITHUB_USERNAME_KEY = "LAST_GITHUB_USERNAME";

// ── Stat Card ──
function StatCard({ label, value, icon }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="glass-card p-4 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-medium" style={{ color: "#475569" }}>{label}</p>
      </div>
      <p className="text-2xl font-black" style={{ color: "#f8fafc" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </motion.div>
  );
}

// ── Repo Card ──
function RepoCard({ repo }) {
  const LANG_COLORS = {
    JavaScript: "#f7df1e", TypeScript: "#3178c6", Python: "#3572A5",
    Java: "#f89820", "C++": "#00599C", C: "#555555", Go: "#00ADD8",
    Rust: "#dea584", HTML: "#e34c26", CSS: "#264de4", Shell: "#89e051",
    Ruby: "#701516", Swift: "#fa7343", Kotlin: "#A97BFF",
  };
  const langColor = repo.language ? LANG_COLORS[repo.language] || "#94a3b8" : "#475569";

  return (
    <motion.a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="block glass-card p-4 relative overflow-hidden group"
      style={{ textDecoration: "none" }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${langColor}, transparent)` }}
      />

      <p className="font-bold text-sm mb-1.5 truncate" style={{ color: "#60a5fa" }}>
        {repo.name}
      </p>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: "#475569", lineHeight: "1.5" }}>
        {repo.description || "No description"}
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        {repo.language && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: langColor, boxShadow: `0 0 6px ${langColor}` }}
            />
            <span className="text-xs" style={{ color: "#64748b" }}>{repo.language}</span>
          </div>
        )}
        {repo.stargazers_count > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
            ⭐ {repo.stargazers_count}
          </span>
        )}
        {repo.forks_count > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
            🍴 {repo.forks_count}
          </span>
        )}
      </div>
    </motion.a>
  );
}

export default function DeveloperPage() {
  const [usernameInput, setUsernameInput] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const [showSearchForm, setShowSearchForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);

  const fetchUserData = async (rawUsername) => {
    const cleaned = String(rawUsername || "").trim().replace(/^@/, "");
    if (!cleaned) return;
    setLoading(true);
    setError("");
    setProfile(null);
    setRepos([]);
    try {
      const [profileRes, repoRes] = await Promise.all([
        fetch(`https://api.github.com/users/${cleaned}`),
        fetch(`https://api.github.com/users/${cleaned}/repos?sort=updated&per_page=100`),
      ]);
      if (!profileRes.ok) throw new Error("GitHub user not found.");
      const profileData = await profileRes.json();
      const repoData = repoRes.ok ? await repoRes.json() : [];
      const safeRepos = Array.isArray(repoData) ? repoData : [];
      safeRepos.sort((a, b) =>
        (b.stargazers_count || 0) + (b.forks_count || 0) -
        ((a.stargazers_count || 0) + (a.forks_count || 0))
      );
      try { localStorage.setItem(LAST_GITHUB_USERNAME_KEY, cleaned); } catch {}
      setActiveUsername(cleaned);
      setUsernameInput(cleaned);
      setProfile(profileData);
      setRepos(safeRepos);
      setShowSearchForm(false);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to fetch GitHub data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_GITHUB_USERNAME_KEY) || "";
      if (!saved) return;
      setUsernameInput(saved);
      fetchUserData(saved);
    } catch {}
  }, []);

  const handleFetch = async (e) => {
    e.preventDefault();
    await fetchUserData(usernameInput);
  };

  const totalStars = useMemo(() => repos.reduce((a, r) => a + (r.stargazers_count || 0), 0), [repos]);
  const totalForks = useMemo(() => repos.reduce((a, r) => a + (r.forks_count || 0), 0), [repos]);
  const topRepos   = useMemo(() => repos.slice(0, 6), [repos]);

  // Language breakdown
  const langBreakdown = useMemo(() => {
    const counts = {};
    repos.forEach((r) => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [repos]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      {/* ── Page Header ── */}
      <div>
        <div className="section-header mb-1">
          <div
            className="section-header-icon"
            style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.15)" }}
          >
            🐙
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg,#f8fafc 40%,#94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            GitHub Explorer
          </h1>
        </div>
        <p className="text-sm" style={{ color: "#475569", paddingLeft: "52px" }}>
          Explore any GitHub developer's profile, repositories, and contribution activity.
        </p>
      </div>

      {/* ── Search or profile switch ── */}
      {!showSearchForm && profile ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setShowSearchForm(true);
              setError("");
              setUsernameInput("");
              setProfile(null);
              setRepos([]);
              setActiveUsername("");
            }}
            className="btn-ghost text-sm"
          >
            ← Search Another
          </button>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.1)", color: "#64748b" }}
          >
            Viewing: <span className="font-semibold ml-1" style={{ color: "#f8fafc" }}>@{activeUsername}</span>
          </div>
        </div>
      ) : null}

      {/* ── Search Form ── */}
      <AnimatePresence>
        {showSearchForm && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <form
              onSubmit={handleFetch}
              className="w-full max-w-md glass-card p-8"
            >
              <div className="text-center mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                  style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.15)" }}
                >
                  🐙
                </div>
                <h2 className="text-lg font-bold" style={{ color: "#f8fafc" }}>Search GitHub User</h2>
                <p className="text-xs mt-1" style={{ color: "#475569" }}>
                  Enter a GitHub username to explore their profile
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: "#475569" }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    id="github-username-input"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="nagmani-raj"
                    className="input-premium pl-7"
                    autoComplete="off"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !usernameInput.trim()}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  className="btn-primary w-full justify-center py-2.5"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Explore Profile
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <span className="text-xl">❌</span>
          <p className="text-sm font-medium" style={{ color: "#fca5a5" }}>{error}</p>
        </motion.div>
      )}

      {/* ── Profile & Stats ── */}
      {profile && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Profile card + stat grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Profile info */}
            <div className="glass-card p-6 lg:col-span-1">
              <div className="flex items-start gap-4 mb-5">
                <img
                  src={profile.avatar_url}
                  alt={`${profile.login} avatar`}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: "2px solid rgba(148,163,184,0.15)", boxShadow: "0 0 20px rgba(0,0,0,0.4)" }}
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-black truncate" style={{ color: "#f8fafc" }}>
                    {profile.name || profile.login}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: "#3b82f6" }}>@{profile.login}</p>
                  {profile.bio && (
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: "#475569" }}>
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="space-y-1.5 text-xs mb-5"
                style={{ color: "#475569", borderTop: "1px solid rgba(148,163,184,0.08)", paddingTop: "16px" }}
              >
                <div className="flex justify-between">
                  <span>Followers</span>
                  <span className="font-semibold" style={{ color: "#94a3b8" }}>{(profile.followers ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Following</span>
                  <span className="font-semibold" style={{ color: "#94a3b8" }}>{(profile.following ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Public Repos</span>
                  <span className="font-semibold" style={{ color: "#94a3b8" }}>{profile.public_repos ?? 0}</span>
                </div>
                {profile.location && (
                  <div className="flex justify-between">
                    <span>Location</span>
                    <span className="font-semibold truncate max-w-[120px]" style={{ color: "#94a3b8" }}>{profile.location}</span>
                  </div>
                )}
              </div>

              {profile.html_url && (
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost w-full justify-center text-xs py-2"
                >
                  <span>🐙</span>
                  View on GitHub ↗
                </a>
              )}
            </div>

            {/* Stats grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <StatCard label="Public Repos"        value={profile.public_repos ?? 0} icon="📁" />
              <StatCard label="Total Stars"         value={totalStars}                icon="⭐" />
              <StatCard label="Total Forks"         value={totalForks}                icon="🍴" />
              <StatCard label="Account Type"        value={profile.type || "User"}   icon="👤" />

              {/* Language breakdown */}
              {langBreakdown.length > 0 && (
                <div className="col-span-2 glass-card p-4">
                  <p className="text-xs font-semibold mb-3" style={{ color: "#475569" }}>Top Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {langBreakdown.map(([lang, count]) => (
                      <span
                        key={lang}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          border: "1px solid rgba(59,130,246,0.2)",
                          color: "#60a5fa",
                        }}
                      >
                        {lang} · {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contribution Heatmap */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                📅
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#f8fafc" }}>Contribution Activity</h3>
                <p className="text-xs" style={{ color: "#475569" }}>Last 12 months — @{activeUsername}</p>
              </div>
            </div>
            <div
              className="overflow-x-auto rounded-xl p-3"
              style={{ background: "rgba(5,8,16,0.5)", border: "1px solid rgba(148,163,184,0.06)" }}
            >
              <img
                src={`https://ghchart.rshah.org/22c55e/${activeUsername}`}
                alt={`${activeUsername} contribution heatmap`}
                className="min-w-[720px] w-full"
              />
            </div>
          </div>

          {/* Top Repos */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                ⭐
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: "#f8fafc" }}>Top Repositories</h3>
                <p className="text-xs" style={{ color: "#475569" }}>Sorted by stars + forks</p>
              </div>
            </div>

            {topRepos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topRepos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
              </div>
            ) : (
              <div className="glass-card p-10 text-center">
                <p className="text-sm" style={{ color: "#475569" }}>No public repositories found.</p>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
