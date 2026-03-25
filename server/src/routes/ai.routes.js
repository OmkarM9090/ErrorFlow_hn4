import express from "express";
import {
  testFeatherlessConnection,
  generateIssueRemediation
} from "../services/featherlessService.js";

const router = express.Router();

router.get("/health", async (_req, res) => {
  try {
    console.log("[AI HEALTH] route hit");

    const result = await testFeatherlessConnection();

    console.log("[AI HEALTH] success:", result);

    res.json({
      ok: true,
      message: "Featherless API key works",
      provider: result.provider,
      model: result.model,
      raw: result.raw,
      parsed: result.parsed
    });
  } catch (error) {
    console.error("[AI HEALTH] error:", error.message);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/remediate-issue", async (req, res) => {
  try {
    console.log("[AI REMEDIATE] route hit");
    console.log("[AI REMEDIATE] raw body:");
    console.log(JSON.stringify(req.body, null, 2));

    const {
      issueId,
      help,
      description,
      impact,
      helpUrl,
      tags,
      selector,
      htmlSnippet,
      pageUrl,
      pageTitle,
      framework
    } = req.body;

    if (!issueId || !help) {
      console.warn("[AI REMEDIATE] missing required fields", { issueId, help });

      return res.status(400).json({
        ok: false,
        error: "issueId and help are required"
      });
    }

    const payload = {
      issueId,
      help,
      description,
      impact,
      helpUrl,
      tags,
      selector,
      htmlSnippet,
      pageUrl,
      pageTitle,
      framework
    };

    console.log("[AI REMEDIATE] normalized payload:");
    console.log(JSON.stringify(payload, null, 2));

    const ai = await generateIssueRemediation(payload);

    console.log("[AI REMEDIATE] AI success");

    res.json({
      ok: true,
      ...ai
    });
  } catch (error) {
    console.error("[AI REMEDIATE] error:", error.message);
    console.error(error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;