const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const Issue = require("../models/issueModel");

// POST /issue/create   body: { title, description, repository }
async function createIssue(req, res) {
  const { title, description, repository } = req.body;

  try {
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required!" });
    }
    if (!mongoose.Types.ObjectId.isValid(repository)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repo = await Repository.findById(repository);
    if (!repo) return res.status(404).json({ error: "Repository not found!" });

    const issue = await Issue.create({ title, description, repository });
    repo.issues.push(issue._id);
    await repo.save();

    res.status(201).json(issue);
  } catch (err) {
    console.error("Error during issue creation : ", err.message);
    res.status(500).send("Server error");
  }
}

// PUT /issue/update/:id
async function updateIssueById(req, res) {
  const { title, description, status } = req.body;

  try {
    const issue = req.issue; // loaded + ownership checked by middleware

    if (title !== undefined) issue.title = title;
    if (description !== undefined) issue.description = description;
    if (status !== undefined) issue.status = status;

    await issue.save();
    res.json({ message: "Issue updated", issue });
  } catch (err) {
    console.error("Error during issue updation : ", err.message);
    res.status(500).send("Server error");
  }
}

// DELETE /issue/delete/:id
async function deleteIssueById(req, res) {
  try {
    const issue = req.issue;
    await Repository.findByIdAndUpdate(issue.repository, {
      $pull: { issues: issue._id },
    });
    await issue.deleteOne();

    res.json({ message: "Issue deleted" });
  } catch (err) {
    console.error("Error during issue deletion : ", err.message);
    res.status(500).send("Server error");
  }
}

// GET /issue/all?repository=<repoId>   (all issues if no repository given)
async function getAllIssues(req, res) {
  const { repository } = req.query;

  try {
    const filter = {};
    if (repository) {
      if (!mongoose.Types.ObjectId.isValid(repository)) {
        return res.status(400).json({ error: "Invalid repository ID!" });
      }
      filter.repository = repository;
    }

    const issues = await Issue.find(filter).sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (err) {
    console.error("Error during issue fetching : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getIssueById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid issue ID!" });
  }

  try {
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found!" });
    }
    res.json(issue);
  } catch (err) {
    console.error("Error during issue fetching : ", err.message);
    res.status(500).send("Server error");
  }
}

module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
};
