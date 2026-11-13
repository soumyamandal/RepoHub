// Print an error and make the process exit with a non-zero code (useful in scripts).
function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

module.exports = { fail };
