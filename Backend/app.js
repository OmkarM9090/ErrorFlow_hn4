const express = require("express");
const cors = require("cors");
const auditRouter = require("./routes/audit");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ── CORS Configuration ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());

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
