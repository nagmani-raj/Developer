const express = require("express");
const cors = require("cors");
require("dotenv").config();

const profileRoutes = require("./routes/profile");
const platformRoutes = require("./routes/platforms");
const statsRoutes = require("./routes/stats");
const progressRoutes = require("./routes/progress");
const languageRoutes = require("./routes/languages");
const algorithmRoutes = require("./routes/algorithms");

const app = express();

// Middleware - flexible CORS for local development
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
const allowedOrigins = corsOrigin.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g., curl, Postman, server-side)
      if (!origin) return callback(null, true);

      // allow all if wildcard is present
      if (allowedOrigins.includes("*") || allowedOrigins.length === 0) return callback(null, true);

      // allow if origin is explicitly listed or if running on localhost (dev)
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
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
