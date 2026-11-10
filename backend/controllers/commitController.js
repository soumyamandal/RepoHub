const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const { s3, S3_BUCKET } = require("../config/aws-config");

// ---------- helpers ----------
const COMMIT_ID = /^[A-Za-z0-9-]{8,64}$/;

// File names must be flat: no slashes, no "." / ".."
function isSafeFileName(name) {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    name.length <= 255 &&
    !/[\\/]/.test(name) &&
    name !== "." &&
    name !== ".."
  );
}

// All of a repo's commits live under this S3 prefix (uses the repo ID, not the name)
const repoPrefix = (repo) => `repos/${repo._id}/commits/`;

function canView(repo, userId) {
  return repo.visibility || String(repo.owner) === userId;
}

// ---------- POST /repo/:id/commits/:commitId  (owner only) ----------
// body: { files: [{ name: "a.txt", content: "<base64>" }, ...] }
async function uploadCommit(req, res) {
  const { commitId } = req.params;
  const { files } = req.body;

  if (!COMMIT_ID.test(commitId)) {
    return res.status(400).json({ error: "Invalid commit ID!" });
  }
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files provided!" });
  }
  for (const f of files) {
    if (!f || !isSafeFileName(f.name) || typeof f.content !== "string") {
      return res.status(400).json({ error: `Invalid file: ${f && f.name}` });
    }
  }

  try {
    const base = `${repoPrefix(req.repo)}${commitId}`; // req.repo set by authorizeRepoOwner

    await Promise.all(
      files.map((f) =>
        s3
          .putObject({
            Bucket: S3_BUCKET,
            Key: `${base}/${f.name}`,
            Body: Buffer.from(f.content, "base64"),
          })
          .promise()
      )
    );

    res.status(201).json({ message: "Commit uploaded!", commitId, files: files.length });
  } catch (err) {
    console.error("Error uploading commit : ", err.message);
    res.status(500).send("Server error");
  }
}

// ---------- GET /repo/:id/commits ----------
async function getCommits(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid repository ID!" });
  }

  try {
    const repo = await Repository.findById(id);
    if (!repo) return res.status(404).json({ error: "Repository not found!" });
    if (!canView(repo, req.userId)) {
      return res.status(403).json({ error: "This repository is private!" });
    }

    const prefix = repoPrefix(repo);
    const data = await s3
      .listObjectsV2({ Bucket: S3_BUCKET, Prefix: prefix })
      .promise();

    const objects = (data.Contents || []).filter((o) => !o.Key.endsWith("/"));

    // Group S3 keys like "repos/<repoId>/commits/<commitId>/file.txt" by commitId
    const commits = {};
    for (const obj of objects) {
      const rest = obj.Key.slice(prefix.length); // "<commitId>/file.txt"
      const [commitId, ...fileParts] = rest.split("/");
      const fileName = fileParts.join("/");
      if (!fileName) continue;

      if (!commits[commitId]) {
        commits[commitId] = { commitId, files: [], message: null, date: obj.LastModified };
      }
      if (fileName === "commit.json") {
        const file = await s3
          .getObject({ Bucket: S3_BUCKET, Key: obj.Key })
          .promise();
        try {
          const meta = JSON.parse(file.Body.toString("utf-8"));
          commits[commitId].message = meta.message;
          commits[commitId].date = meta.date;
        } catch (e) {
          // ignore unreadable commit.json
        }
      } else {
        commits[commitId].files.push(fileName);
      }
    }

    const list = Object.values(commits).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json(list);
  } catch (err) {
    console.error("Error fetching commits : ", err.message);
    res.status(500).send("Server error");
  }
}

// ---------- GET /repo/:id/file?commit=<commitId>&name=<fileName> ----------
async function getFileContent(req, res) {
  const { id } = req.params;
  const { commit, name } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid repository ID!" });
  }
  if (!COMMIT_ID.test(commit || "") || !isSafeFileName(name)) {
    return res.status(400).json({ error: "Valid commit and name are required!" });
  }

  try {
    const repo = await Repository.findById(id);
    if (!repo) return res.status(404).json({ error: "Repository not found!" });
    if (!canView(repo, req.userId)) {
      return res.status(403).json({ error: "This repository is private!" });
    }

    const key = `${repoPrefix(repo)}${commit}/${name}`;
    const file = await s3.getObject({ Bucket: S3_BUCKET, Key: key }).promise();

    res.json({ name, content: file.Body.toString("utf-8") });
  } catch (err) {
    if (err.code === "NoSuchKey") {
      return res.status(404).json({ error: "File not found in this commit!" });
    }
    console.error("Error fetching file : ", err.message);
    res.status(500).send("Server error");
  }
}

// ---------- GET /repo/:id/commits/:commitId  (anyone who can view the repo) ----------
// returns: { commitId, files: [{ name, content: "<base64>" }, ...] }
async function downloadCommit(req, res) {
  const { id, commitId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid repository ID!" });
  }
  if (!COMMIT_ID.test(commitId)) {
    return res.status(400).json({ error: "Invalid commit ID!" });
  }

  try {
    const repo = await Repository.findById(id);
    if (!repo) return res.status(404).json({ error: "Repository not found!" });
    if (!canView(repo, req.userId)) {
      return res.status(403).json({ error: "This repository is private!" });
    }

    const prefix = `${repoPrefix(repo)}${commitId}/`;
    const data = await s3
      .listObjectsV2({ Bucket: S3_BUCKET, Prefix: prefix })
      .promise();

    const objects = (data.Contents || []).filter(
      (o) => !o.Key.endsWith("/") && isSafeFileName(o.Key.slice(prefix.length))
    );
    if (objects.length === 0) {
      return res.status(404).json({ error: "Commit not found!" });
    }

    const files = await Promise.all(
      objects.map(async (o) => {
        const file = await s3
          .getObject({ Bucket: S3_BUCKET, Key: o.Key })
          .promise();
        return { name: o.Key.slice(prefix.length), content: file.Body.toString("base64") };
      })
    );

    res.json({ commitId, files });
  } catch (err) {
    console.error("Error downloading commit : ", err.message);
    res.status(500).send("Server error");
  }
}

module.exports = { uploadCommit, getCommits, getFileContent,downloadCommit};