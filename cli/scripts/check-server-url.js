// Runs automatically before `npm publish` (see "prepublishOnly" in package.json).
// Stops you from publishing with the placeholder server URL.
const { DEFAULT_API_URL } = require("../src/config");

if (/YOUR-BACKEND/.test(DEFAULT_API_URL)) {
  console.error("Set DEFAULT_API_URL in src/config.js to your deployed backend URL before publishing.");
  process.exit(1);
}
