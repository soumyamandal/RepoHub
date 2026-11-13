const fs = require("fs");
const os = require("os");
const path = require("path");

const dir = () => path.join(os.homedir(), ".repohub");
const file = () => path.join(dir(), "config.json");

// Saved by `repohub login`: { token, userId, email, apiUrl }
function saveAuth(data) {
  fs.mkdirSync(dir(), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file(), JSON.stringify(data, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(file(), 0o600); // only you can read your token (no effect on Windows)
  } catch {}
}

function getAuth() {
  try {
    return JSON.parse(fs.readFileSync(file(), "utf-8"));
  } catch {
    return null;
  }
}

function clearAuth() {
  try {
    fs.unlinkSync(file());
    return true;
  } catch {
    return false;
  }
}

module.exports = { saveAuth, getAuth, clearAuth };
