const fs = require("fs").promises;
const path = require("path");
const { getAuth } = require("../utils/authStore");

async function pushRepo() {
  const auth = getAuth();
  if (!auth) {
    console.error("You are not logged in. Run: vcs login --email <email> --password <password>");
    return;
  }

  // Folder name = repository name on the website
  const repoName = path.basename(process.cwd());
  const commitsPath = path.resolve(process.cwd(), ".apnaGit", "commits");
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Find the repository on the server
    const repoRes = await fetch(
      `${auth.apiUrl}/repo/name/${encodeURIComponent(repoName)}`,
      { headers }
    );
    if (repoRes.status === 401) {
      console.error("Session expired. Run `vcs login` again.");
      return;
    }
    if (repoRes.status === 404) {
      console.error(`No repository named "${repoName}" on RepoHub. Create it on the website with exactly this name.`);
      return;
    }
    if (!repoRes.ok) {
      console.error("Could not find the repository:", (await repoRes.json().catch(() => ({}))).error || repoRes.status);
      return;
    }
    const repo = await repoRes.json();
    if (String(repo.owner?._id) !== String(auth.userId)) {
      console.error(`"${repoName}" belongs to someone else. You can only push to your own repositories.`);
      return;
    }

    // 2. Read local commits
    let commitDirs;
    try {
      commitDirs = await fs.readdir(commitsPath);
    } catch {
      console.error("Nothing to push. Run `vcs init`, `vcs add` and `vcs commit` first.");
      return;
    }
    if (commitDirs.length === 0) {
      console.error("No commits to push.");
      return;
    }

    // 3. Send each commit to the backend
    let pushed = 0;
    for (const commitId of commitDirs) {
      const commitPath = path.join(commitsPath, commitId);
      const entries = await fs.readdir(commitPath, { withFileTypes: true });

      const files = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const buf = await fs.readFile(path.join(commitPath, entry.name));
        files.push({ name: entry.name, content: buf.toString("base64") });
      }

      const res = await fetch(`${auth.apiUrl}/repo/${repo._id}/commits/${commitId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ files }),
      });

      if (res.ok) {
        pushed++;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error(`Commit ${commitId} failed: ${err.error || res.status}`);
      }
    }

    console.log(`Pushed ${pushed} of ${commitDirs.length} commit(s) to "${repoName}".`);
  } catch (err) {
    console.error("Could not reach the server:", err.message);
  }
}

module.exports = { pushRepo };