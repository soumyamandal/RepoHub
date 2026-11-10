# RepoHub

A full-stack version control platform: a GitHub-style web app plus a custom Git-like CLI. Users manage repositories and issues in the browser, while the CLI (`login`, `init`, `add`, `commit`, `push`, `pull`, `revert`) versions files locally and syncs commits through the backend to AWS S3. Commits pushed from the CLI show up on the website.

**Live demo:** [https://your-app.vercel.app](https://your-app.vercel.app)
*(replace with your Vercel URL)*

---

## Features

- **Authentication**: signup/login with JWT, passwords hashed with bcrypt
- **Repositories**: create, view, update, toggle public/private, delete (owner-only changes)
- **Issues**: open, close/reopen and delete issues per repository
- **Commit history**: commits pushed from the CLI are listed on the repo page with message, date and files
- **File viewer**: browse and read the files of the latest commit from the website
- **Custom CLI**: local, file-based version control with authenticated push/pull
- **Server-side authorization**: only a repo's owner can push to it; private repos are readable only by their owner

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Primer React |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JSON Web Tokens, bcrypt |
| Storage | AWS S3 (commit files) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Architecture

```
 Browser (React)                      CLI (vcs)
       │                                  │
       │  HTTPS + JWT                     │  HTTPS + JWT  (token saved by `vcs login`)
       ▼                                  ▼
 ┌──────────────────────────────────────────────┐
 │               Backend (Express)              │
 │  auth -> owner/visibility checks -> validate │
 └───────────────┬─────────────────┬────────────┘
                 │                 │
                 ▼                 ▼
          MongoDB (users,     AWS S3 (commit files)
          repos, issues)      repos/<repoId>/commits/<commitId>/<file>
```

Both the website and the CLI talk only to the backend. **AWS credentials exist only on the server**; the CLI never holds them.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- An AWS account with an S3 bucket (used by the backend)

### 1. Install

```bash
git clone https://github.com/<your-username>/RepoHub.git
cd RepoHub

cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

**`backend/.env`** (copy from `.env.example`):

```
PORT=3002
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
DB_NAME=VersionControlSystem
JWT_SECRET_KEY=<a long random string>

# AWS (server only)
S3_BUCKET=<your-bucket-name>
AWS_REGION=<your-region>
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>

# Optional: the server the CLI talks to (default http://localhost:3002)
API_URL=http://localhost:3002
```

**`frontend/.env`** (only if the backend is not on `localhost:3002`):

```
VITE_API_URL=http://localhost:3002
```

### 3. Run

```bash
# Terminal 1
cd backend
npm start          # http://localhost:3002

# Terminal 2
cd frontend
npm run dev        # http://localhost:5173
```

---

## Using the CLI

The CLI lives in `backend/index.js`. Run it inside the folder you want to version-control.

1. Create a repository on the website.
2. Make a local folder with **exactly the same name** as the repository.
3. Log in once, then work as usual:

```bash
node /path/to/backend/index.js login --email you@mail.com --password yourpassword
node /path/to/backend/index.js init
node /path/to/backend/index.js add <file>
node /path/to/backend/index.js commit "<message>"
node /path/to/backend/index.js push      # send commits to the server
node /path/to/backend/index.js pull      # fetch commits you don't have yet
node /path/to/backend/index.js revert <commitId>   # copy that commit's files into the folder
```

| Command | What it does |
| --- | --- |
| `login` | Gets a JWT from the server and saves it in `~/.repohub/config.json` |
| `init` | Creates the `.apnaGit` folder |
| `add` | Copies a file into the staging area |
| `commit` | Saves a snapshot of the staged files with a message |
| `push` | Uploads local commits through the backend (owner only) |
| `pull` | Downloads commits that are missing locally (public repos, or your own) |
| `revert` | Copies a commit's files back into the working folder (overwrites same-named files) |

> Tip (PowerShell): add `function vcs { node "C:\path\to\backend\index.js" @args }` to your `$PROFILE` to shorten every command to `vcs push`.

After a push, open the repository on the website and check the **Commits** and **Files** tabs.

---

## API Reference

All routes except `/signup` and `/login` need the header `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/signup` | Create an account |
| POST | `/login` | Log in, returns a JWT |
| GET | `/userProfile/:id` | Get a user's profile |
| PUT | `/updateProfile/:id` | Update own profile |
| DELETE | `/deleteProfile/:id` | Delete own account |
| POST | `/repo/create` | Create a repository |
| GET | `/repo/all` | List public repositories |
| GET | `/repo/name/:name` | Get a repository by name |
| GET | `/repo/user/:userID` | List a user's repositories |
| GET | `/repo/:id` | Get a repository by ID |
| PUT | `/repo/update/:id` | Update a repository (owner only) |
| PATCH | `/repo/toggle/:id` | Toggle public/private (owner only) |
| DELETE | `/repo/delete/:id` | Delete a repository (owner only) |
| GET | `/repo/:id/commits` | List commits of a repository |
| GET | `/repo/:id/commits/:commitId` | Download one commit's files (base64) |
| POST | `/repo/:id/commits/:commitId` | Upload one commit's files (owner only) |
| GET | `/repo/:id/file?commit=&name=` | Read one file's text content |
| POST | `/issue/create` | Open an issue |
| GET | `/issue/all?repository=` | List issues |
| GET | `/issue/:id` | Get an issue |
| PUT | `/issue/update/:id` | Update an issue (repo owner only) |
| DELETE | `/issue/delete/:id` | Delete an issue (repo owner only) |

---

## Security Notes

- Passwords are hashed with bcrypt; tokens are signed JWTs that expire after 1 day.
- **Ownership is enforced on the server**, not in the CLI: pushing to someone else's repository returns `403`.
- Private repositories return `403` to anyone except their owner (commit list, file contents and downloads).
- Uploaded file names are validated (no `/`, `\`, `.` or `..`), and the CLI rejects unsafe names coming back from the server.
- AWS keys live only in the server's environment variables.

---

## Known Limitations

- **Folder name must equal the repository name.** This is how the CLI knows which repository to use.
- **Each `push` re-sends all local commits**, not only the new ones.
- **Size**: commit files travel as base64 in JSON, so one commit is limited to roughly 7 MB.
- **Text files only in the viewer.** Binary files push and pull correctly, but the website shows file content as UTF-8 text.
- **No branches or merges.** Commits are linear.
- **`login` takes the password as a command-line argument**, so it can end up in the shell history.
- **The token expires after 1 day**; run `login` again when the CLI says the session expired.
- **`revert` overwrites** files that have the same name as files in the commit, and does not delete anything.

---

## Project Structure

```
RepoHub/
├── backend/
│   ├── controllers/   # API handlers + CLI commands (login, init, add, commit, push, pull, revert)
│   ├── middleware/    # JWT auth + ownership checks
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express routers
│   ├── config/        # AWS S3 client
│   ├── utils/         # Token storage for the CLI
│   └── index.js       # Server entry point + CLI (yargs)
└── frontend/
    └── src/
        ├── components/  # auth, dashboard, repo, issue, user
        ├── api.js       # Axios instance with auth interceptor
        └── Routes.jsx
```

---

## License

Built for learning purposes.


This project was built for learning purposes.
