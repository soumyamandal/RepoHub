const express = require("express");
const issueController = require("../controllers/issueController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeIssueOwner } = require("../middleware/authorizeMiddleware");

const issueRouter = express.Router();

issueRouter.use("/issue", authMiddleware);

issueRouter.post("/issue/create", issueController.createIssue);
issueRouter.get("/issue/all", issueController.getAllIssues);
issueRouter.get("/issue/:id", issueController.getIssueById);
issueRouter.put("/issue/update/:id", authorizeIssueOwner, issueController.updateIssueById);
issueRouter.delete("/issue/delete/:id", authorizeIssueOwner, issueController.deleteIssueById);

module.exports = issueRouter;
