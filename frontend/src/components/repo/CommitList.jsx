import React, { useEffect, useState } from "react";
import api from "../../api";

const CommitList = ({ repoId, onSelectFile }) => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCommit, setOpenCommit] = useState(null);

  useEffect(() => {
    const loadCommits = async () => {
      try {
        const { data } = await api.get(`/repo/${repoId}/commits`);
        setCommits(data);
      } catch (err) {
        setError(err.response?.data?.error || "Could not load commits.");
      } finally {
        setLoading(false);
      }
    };
    loadCommits();
  }, [repoId]);

  if (loading) return <p className="text-slate-400 mt-6">Loading commits...</p>;
  if (error) return <p className="text-red-400 mt-6">{error}</p>;

  if (commits.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 mt-6">
        No commits pushed yet. Run <code className="text-slate-300">push</code> from the CLI.
      </div>
    );
  }

  return (
    <ul className="space-y-3 mt-6">
      {commits.map((c) => (
        <li
          key={c.commitId}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5"
        >
          <button
            onClick={() => setOpenCommit(openCommit === c.commitId ? null : c.commitId)}
            className="w-full text-left"
          >
            <p className="font-semibold">{c.message || "No commit message"}</p>
            <p className="text-slate-500 text-xs mt-1">
              {c.commitId} · {c.date ? new Date(c.date).toLocaleString() : "unknown date"}
            </p>
          </button>

          {openCommit === c.commitId && (
            <ul className="mt-3 border-t border-slate-800 pt-3 space-y-1">
              {c.files.map((file) => (
                <li key={file}>
                  <button
                    onClick={() => onSelectFile(c.commitId, file)}
                    className="text-blue-400 hover:underline text-sm"
                  >
                    {file}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

export default CommitList;