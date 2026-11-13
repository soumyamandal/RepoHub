const fs = require("fs").promises;
const path = require("path");
const { REPO_DIR } = require("../config");
const { fail } = require("../ui");

async function init() {
  const repoPath = path.resolve(process.cwd(), REPO_DIR);

  try {
    const existed = await fs.access(repoPath).then(() => true, () => false);
    await fs.mkdir(path.join(repoPath, "commits"), { recursive: true });

    console.log(existed ? "Repository already initialised." : "Repository initialised!");
    console.log(`Reminder: this folder must be named exactly like your repository on RepoHub ("${path.basename(process.cwd())}").`);
  } catch (err) {
    fail(`Error initialising repository: ${err.message}`);
  }
}

module.exports = { init };
