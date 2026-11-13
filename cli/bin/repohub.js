#!/usr/bin/env node
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const { login } = require("../src/commands/login");
const { logout } = require("../src/commands/logout");
const { init } = require("../src/commands/init");
const { add } = require("../src/commands/add");
const { commit } = require("../src/commands/commit");
const { push } = require("../src/commands/push");
const { pull } = require("../src/commands/pull");
const { revert } = require("../src/commands/revert");

yargs(hideBin(process.argv))
  .scriptName("repohub")
  .command(
    "login",
    "Log in to RepoHub (asks for email and password if not given)",
    (y) =>
      y
        .option("email", { type: "string", describe: "Your account email" })
        .option("password", { type: "string", describe: "Your password (prefer the hidden prompt)" })
        .option("server", { type: "string", describe: "Backend URL, if not the default" }),
    (argv) => login(argv)
  )
  .command("logout", "Forget the saved login", {}, () => logout())
  .command("init", "Start tracking the current folder", {}, () => init())
  .command(
    "add <files..>",
    "Add files to the staging area",
    (y) => y.positional("files", { describe: "Files to add", type: "string" }),
    (argv) => add(argv.files)
  )
  .command(
    "commit <message>",
    "Save a snapshot of the staged files",
    (y) => y.positional("message", { describe: "Commit message", type: "string" }),
    (argv) => commit(argv.message)
  )
  .command("push", "Upload your commits to RepoHub", {}, () => push())
  .command("pull", "Download commits you don't have yet", {}, () => pull())
  .command(
    "revert <commitId>",
    "Copy a commit's files back into this folder",
    (y) => y.positional("commitId", { describe: "Commit ID", type: "string" }),
    (argv) => revert(argv.commitId)
  )
  .demandCommand(1, "Run `repohub <command>`. Try `repohub --help`.")
  .strict()
  .help()
  .version()
  .parse();
