// Score Calculation: Per Easy +50, Per Medium +80, Per Hard +100
export const calculateScore = (easy, medium, hard) => {
  return easy * 50 + medium * 80 + hard * 100;
};

// Rating Levels based on total score
export const getRatingLevel = (totalScore) => {
  if (totalScore >= 350000) return { level: "👑 Legendary", color: "text-purple-400" };
  if (totalScore >= 250000) return { level: "⭐ Master", color: "text-yellow-400" };
  if (totalScore >= 150000) return { level: "🏆 Expert", color: "text-orange-400" };
  if (totalScore >= 100000) return { level: "🎖️ Professional", color: "text-blue-400" };
  if (totalScore >= 50000) return { level: "✨ Advanced", color: "text-green-400" };
  if (totalScore >= 30000) return { level: "📈 Intermediate", color: "text-cyan-400" };
  if (totalScore >= 20000) return { level: "🌱 Beginner", color: "text-gray-400" };
  return { level: "🚀 Starter", color: "text-red-400" };
};

// Get performance percentage
export const getPerformancePercentage = (easy, medium, hard) => {
  const total = easy + medium + hard;
  if (total === 0) return 0;
  return Math.round((easy * 1 + medium * 2 + hard * 3) / (total * 3) * 100);
};

// Get rating color based on score
export const getRatingColor = (score) => {
  if (score >= 2000) return "bg-purple-600";
  if (score >= 1500) return "bg-orange-600";
  if (score >= 1000) return "bg-blue-600";
  if (score >= 500) return "bg-green-600";
  return "bg-red-600";
};
