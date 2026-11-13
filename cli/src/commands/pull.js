const fs = require("fs").promises;
const path = require("path");
const { REPO_DIR } = require("../config");
const { getAuth } = require("../authStore");
const { request, networkErrorMessage } = require("../http");
const { fail } = require("../ui");

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

async function pull() {
  const auth = getAuth();
  if (!auth) {
    return fail("You are not logged in. Run: repohub login");
  }

  // Folder name = repository name on the website
  const repoName = path.basename(process.cwd());
  const commitsPath = path.resolve(process.cwd(), REPO_DIR, "commits");
  const headers = { Authorization: `Bearer ${auth.token}` };

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
      return fail(`No repository named "${repoName}" on RepoHub.`);
    }
    if (!repoRes.ok) {
      const body = await repoRes.json().catch(() => ({}));
      return fail(`Could not find the repository: ${body.error || repoRes.status}`);
    }
    const repo = await repoRes.json();

    // 2. List the commits that exist on the server
    const listRes = await request(`${auth.apiUrl}/repo/${repo._id}/commits`, { headers });
    if (!listRes.ok) {
      const body = await listRes.json().catch(() => ({}));
      return fail(`Could not list commits: ${body.error || listRes.status}`);
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

      const res = await request(`${auth.apiUrl}/repo/${repo._id}/commits/${commitId}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`Commit ${commitId} failed: ${err.error || res.status}`);
        process.exitCode = 1;
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
    fail(networkErrorMessage(err));
  }
}

module.exports = { pull };
