const express = require('express');
const router = express.Router();
const GithubUrl = require('../models/GithubUrl');
const path = require('path');
const { createPullRequest } = require('../src/services/githubPR.service');

/**
 * POST /api/github/save
 * Saves a GitHub account / URL to MongoDB.
 */
router.post('/save', async (req, res) => {
  try {
    const { githubId, url } = req.body;

    if (!githubId) {
      return res.status(400).json({ error: 'GitHub ID/username is required.' });
    }

    const newRecord = new GithubUrl({
      githubId,
      url
    });

    await newRecord.save();

    return res.status(201).json({
      message: 'GitHub account saved successfully.',
      data: newRecord
    });
  } catch (err) {
    console.error('[Route /api/github/save] Error:', err);
    return res.status(500).json({ error: 'Failed to save GitHub account.' });
  }
});

/**
 * POST /api/github/push-pr
 * Opens a Pull Request using the configured GITHUB_PAT and the provided repo.
 */
router.post('/push-pr', async (req, res) => {
  try {
    const { repoFullName } = req.body;
    const token = process.env.GITHUB_PAT;

    if (!token) {
      return res.status(500).json({ error: 'GitHub PAT is not configured in the server environment (GITHUB_PAT).' });
    }

    if (!repoFullName) {
      return res.status(400).json({ error: 'Repository Full Name (owner/repo) is required.' });
    }

    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid repository format. Please provide owner/repo format.' });
    }

    const optimizedDir = path.join(process.cwd(), 'output', 'optimized');

    // Make the PR
    const prResult = await createPullRequest(token, owner, repo, optimizedDir);

    return res.status(200).json({
      message: 'Pull request created successfully!',
      prUrl: prResult.html_url
    });
  } catch (err) {
    console.error('[Route /api/github/push-pr] Error:', err);
    return res.status(500).json({ error: 'Failed to create Pull Request.', details: err.message });
  }
});

module.exports = router;
