import React, { useState } from "react";
import api from "../../api";

const IssueList = ({ repoId, isOwner, issues, onChange }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const createIssue = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    try {
      setSaving(true);
      await api.post("/issue/create", {
        title: title.trim(),
        description: description.trim(),
        repository: repoId,
      });
      setTitle("");
      setDescription("");
      onChange();
    } catch (err) {
      alert(err.response?.data?.error || "Could not create the issue.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (issue, status) => {
    try {
      await api.put(`/issue/update/${issue._id}`, { status });
      onChange();
    } catch (err) {
      alert(err.response?.data?.error || "Could not update the issue.");
    }
  };

  const removeIssue = async (issue) => {
    if (!window.confirm(`Delete issue "${issue.title}"?`)) return;
    try {
      await api.delete(`/issue/delete/${issue._id}`);
      onChange();
    } catch (err) {
      alert(err.response?.data?.error || "Could not delete the issue.");
    }
  };

  return (
    <section className="mt-6">
      <form
        onSubmit={createIssue}
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 mb-6"
      >
        <h2 className="font-semibold">Open a new issue</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          aria-label="Issue title"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500"
        />
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's the problem?"
          aria-label="Issue description"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500"
        />
        <div className="flex justify-end">
          <button
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2 rounded-lg font-medium"
          >
            {saving ? "Opening..." : "Open issue"}
          </button>
        </div>
      </form>

      {issues.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          No issues yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => (
            <li
              key={issue._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{issue.title}</h3>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 border ${
                        issue.status === "open"
                          ? "border-green-500/40 text-green-400"
                          : "border-purple-500/40 text-purple-400"
                      }`}
                    >
                      {issue.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{issue.description}</p>
                </div>

                {isOwner && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setStatus(issue, issue.status === "open" ? "closed" : "open")
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm"
                    >
                      {issue.status === "open" ? "Close" : "Reopen"}
                    </button>
                    <button
                      onClick={() => removeIssue(issue)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default IssueList;
