const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const Issue = require("../models/issueModel");

// Only the logged-in user themself may touch /:id user routes
function authorizeSelf(req, res, next) {
  if (req.params.id !== req.userId) {
    return res.status(403).json({ message: "You can only modify your own account!" });
  }
  next();
}

// Only the repository owner may modify a repository (route param :id)
async function authorizeRepoOwner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }
    const repo = await Repository.findById(id);
    if (!repo) return res.status(404).json({ error: "Repository not found!" });
    if (String(repo.owner) !== req.userId) {
      return res.status(403).json({ error: "Only the owner can do this!" });
    }
    req.repo = repo;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// Only the owner of the repo an issue belongs to may modify/delete that issue
async function authorizeIssueOwner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID!" });
    }
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ error: "Issue not found!" });
    const repo = await Repository.findById(issue.repository);
    if (!repo || String(repo.owner) !== req.userId) {
      return res.status(403).json({ error: "Only the repository owner can do this!" });
    }
    req.issue = issue;
    req.repo = repo;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

module.exports = { authorizeSelf, authorizeRepoOwner, authorizeIssueOwner };
