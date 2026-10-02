const express = require("express");
const repoController = require("../controllers/repoController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRepoOwner } = require("../middleware/authorizeMiddleware");
const commitController = require("../controllers/commitController");

const repoRouter = express.Router();

repoRouter.use("/repo", authMiddleware);

// NOTE: fixed paths (/all, /name/:name, /user/:userID) must come before /repo/:id
repoRouter.post("/repo/create", repoController.createRepository);
repoRouter.get("/repo/all", repoController.getAllRepositories);
repoRouter.get("/repo/name/:name", repoController.fetchRepositoryByName);
repoRouter.get("/repo/user/:userID", repoController.fetchRepositoriesForCurrentUser);
repoRouter.get("/repo/:id", repoController.fetchRepositoryById);
repoRouter.get("/repo/:id/commits", commitController.getCommits);
repoRouter.get("/repo/:id/file", commitController.getFileContent);
repoRouter.put("/repo/update/:id", authorizeRepoOwner, repoController.updateRepositoryById);
repoRouter.delete("/repo/delete/:id", authorizeRepoOwner, repoController.deleteRepositoryById);
repoRouter.patch("/repo/toggle/:id", authorizeRepoOwner, repoController.toggleVisibilityById);

module.exports = repoRouter;
