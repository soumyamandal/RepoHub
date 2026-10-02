# RepoHub

A full-stack version control platform — a GitHub-style web app paired with a custom Git-like CLI. Users manage repositories and issues from the browser, while a command-line tool (`init`, `add`, `commit`, `push`, `pull`, `revert`) tracks and ships code to AWS S3. Commits pushed from the CLI show up live on the website.

**Live demo:** [https://your-app.vercel.app](https://your-app.vercel.app)
*(replace with your actual Vercel URL)*

---

## Features

- **Authentication** — signup/login with JWT, passwords hashed with bcrypt
- **Repositories** — create, view, update, toggle public/private, delete (owner-only)
- **Issues** — open, close/reopen, delete issues per repository
- **Commit history** — CLI pushes are stored in S3 and rendered on the repo page, grouped by commit with message, date, and file list
- **File viewer** — browse and read the files from the latest commit, straight from the website
- **Custom CLI** — a Git-inspired tool for local, file-based version control with cloud backup

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Primer React |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB (Mongoose) |
| Auth | JSON Web Tokens, bcrypt |
| Storage | AWS S3 (commit storage) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Architecture

```
┌─────────────┐      HTTP (JWT)      ┌──────────────┐
│   Frontend   │ ───────────────────▶ │   Backend    │
│ React + Vite │ ◀─────────────────── │   Express    │
│  (Vercel)    │                      │   (Render)   │
└─────────────┘                      └──────┬───────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      ▼                      ▼                      ▼
               ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
               │  MongoDB    │        │   AWS S3    │        │  CLI (local)│
               │   Atlas     │        │  (commits)  │◀──────▶│  push/pull  │
               └─────────────┘        └─────────────┘        └─────────────┘
```

The website and the CLI are two independent clients. The CLI pushes commits directly to S3 (using local AWS credentials); the backend reads from the same S3 bucket to display commit history and file contents on the repo page.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- An AWS account with an S3 bucket (only needed for `push` / `pull`)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/RepoHub.git
cd RepoHub

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`** (copy from `.env.example`):

```
PORT=3002
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
DB_NAME=VersionControlSystem
JWT_SECRET_KEY=<a long random string>

# Only needed for CLI push/pull
S3_BUCKET=<your-bucket-name>
AWS_REGION=<your-region>
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

**`frontend/.env`** (optional — only if your backend isn't on `localhost:3002`):

```
VITE_API_URL=http://localhost:3002
```

### 3. Run locally

```bash
# Terminal 1
cd backend
npm start          # http://localhost:3002

# Terminal 2
cd frontend
npm run dev         # http://localhost:5173
```

---

## Using the CLI

The CLI lives in `backend/index.js` and is run from any folder you want to version-control. **The folder name must match the repository's name on the website** — this is how the CLI and the backend agree on which repo a commit belongs to.

```bash
# inside an empty folder named exactly like your repo on the website
node /path/to/backend/index.js init
node /path/to/backend/index.js add <file>
node /path/to/backend/index.js commit "<message>"
node /path/to/backend/index.js push      # uploads to S3
node /path/to/backend/index.js pull      # downloads from S3
node /path/to/backend/index.js revert <commitId>
```

> Tip: add a PowerShell function (`function vcs { node "C:\path\to\backend\index.js" @args }`) to your `$PROFILE` to shorten every command to `vcs init`, `vcs push`, etc.

Once pushed, open the repository on the website and check the **Commits** and **Files** tabs — your pushed files and their content appear there automatically.

---

## API Reference

All routes except `/signup` and `/login` require the header:
```
Authorization: Bearer <token>
```

| Method | Route | Description |
| --- | --- | --- |
| POST | `/signup` | Create an account |
| POST | `/login` | Log in, returns a JWT |
| GET | `/userProfile/:id` | Get a user's profile |
| PUT | `/updateProfile/:id` | Update own profile (owner-only) |
| DELETE | `/deleteProfile/:id` | Delete own account (owner-only) |
| POST | `/repo/create` | Create a repository |
| GET | `/repo/all` | List all public repositories |
| GET | `/repo/:id` | Get a repository by ID |
| GET | `/repo/user/:userID` | List a user's repositories |
| PUT | `/repo/update/:id` | Update a repository (owner-only) |
| PATCH | `/repo/toggle/:id` | Toggle public/private (owner-only) |
| DELETE | `/repo/delete/:id` | Delete a repository (owner-only) |
| GET | `/repo/:id/commits` | List commits pushed via the CLI |
| GET | `/repo/:id/file?commit=&name=` | Get a file's content from a commit |
| POST | `/issue/create` | Open an issue |
| GET | `/issue/all?repository=` | List issues (optionally filtered) |
| PUT | `/issue/update/:id` | Update an issue (repo owner-only) |
| DELETE | `/issue/delete/:id` | Delete an issue (repo owner-only) |

---

## Known Limitations

- **Single-user CLI.** The CLI doesn't authenticate — it uses the same AWS credentials for every push, so it currently works for a single contributor per machine rather than many users sharing one repository safely. A multi-user version would route `push`/`pull` through the backend (with a `login` command and per-user tokens) instead of talking to S3 directly.
- **Text files only.** The file viewer decodes file content as UTF-8 text, so it renders code and text files correctly but not binary files (images, PDFs, executables).
- **No branching.** The CLI supports linear commits and `revert`, not branches or merges.

These were deliberate scope cuts to ship a working end-to-end flow first; the architecture above has clear next steps for each one.

---

## Project Structure

```
RepoHub/
├── backend/
│   ├── controllers/     # Request handlers + CLI command logic
│   ├── middleware/       # Auth & ownership checks
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── config/            # AWS S3 client setup
│   └── index.js           # Server entry point + CLI (yargs)
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/       # Login, Signup
        │   ├── dashboard/  # Dashboard
        │   ├── repo/       # Create, detail, commits, file viewer
        │   ├── issue/      # Issue list
        │   └── user/       # Profile, heatmap
        ├── api.js          # Axios instance with auth interceptor
        └── Routes.jsx
```

---

## License

This project was built for learning purposes.
