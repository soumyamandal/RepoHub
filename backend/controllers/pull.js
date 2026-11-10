const fs = require("fs").promises;
const path = require("path");
const { getAuth } = require("../utils/authStore");

const COMMIT_ID = /^[A-Za-z0-9-]{8,64}$/;

// Never trust names coming from the network: no folders, no "." / ".."
function isSafeName(name) {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    !/[\\/]/.test(name) &&
    name !== "." &&
    name !== ".."
  );
}

async function pullRepo() {
  const auth = getAuth();
  if (!auth) {
    console.error("You are not logged in. Run: vcs login --email <email> --password <password>");
    return;
  }

  // Folder name = repository name on the website
  const repoName = path.basename(process.cwd());
  const commitsPath = path.resolve(process.cwd(), ".apnaGit", "commits");
  const headers = { Authorization: `Bearer ${auth.token}` };

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
      console.error(`No repository named "${repoName}" on RepoHub.`);
      return;
    }
    if (!repoRes.ok) {
      console.error("Could not find the repository:", (await repoRes.json().catch(() => ({}))).error || repoRes.status);
      return;
    }
    const repo = await repoRes.json();

    // 2. List the commits that exist on the server
    const listRes = await fetch(`${auth.apiUrl}/repo/${repo._id}/commits`, { headers });
    if (!listRes.ok) {
      console.error("Could not list commits:", (await listRes.json().catch(() => ({}))).error || listRes.status);
      return;
    }
    const commits = await listRes.json();
    if (commits.length === 0) {
      console.log("Nothing to pull. There are no commits on the server yet.");
      return;
    }

    await fs.mkdir(commitsPath, { recursive: true });

    // 3. Download every commit we don't already have (commits never change)
    let pulled = 0;
    let skipped = 0;
    for (const { commitId } of commits) {
      if (!COMMIT_ID.test(commitId)) continue;

      const commitDir = path.join(commitsPath, commitId);
      const exists = await fs.access(commitDir).then(() => true, () => false);
      if (exists) {
        skipped++;
        continue;
      }

      const res = await fetch(`${auth.apiUrl}/repo/${repo._id}/commits/${commitId}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`Commit ${commitId} failed: ${err.error || res.status}`);
        continue;
      }
      const { files } = await res.json();

      await fs.mkdir(commitDir, { recursive: true });
      for (const f of files) {
        if (!isSafeName(f.name)) {
          console.error(`Skipped unsafe file name: ${f.name}`);
          continue;
        }
        await fs.writeFile(path.join(commitDir, f.name), Buffer.from(f.content, "base64"));
      }
      pulled++;
    }

    console.log(`Pulled ${pulled} new commit(s), ${skipped} already up to date.`);
  } catch (err) {
    console.error("Could not reach the server:", err.message);
  }
}

module.exports = { pullRepo };
