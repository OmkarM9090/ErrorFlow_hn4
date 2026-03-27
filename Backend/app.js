const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const auditRouter = require("./routes/audit");
const authRoutes = require("./routes/authRoutes");
const githubRouter = require("./routes/github");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5173",
  "http://localhost:5175",
];

// ── CORS Configuration ──────────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients and local frontend dev servers.
      if (!origin) return callback(null, true);

      const isAllowedOrigin =
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin);

      if (isAllowedOrigin) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// Basic request logger (replace with Winston/Pino in production)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

app.use("/api/audit", auditRouter);
app.use("/api/auth", authRoutes);
app.use("/api/github", githubRouter);

// ── Static files ────────────────────────────────────────────────────────────
app.use(
  "/screenshots",
  express.static(path.join(__dirname, "output/screenshots")),
);
app.use("/output", express.static(path.join(process.cwd(), "output")));

// ── 404 catch-all ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Express] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
