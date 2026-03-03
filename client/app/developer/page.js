"use client";

import { useEffect, useMemo, useState } from "react";

const LAST_GITHUB_USERNAME_KEY = "LAST_GITHUB_USERNAME";

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
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
    const cleaned = String(rawUsername || "")
      .trim()
      .replace(/^@/, "");
    if (!cleaned) return;

    setLoading(true);
    setError("");
    setProfile(null);
    setRepos([]);

    try {
      const [profileRes, repoRes] = await Promise.all([
        fetch(`https://api.github.com/users/${cleaned}`),
        fetch(
          `https://api.github.com/users/${cleaned}/repos?sort=updated&per_page=100`,
        ),
      ]);

      if (!profileRes.ok) {
        throw new Error("GitHub user not found.");
      }

      const profileData = await profileRes.json();
      const repoData = repoRes.ok ? await repoRes.json() : [];
      const safeRepos = Array.isArray(repoData) ? repoData : [];

      safeRepos.sort((a, b) => {
        const scoreA = (a.stargazers_count || 0) + (a.forks_count || 0);
        const scoreB = (b.stargazers_count || 0) + (b.forks_count || 0);
        return scoreB - scoreA;
      });

      try {
        localStorage.setItem(LAST_GITHUB_USERNAME_KEY, cleaned);
      } catch (e) {}

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
    } catch (e) {}
  }, []);

  const handleFetch = async (event) => {
    event.preventDefault();
    await fetchUserData(usernameInput);
  };

  const totalStars = useMemo(
    () => repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0),
    [repos],
  );

  const totalForks = useMemo(
    () => repos.reduce((acc, repo) => acc + (repo.forks_count || 0), 0),
    [repos],
  );

  const topRepos = useMemo(() => repos.slice(0, 6), [repos]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
          Github Repository
        </h1>
      </div>

      {!showSearchForm && profile ? (
        <div className="mb-2 flex items-center justify-start">
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
            className="rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
          >
            Another User
          </button>
        </div>
      ) : null}

      {showSearchForm ? (
        <div className="flex justify-center">
          <form
            onSubmit={handleFetch}
            className="w-[400px] h-[400px] rounded-2xl border border-gray-800 bg-gray-900/60 p-8 flex flex-col justify-center"
          >
            <label className="block text-sm text-gray-300 mb-2">
              GitHub Username
            </label>

            <input
              type="text"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              placeholder="GitHub Username e.g. nagmani-raj"
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 bg-red-600/20 px-6 py-3 rounded-xl border-2 border-red-500/50 transition-colors"
            >
              {loading ? "Fetching..." : "Fetch Data"}
            </button>
          </form>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </p>
      ) : null}

      {profile ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 lg:col-span-1">
              <img
                src={profile.avatar_url}
                alt={`${profile.login} avatar`}
                className="h-28 w-28 rounded-full border border-gray-700 object-cover"
              />
              <h2 className="mt-4 text-2xl font-bold text-white">
                {profile.name || profile.login}
              </h2>
              <p className="text-cyan-300">@{profile.login}</p>
              <p className="mt-3 text-sm text-gray-300">
                {profile.bio || "No description added on GitHub."}
              </p>
              
              <div className="mt-4 space-y-1 text-sm text-gray-300">
                <p>Followers: {profile.followers ?? 0}</p>
                <p>Following: {profile.following ?? 0}</p>
                <p>Public Repos: {profile.public_repos ?? 0}</p>
              </div>
              {profile.html_url ? (
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block  bg-green-600/20 border-green-500/50 rounded-lg border  border-indigo-300/40 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 px-4 py-2 text-sm font-bold text-cyan-300 shadow-lg shadow-violet-900/40 transition hover:from-fuchsia-400 hover:via-violet-400 hover:to-indigo-400"
                >
                  View Account
                </a>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              <StatCard
                label="Total Public Repos"
                value={profile.public_repos ?? 0}
              />
              <StatCard label="Total Stars (Public Repos)" value={totalStars} />
              <StatCard label="Total Forks (Public Repos)" value={totalForks} />
              <StatCard label="Account Type" value={profile.type || "User"} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h3 className="text-xl font-bold text-white">
              Contribution Heatmap
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Last 1 year activity map for @{activeUsername}.
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950 p-3">
              <img
                src={`https://ghchart.rshah.org/22c55e/${activeUsername}`}
                alt={`${activeUsername} contribution heatmap`}
                className="min-w-[760px] w-full"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h3 className="text-xl font-bold text-white">Top Repositories</h3>
            <p className="mt-1 text-sm text-gray-400">
              Sorted by stars + forks.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {topRepos.length > 0 ? (
                topRepos.map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-gray-800 bg-gray-950 p-4 transition hover:border-cyan-400/60"
                  >
                    <p className="font-semibold text-cyan-300">{repo.name}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-300">
                      {repo.description || "No description"}
                    </p>
                    <div className="mt-3 flex gap-4 text-xs text-gray-400">
                      <span>Language: {repo.language || "N/A"}</span>
                      <span>Stars: {repo.stargazers_count || 0}</span>
                      <span>Forks: {repo.forks_count || 0}</span>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-gray-400">No public repositories found.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
