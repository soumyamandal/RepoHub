# RepoHub

A MERN-based GitHub replica with a custom version control CLI built from scratch.

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT auth, Socket.io
- **Frontend**: React 19 + Vite, Tailwind CSS 4, Primer React
- **CLI (`init`, `add`, `commit`, `push`, `pull`, `revert`)**: local file-based commits, with push/pull to AWS S3

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values (Windows: copy .env.example .env)
npm start                 # http://localhost:3002
```

`.env` values:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `DB_NAME` | Database name (default `VersionControlSystem`) |
| `JWT_SECRET_KEY` | Long random string used to sign login tokens |
| `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Only for `push` / `pull` |

## 2. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Optional: copy `.env.example` to `.env` if your backend is not on `http://localhost:3002`.

## 3. Version control CLI

Run these inside any project folder you want to track (use the full path to `backend/index.js`):

```bash
node /path/to/backend/index.js init
node /path/to/backend/index.js add file.txt
node /path/to/backend/index.js commit "First commit"
node /path/to/backend/index.js push       # needs AWS credentials + S3_BUCKET
node /path/to/backend/index.js pull
node /path/to/backend/index.js revert <commitID>
```

## API overview

Public: `POST /signup`, `POST /login`.
Everything else needs the header `Authorization: Bearer <token>`.

| Area | Endpoints |
| --- | --- |
| Users | `GET /allUsers`, `GET /userProfile/:id`, `PUT /updateProfile/:id`, `DELETE /deleteProfile/:id` (own account only) |
| Repos | `POST /repo/create`, `GET /repo/all`, `GET /repo/:id`, `GET /repo/name/:name`, `GET /repo/user/:userID`, `PUT /repo/update/:id`, `PATCH /repo/toggle/:id`, `DELETE /repo/delete/:id` (owner only for changes) |
| Issues | `POST /issue/create` (body: `title`, `description`, `repository`), `GET /issue/all?repository=<id>`, `GET /issue/:id`, `PUT /issue/update/:id`, `DELETE /issue/delete/:id` |
