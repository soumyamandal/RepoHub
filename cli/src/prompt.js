const readline = require("readline");

// ---- piped / non-interactive input: read one line at a time ----
let rl;
let lines;
function nextLine() {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin });
    lines = rl[Symbol.asyncIterator]();
  }
  return lines.next().then((r) => (r.done ? "" : r.value));
}

// ---- real terminal: read characters ourselves so a password is never echoed ----
function readFromTerminal(question, hidden) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    // Switch to raw mode BEFORE showing the prompt, so nothing typed
    // right away can be echoed by the terminal.
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    process.stdout.write(question);

    let input = "";
    const finish = (value) => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
      resolve(value);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish(input);
        if (ch === "\u0003") {            // Ctrl+C
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            if (!hidden) process.stdout.write("\b \b");
          }
        } else if (ch >= " ") {
          input += ch;
          if (!hidden) process.stdout.write(ch);
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function ask(question, { hidden = false } = {}) {
  if (process.stdin.isTTY) return readFromTerminal(question, hidden);
  process.stdout.write(question);
  return nextLine();
}

function closePrompts() {
  if (rl) rl.close();
}

module.exports = { ask, closePrompts };
