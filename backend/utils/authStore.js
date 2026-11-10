const fs = require("fs");
const os = require("os");
const path = require("path");

const dir = path.join(os.homedir(), ".repohub");
const file = path.join(dir, "config.json");

function saveAuth(data) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getAuth() {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

module.exports = { saveAuth, getAuth };