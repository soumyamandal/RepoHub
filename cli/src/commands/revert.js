const fs = require("fs").promises;
const path = require("path");
const { REPO_DIR } = require("../config");
const { fail } = require("../ui");

const COMMIT_ID = /^[A-Za-z0-9-]{8,64}$/;

async function revert(commitId) {
  if (!COMMIT_ID.test(commitId)) {
    return fail("Invalid commit ID.");
  }

  const commitDir = path.resolve(process.cwd(), REPO_DIR, "commits", commitId);

  try {
    const entries = await fs.readdir(commitDir, { withFileTypes: true }).catch(() => null);
    if (!entries) {
      return fail(`Commit ${commitId} not found in this folder. Try \`repohub pull\` first.`);
    }

    for (const entry of entries) {
      if (!entry.isFile() || entry.name === "commit.json") continue; // commit.json is metadata
      await fs.copyFile(path.join(commitDir, entry.name), path.resolve(process.cwd(), entry.name));
    }

    console.log(`Commit ${commitId} reverted successfully!`);
  } catch (err) {
    fail(`Unable to revert: ${err.message}`);
  }
}

module.exports = { revert };
