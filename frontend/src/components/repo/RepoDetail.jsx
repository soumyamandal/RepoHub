import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import IssueList from "../issue/IssueList";
import api from "../../api";
import CommitList from "./CommitList";
import FileViewer from "./FileViewer";

const RepoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [repo, setRepo] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("files");
  // const [newContent, setNewContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // { commitId, fileName }

  const [latestCommitFiles, setLatestCommitFiles] = useState(null);
 
  const loadRepo = useCallback(async () => {
    try {
      const { data } = await api.get(`/repo/${id}`);
      setRepo(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not load this repository.");
    }
  }, [id]);

  const loadLatestCommitFiles = useCallback(async () => {
  try {
    const { data } = await api.get(`/repo/${id}/commits`);
    if (data.length > 0) {
      // commits already newest-first from the backend
      setLatestCommitFiles({ commitId: data[0].commitId, files: data[0].files });
    } else {
      setLatestCommitFiles(null);
    }
  } catch (err) {
    setLatestCommitFiles(null);
  }
}, [id]);

  useEffect(() => {
    loadRepo();
    loadLatestCommitFiles();
  }, [loadRepo, loadLatestCommitFiles]);

  const isOwner = repo && String(repo.owner?._id) === userId;

  // const addContent = async (e) => {
  //   e.preventDefault();
  //   if (!newContent.trim()) return;
  //   try {
  //     await api.put(`/repo/update/${id}`, { content: newContent });
  //     setNewContent("");
  //     loadRepo();
  //   } catch (err) {
  //     alert(err.response?.data?.error || "Could not add the file.");
  //   }
  // };

  const toggleVisibility = async () => {
    try {
      await api.patch(`/repo/toggle/${id}`);
      loadRepo();
    } catch (err) {
      alert(err.response?.data?.error || "Could not change visibility.");
    }
  };

  const deleteRepo = async () => {
    if (!window.confirm(`Delete "${repo.name}" and all its issues? This cannot be undone.`)) return;
    try {
      await api.delete(`/repo/delete/${id}`);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.error || "Could not delete the repository.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <p className="max-w-3xl mx-auto px-6 py-10 text-slate-300">{error}</p>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <p className="max-w-3xl mx-auto px-6 py-10 text-slate-400">Loading...</p>
      </div>
    );
  }

  const openIssues = (repo.issues || []).filter((i) => i.status === "open").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                <span className="text-slate-400 font-normal">
                  {repo.owner?.username} /{" "}
                </span>
                {repo.name}
              </h1>
              <span className="text-xs border border-slate-700 text-slate-400 rounded-full px-2 py-0.5">
                {repo.visibility ? "Public" : "Private"}
              </span>
            </div>
            <p className="text-slate-400 mt-2">
              {repo.description || "No description"}
            </p>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={toggleVisibility}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm"
              >
                Make {repo.visibility ? "private" : "public"}
              </button>
              <button
                onClick={deleteRepo}
                className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-6 border-b border-slate-800 mt-8">
          {[
            ["files", `Files (${latestCommitFiles?.files?.length || 0})`],
            ["commits", "Commits"],
            ["issues", `Issues (${openIssues} open)`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 border-b-2 ${
                tab === key
                  ? "border-white text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "files" && (
  <section className="mt-6">
    {latestCommitFiles === null ? (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No commits pushed yet. Run <code className="text-slate-300">push</code> from the CLI to see files here.
      </div>
    ) : (
      <>
        <p className="text-slate-500 text-xs mb-3">
          Showing files from the latest commit ({latestCommitFiles.commitId})
        </p>
        <ul className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
          {latestCommitFiles.files.map((file) => (
            <li key={file}>
              <button
                onClick={() =>
                  setSelectedFile({ commitId: latestCommitFiles.commitId, fileName: file })
                }
                className="w-full text-left px-5 py-3 text-slate-200 hover:bg-slate-800"
              >
                {file}
              </button>
            </li>
          ))}
        </ul>

        {selectedFile && (
          <FileViewer
            repoId={id}
            commitId={selectedFile.commitId}
            fileName={selectedFile.fileName}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </>
    )}
  </section>
)}

        {tab === "issues" && (
          <IssueList
            repoId={id}
            isOwner={isOwner}
            issues={repo.issues || []}
            onChange={loadRepo}
          />
        )}

        {tab === "commits" && (
          <>
            <CommitList
              repoId={id}
              onSelectFile={(commitId, fileName) =>
              setSelectedFile({ commitId, fileName })
              }
            />
            {selectedFile && (
              <FileViewer
                repoId={id}
                commitId={selectedFile.commitId}
                fileName={selectedFile.fileName}
                onClose={() => setSelectedFile(null)}
             />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RepoDetail;
