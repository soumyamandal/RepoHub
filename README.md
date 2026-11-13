RepoHub

RepoHub is a repository hosting and snapshot synchronization project. It includes a web API and a Node.js command-line client. Users can create repositories, manage issues, save project snapshots, and sync commits between computers.

## Features

- User registration and login
- Public and private repositories
- Repository issue tracking
- CLI commands for initializing, staging, committing, pushing, pulling, and restoring files
- JWT-based API authentication and repository ownership checks
- MongoDB for application data and Amazon S3 for commit files

## Technology Stack

- Node.js and Express.js
- MongoDB with Mongoose
- Amazon S3 with AWS SDK for JavaScript
- JSON Web Tokens and bcryptjs
- yargs for CLI commands

## Project Structure

```text
RepoHub/
├── backend/   API server, routes, controllers, models, and middleware
├── cli/       Command-line client
└── frontend/  Web client entry point
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB
- An AWS S3 bucket and AWS credentials for commit storage

## Backend Setup

```bash
cd backend
npm install
```

Create a `backend/.env` file:

```dotenv
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=VersionControlSystem
JWT_SECRET_KEY=replace-with-a-long-random-secret
AWS_REGION=ap-south-1
S3_BUCKET=your-s3-bucket-name
```

Start the API server:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

Keep `.env` files and cloud credentials out of source control.

## CLI Setup

```bash
cd cli
npm install
npm link
repohub --help
```

To use a local backend, set its URL before logging in:

```powershell
$env:REPOHUB_API_URL = "http://localhost:3002"
repohub login
```

## Using the CLI

Create a repository in RepoHub, then create a local folder with the same name:

```bash
mkdir my-project
cd my-project

repohub login
repohub init
repohub add README.md app.js
repohub commit "Initial snapshot"
repohub push
```

To download and restore commits on another computer:

```bash
mkdir my-project
cd my-project

repohub login
repohub pull
repohub revert <commit-id>
```

## Available Commands

| Command | Description |
|---|---|
| `repohub login` | Log in and save the authentication token locally. |
| `repohub logout` | Remove the saved login. |
| `repohub init` | Initialize RepoHub metadata in the current folder. |
| `repohub add <files...>` | Add files to the staging area. |
| `repohub commit "message"` | Save a snapshot of staged files. |
| `repohub push` | Upload local commits to your remote repository. |
| `repohub pull` | Download commits that are not stored locally. |
| `repohub revert <commit-id>` | Copy a commit's files into the current folder. |

## How It Works

The CLI stores staging data and local commits in a hidden `.apnaGit` directory. The backend stores user, repository, and issue information in MongoDB, and stores commit files in Amazon S3. Authenticated API requests use a Bearer token.

## Limitations

- The local folder name must match the remote repository name.
- Files are stored flat; folder paths are not preserved.
- Staged files remain staged, so each commit includes all files currently in the staging area.
- Push sends all local commits each time.
- Revert overwrites matching files but does not delete other files in the folder.
- Login tokens expire after one day.

## License

The CLI package declares an MIT license. See the package license file for details.



This project was built for learning purposes.
