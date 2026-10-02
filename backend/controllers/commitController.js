const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const { s3, S3_BUCKET } = require("../config/aws-config");

// GET /repo/:id/commits  -> list of commits pushed via CLI for this repo
async function getCommits(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid repository ID!" });
  }

  try {
    const repo = await Repository.findById(id);
    if (!repo) return res.status(404).json({ error: "Repository not found!" });

    const prefix = `${repo.name}/commits/`;
    const data = await s3
      .listObjectsV2({ Bucket: S3_BUCKET, Prefix: prefix })
      .promise();

    const objects = (data.Contents || []).filter((o) => !o.Key.endsWith("/"));

    // Group S3 keys like "repoName/commits/<commitId>/file.txt" by commitId
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

// GET /repo/:id/file?commit=<commitId>&name=<fileName> -> raw file content
async function getFileContent(req, res) {
  const { id } = req.params;
  const { commit, name } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid repository ID!" });
  }
  if (!commit || !name) {
    return res.status(400).json({ error: "commit and name are required!" });
  }

  try {
    const repo = await Repository.findById(id);
    if (!repo) return res.status(404).json({ error: "Repository not found!" });

    const key = `${repo.name}/commits/${commit}/${name}`;
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

module.exports = { getCommits, getFileContent };