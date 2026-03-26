const fs = require("fs").promises;
const path = require("path");

const GITHUB_API = "https://api.github.com";

/**
 * Creates a Pull Request on GitHub with the optimized content.
 * @param {string} token GitHub Personal Access Token
 * @param {string} repoOwner GitHub username/org (e.g., 'Octocat')
 * @param {string} repoName Repository name
 * @param {string} optimizedDir Path to the local optimized files
 */
exports.createPullRequest = async (
  token,
  repoOwner,
  repoName,
  optimizedDir,
) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // Helper to make GitHub API calls
  const request = async (method, endpoint, body) => {
    const res = await fetch(
      `${GITHUB_API}/repos/${repoOwner}/${repoName}${endpoint}`,
      {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(
        `GitHub API Error for ${method} ${endpoint} (${res.status}): ${errTxt}`,
      );
    }
    return res.json();
  };

  // 1. Get default branch sha
  const repoInfo = await request("GET", "");
  const defaultBranch = repoInfo.default_branch;
  const branchRef = await request("GET", `/git/ref/heads/${defaultBranch}`);
  const baseSha = branchRef.object.sha;

  // 2. Create a new branch
  const timestamp = new Date().getTime();
  const newBranchName = `feature/accessibility-optimization-${timestamp}`;
  await request("POST", "/git/refs", {
    ref: `refs/heads/${newBranchName}`,
    sha: baseSha,
  });

  // 3. Create Blobs for each file in optimized directory
  const tree = [];
  let files = [];
  try {
    files = await fs.readdir(optimizedDir);
  } catch (err) {
    throw new Error(
      `Could not read optimized directory at ${optimizedDir}. Ensure it exists and contains optimized files.`,
    );
  }

  for (const file of files) {
    const filePath = path.join(optimizedDir, file);
    try {
      const content = await fs.readFile(filePath, "utf-8");

      const blob = await request("POST", "/git/blobs", {
        content: content,
        encoding: "utf-8",
      });

      tree.push({
        path: `optimized-output/${file}`,
        mode: "100644", // File blob
        type: "blob",
        sha: blob.sha,
      });
    } catch (err) {
      console.log(`Skipping ${file}: Not found locally.`);
    }
  }

  if (tree.length === 0) {
    throw new Error("No optimized files found to push.");
  }

  // 4. Create a Tree
  const newTree = await request("POST", "/git/trees", {
    base_tree: baseSha,
    tree: tree,
  });

  // 5. Create a Commit
  const commit = await request("POST", "/git/commits", {
    message: "Feature: Automated Accessibility & Code Optimization via AI",
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 6. Update Branch Reference
  await request("PATCH", `/git/refs/heads/${newBranchName}`, {
    sha: commit.sha,
    force: true,
  });

  // 7. Create Pull Request
  const pr = await request("POST", "/pulls", {
    title: "[AI] Accessibility & Optimization Output",
    head: newBranchName,
    base: defaultBranch,
    body: "Automated Pull Request containing frontend code optimized for accessibility and performance.",
  });

  return pr;
};
