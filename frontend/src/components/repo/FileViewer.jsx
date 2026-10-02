import React, { useEffect, useState } from "react";
import api from "../../api";

const FileViewer = ({ repoId, commitId, fileName, onClose }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/repo/${repoId}/file`, {
          params: { commit: commitId, name: fileName },
        });
        setContent(data.content);
      } catch (err) {
        setError(err.response?.data?.error || "Could not load this file.");
      } finally {
        setLoading(false);
      }
    };
    loadFile();
  }, [repoId, commitId, fileName]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl mt-4">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <p className="font-mono text-sm text-slate-300">{fileName}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
          Close
        </button>
      </div>

      <div className="p-5 overflow-x-auto">
        {loading && <p className="text-slate-400">Loading...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && (
          <pre className="text-sm text-slate-200 whitespace-pre-wrap">{content}</pre>
        )}
      </div>
    </div>
  );
};

export default FileViewer;