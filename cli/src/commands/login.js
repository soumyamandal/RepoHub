const { DEFAULT_API_URL } = require("../config");
const { saveAuth } = require("../authStore");
const { request, networkErrorMessage } = require("../http");
const { ask, closePrompts } = require("../prompt");
const { fail } = require("../ui");

async function login({ email, password, server }) {
  const apiUrl = (server || process.env.REPOHUB_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

  if (/YOUR-BACKEND/.test(apiUrl)) {
    return fail("No server configured. Use: repohub login --server https://your-backend.example.com");
  }

  // Ask for whatever was not given as a flag (the password is never echoed)
  try {
    if (!email) email = (await ask("Email: ")).trim();
    if (!password) password = await ask("Password: ", { hidden: true });
  } finally {
    closePrompts();
  }
  if (!email || !password) return fail("Email and password are required.");

  try {
    const res = await request(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) return fail(data.message || "Login failed!");

    saveAuth({ token: data.token, userId: data.userId, email, apiUrl });
    console.log(`Logged in as ${email} (${apiUrl})`);
  } catch (err) {
    fail(networkErrorMessage(err));
  }
}

module.exports = { login };
