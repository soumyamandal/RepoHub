const { saveAuth } = require("../utils/authStore");

async function loginUser(email, password) {
  const apiUrl = process.env.API_URL || "http://localhost:3002";

  try {
    const res = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(data.message || "Login failed!");
      return;
    }

    saveAuth({ token: data.token, userId: data.userId, email, apiUrl });
    console.log(`Logged in as ${email}`);
  } catch (err) {
    console.error("Could not reach the server:", err.message);
  }
}

module.exports = { loginUser };