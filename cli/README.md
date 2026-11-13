# repohub-cli

Command-line client for **RepoHub**, a GitHub-style platform. Version-control a folder on your laptop and sync its commits with your RepoHub account.

```
repohub login → init → add → commit → push
```

## Install

Requires Node.js 18 or newer.

```bash
npm install -g repohub-cli
repohub --help
```

Or run it without installing: `npx repohub-cli --help`

## Quick start

1. Create an account and a repository on the RepoHub website. Remember the repository name.
2. Make a folder **with exactly the same name** and open it in a terminal:

```bash
mkdir my-project && cd my-project

repohub login                      # asks for email and password (the password is hidden)
repohub init
repohub add index.js README.md     # one or more files
repohub commit "first commit"
repohub push
```

Open the repository on the website and look at the **Commits** and **Files** tabs.

On another computer:

```bash
mkdir my-project && cd my-project
repohub login
repohub pull                       # downloads the commits
repohub revert <commitId>          # copies that commit's files into the folder
```

## Commands

| Command | What it does |
| --- | --- |
| `repohub login` | Logs in and saves a token in `~/.repohub/config.json` |
| `repohub logout` | Deletes the saved token |
| `repohub init` | Creates the hidden `.apnaGit` folder in the current directory |
| `repohub add <files...>` | Copies files into the staging area |
| `repohub commit "<message>"` | Saves a snapshot of everything in the staging area |
| `repohub push` | Uploads your commits (only to repositories you own) |
| `repohub pull` | Downloads commits you don't have yet (your repos, or public ones) |
| `repohub revert <commitId>` | Copies the commit's files back into the current folder |

### Options

- `repohub login --server <url>`: use a different RepoHub backend.
- `REPOHUB_API_URL`: same, as an environment variable.
- `--email` / `--password` can be passed to `login` for scripts. Prefer the prompt: a password typed on the command line stays in your shell history.

## Good to know

- **The folder name must equal the repository name.** That is how the CLI knows where to push.
- Files are added **flat** (only the file name is kept, not its folder path). Folders cannot be added.
- Staged files stay staged: every commit is a snapshot of *all* files you have added so far. Run `repohub add` again after editing a file.
- `push` sends every local commit each time; commits already on the server are simply overwritten with the same data.
- A commit can hold roughly 7 MB of files.
- `revert` overwrites files with the same name and never deletes anything.
- Your login token expires after one day; run `repohub login` again when asked.
- If the server has been idle it can take up to a minute to wake up. The CLI waits.

## License

MIT
