const fs = require("fs").promises;
const path = require("path");
const { REPO_DIR } = require("../config");
const { getAuth } = require("../authStore");
const { request, networkErrorMessage } = require("../http");
const { fail } = require("../ui");

async function push() {
  const auth = getAuth();
  if (!auth) {
    return fail("You are not logged in. Run: repohub login");
  }

  // Folder name = repository name on the website
  const repoName = path.basename(process.cwd());
  const commitsPath = path.resolve(process.cwd(), REPO_DIR, "commits");
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Find the repository on the server
    const repoRes = await request(
      `${auth.apiUrl}/repo/name/${encodeURIComponent(repoName)}`,
      { headers }
    );
    if (repoRes.status === 401) {
      return fail("Session expired. Run `repohub login` again.");
    }
    if (repoRes.status === 404) {
      return fail(`No repository named "${repoName}" on RepoHub. Create it on the website with exactly this name.`);
    }
    if (!repoRes.ok) {
      const body = await repoRes.json().catch(() => ({}));
      return fail(`Could not find the repository: ${body.error || repoRes.status}`);
    }
    const repo = await repoRes.json();
    if (String(repo.owner?._id) !== String(auth.userId)) {
      return fail(`"${repoName}" belongs to someone else. You can only push to your own repositories.`);
    }

    // 2. Read local commits
    let commitDirs;
    try {
      commitDirs = await fs.readdir(commitsPath);
    } catch {
      return fail("Nothing to push. Run `repohub init`, `repohub add` and `repohub commit` first.");
    }
    if (commitDirs.length === 0) {
      return fail("No commits to push.");
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

      const res = await request(`${auth.apiUrl}/repo/${repo._id}/commits/${commitId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ files }),
      });

      if (res.ok) {
        pushed++;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error(`Commit ${commitId} failed: ${err.error || res.status}`);
        process.exitCode = 1;
      }
    }

    console.log(`Pushed ${pushed} of ${commitDirs.length} commit(s) to "${repoName}".`);
  } catch (err) {
    fail(networkErrorMessage(err));
  }
}

module.exports = { push };
