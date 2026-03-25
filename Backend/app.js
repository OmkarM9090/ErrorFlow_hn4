// const express = require('express');
// const mongoose = require('mongoose');
// require('dotenv').config();

// const app = express();

const express = require("express");
const cors = require("cors");
const auditRouter = require("./routes/audit");

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

app.use(express.json());

// Connect MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.log('MongoDB connection error:', err));

// Basic route
app.use(express.json());

// Basic request logger (replace with Winston/Pino in production)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/audit", auditRouter);

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
