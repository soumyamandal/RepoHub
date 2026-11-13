// The backend the CLI talks to unless the user passes --server
// (or sets REPOHUB_API_URL). Replace with your deployed backend URL before publishing.
const DEFAULT_API_URL = "https://repohub-backend-gakq.onrender.com";

// Free hosting can take ~30-60 s to wake up, so be patient before giving up.
const TIMEOUT_MS = Number(process.env.REPOHUB_TIMEOUT_MS) || 90000;

// Hidden folder created inside a project by `repohub init`
const REPO_DIR = ".apnaGit";

module.exports = { DEFAULT_API_URL, TIMEOUT_MS, REPO_DIR };
