const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { REPO_DIR } = require("../config");
const { fail } = require("../ui");

async function commit(message) {
  const repoPath = path.resolve(process.cwd(), REPO_DIR);
  const stagedPath = path.join(repoPath, "staging");

  try {
    // Look at the staging area first, so a failed commit leaves nothing behind
    const entries = await fs.readdir(stagedPath, { withFileTypes: true }).catch(() => []);
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    if (files.length === 0) {
      return fail("Nothing staged. Run `repohub add <file>` first.");
    }

    const commitID = crypto.randomUUID();
    const commitDir = path.join(repoPath, "commits", commitID);
    await fs.mkdir(commitDir, { recursive: true });

    for (const file of files) {
      await fs.copyFile(path.join(stagedPath, file), path.join(commitDir, file));
    }

    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify({ message, date: new Date().toISOString() })
    );

    console.log(`Commit ${commitID} created with message: ${message}`);
  } catch (err) {
    fail(`Error committing files: ${err.message}`);
  }
}

module.exports = { commit };
