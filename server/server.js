const express = require("express");
const cors = require("cors");
require("dotenv").config();

const profileRoutes = require("./routes/profile");
const platformRoutes = require("./routes/platforms");
const statsRoutes = require("./routes/stats");
const progressRoutes = require("./routes/progress");
const languageRoutes = require("./routes/languages");
const algorithmRoutes = require("./routes/algorithms");
const aiRoutes = require("./routes/ai");

const app = express();

// Middleware - CORS (always allow Vercel + localhost; plus CORS_ORIGIN env)
const DEFAULT_ORIGINS = [
  "https://developer-analyzer.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOrigin = process.env.CORS_ORIGIN || "";
const allowedOrigins = [
  ...new Set([
    ...DEFAULT_ORIGINS,
    ...corsOrigin.split(",").map((s) => s.trim()).filter(Boolean),
  ]),
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  })
);
app.use(express.json());

// Routes
app.use("/api/profile", profileRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/algorithms", algorithmRoutes);
app.use("/api/ai", aiRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
