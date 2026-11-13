const { clearAuth } = require("../authStore");

function logout() {
  console.log(clearAuth() ? "Logged out." : "You were not logged in.");
}

module.exports = { logout };
