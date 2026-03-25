import express from "express";
import { createOrGetProject } from "../repositories/projectRepository.js";
import { saveScan } from "../repositories/scanRepository.js";
import { crawlSite } from "../services/crawlService.js";
import { runAxeAuditForPages } from "../services/axeService.js";
import { runLighthouseForPages } from "../services/lighthouseService.js";
import { buildScanSummary } from "../services/scoringService.js";

const router = express.Router();

router.post("/deep", async (req, res) => {
  try {
    const { url, projectName, maxPages = 5 } = req.body;

    if (!url || !projectName) {
      return res.status(400).json({
        ok: false,
        error: "url and projectName are required"
      });
    }

    const startedAt = new Date();

    const project = await createOrGetProject({
      name: projectName,
      baseUrl: url
    });

    const pages = await crawlSite(url, maxPages);
    const axeResults = await runAxeAuditForPages(pages);
    const lighthouseResults = await runLighthouseForPages(pages);

    const mergedPages = pages.map((pageUrl, index) => ({
      url: pageUrl,
      axe: axeResults[index],
      lighthouse: lighthouseResults[index]
    }));

    const summary = buildScanSummary(mergedPages);

    const scanDoc = {
      projectId: project._id,
      baseUrl: url,
      startedAt,
      completedAt: new Date(),
      summary,
      pages: mergedPages
    };

    const scanId = await saveScan(scanDoc);

    res.json({
      ok: true,
      projectId: project._id,
      scanId,
      summary,
      pages: mergedPages
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;