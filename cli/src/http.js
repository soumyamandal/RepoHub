const { TIMEOUT_MS } = require("./config");

// fetch() with a timeout, so the CLI never hangs forever
function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

// Turn a low-level network error into a sentence a person can act on
function networkErrorMessage(err) {
  if (err.name === "TimeoutError") {
    return "The server took too long to respond. If it was idle it may still be waking up, try again in a minute.";
  }

  // The real reason is hidden inside err.cause (sometimes inside an AggregateError)
  const cause = err.cause;
  const reason =
    (cause && (cause.code || (cause.errors && cause.errors[0] && cause.errors[0].code))) ||
    err.message;

  let hint = "";
  if (reason === "ENOTFOUND" || reason === "EAI_AGAIN") {
    hint = " Check your internet connection and the server address.";
  } else if (reason === "ECONNREFUSED") {
    hint = " The server is not running or the address is wrong.";
  }
  return `Could not reach the server (${reason}).${hint}`;
}

module.exports = { request, networkErrorMessage };
