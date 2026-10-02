const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

async function createRepository(req, res) {
  const { name, content, description, visibility } = req.body;
  const owner = req.userId; // taken from the JWT, not from the request body

  try {
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Repository name is required!" });
    }

    const newRepository = new Repository({
      name: name.trim(),
      description,
      visibility: visibility === undefined ? true : visibility,
      owner,
      content: Array.isArray(content) ? content : [],
      issues: [],
    });

    const result = await newRepository.save();
    await User.findByIdAndUpdate(owner, { $push: { repositories: result._id } });

    res.status(201).json({
      message: "Repository created!",
      repositoryID: result._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "A repository with this name already exists!" });
    }
    console.error("Error during repository creation : ", err.message);
    res.status(500).send("Server error");
  }
}

// Public repositories only (used for "Suggested" on the dashboard)
async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({ visibility: true })
      .populate("owner", "username")
      .populate("issues");

    res.json(repositories);
  } catch (err) {
    console.error("Error during fetching repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

function canView(repo, userId) {
  const ownerId = repo.owner?._id ? String(repo.owner._id) : String(repo.owner);
  return repo.visibility || ownerId === userId;
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid repository ID!" });
  }

  try {
    const repository = await Repository.findById(id)
      .populate("owner", "username")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }
    if (!canView(repository, req.userId)) {
      return res.status(403).json({ error: "This repository is private!" });
    }

    res.json(repository);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;
  try {
    const repository = await Repository.findOne({ name })
      .populate("owner", "username")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }
    if (!canView(repository, req.userId)) {
      return res.status(403).json({ error: "This repository is private!" });
    }

    res.json(repository);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  const { userID } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ error: "Invalid user ID!" });
  }

  try {
    // Other users only see this user's public repos
    const filter = { owner: userID };
    if (userID !== req.userId) filter.visibility = true;

    const repositories = await Repository.find(filter).sort({ updatedAt: -1 });

    res.json({ message: "Repositories found!", repositories });
  } catch (err) {
    console.error("Error during fetching user repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

async function updateRepositoryById(req, res) {
  const { content, description } = req.body;

  try {
    const repository = req.repo; // loaded + ownership checked by middleware

    if (typeof content === "string" && content.trim()) {
      repository.content.push(content.trim());
    }
    if (description !== undefined) repository.description = description;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during updating repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleVisibilityById(req, res) {
  try {
    const repository = req.repo;
    repository.visibility = !repository.visibility;
    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility : ", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteRepositoryById(req, res) {
  try {
    const repository = req.repo;

    await Issue.deleteMany({ repository: repository._id });
    await User.findByIdAndUpdate(repository.owner, {
      $pull: { repositories: repository._id },
    });
    await repository.deleteOne();

    res.json({ message: "Repository deleted successfully!" });
  } catch (err) {
    console.error("Error during deleting repository : ", err.message);
    res.status(500).send("Server error");
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
};
