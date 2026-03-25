import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectMongo } from "./config/mongo.js";
import projectRoutes from "./routes/project.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import aiRoutes from "./routes/ai.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Server running" });
});

app.use("/api/projects", projectRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 8787;

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Startup failed:", error);
    process.exit(1);
  });