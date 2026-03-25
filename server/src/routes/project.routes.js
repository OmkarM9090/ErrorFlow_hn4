import express from "express";
import { listProjects, createOrGetProject } from "../repositories/projectRepository.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const projects = await listProjects();
    res.json({ ok: true, projects });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, baseUrl } = req.body;
    if (!name || !baseUrl) {
      return res.status(400).json({ ok: false, error: "name and baseUrl are required" });
    }

    const project = await createOrGetProject({ name, baseUrl });
    res.json({ ok: true, project });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;