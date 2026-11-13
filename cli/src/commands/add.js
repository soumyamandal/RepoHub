const fs = require("fs").promises;
const path = require("path");
const { REPO_DIR } = require("../config");
const { fail } = require("../ui");

async function add(filePaths) {
  const stagingPath = path.resolve(process.cwd(), REPO_DIR, "staging");

  try {
    await fs.mkdir(stagingPath, { recursive: true });

    for (const filePath of filePaths) {
      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat) {
        fail(`File not found: ${filePath}`);
        continue;
      }
      if (!stat.isFile()) {
        fail(`Not a file (folders are not supported): ${filePath}`);
        continue;
      }
      const fileName = path.basename(filePath);
      await fs.copyFile(filePath, path.join(stagingPath, fileName));
      console.log(`File ${fileName} added to the staging area!`);
    }
  } catch (err) {
    fail(`Error adding file: ${err.message}`);
  }
}

module.exports = { add };
