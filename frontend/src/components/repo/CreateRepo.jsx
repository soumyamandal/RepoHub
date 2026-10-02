import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import api from "../../api";

const CreateRepo = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Give your repository a name.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/repo/create", {
        name: name.trim(),
        description,
        visibility,
      });
      navigate(`/repo/${data.repositoryID}`);
    } catch (err) {
      setError(err.response?.data?.error || "Could not create the repository.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">Create a new repository</h1>
        <p className="text-slate-400 mt-1 mb-8">
          A repository holds your project's files and issues.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
        >
          <div>
            <label htmlFor="repo-name" className="block text-sm font-medium mb-1.5">
              Repository name
            </label>
            <input
              id="repo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="repo-desc" className="block text-sm font-medium mb-1.5">
              Description (optional)
            </label>
            <textarea
              id="repo-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-1.5">Visibility</legend>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={visibility}
                onChange={() => setVisibility(true)}
                className="mt-1"
              />
              <span>
                Public
                <span className="block text-sm text-slate-400">
                  Anyone on RepoHub can see this repository.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={!visibility}
                onChange={() => setVisibility(false)}
                className="mt-1"
              />
              <span>
                Private
                <span className="block text-sm text-slate-400">
                  Only you can see this repository.
                </span>
              </span>
            </label>
          </fieldset>

          {error && (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2.5 rounded-lg font-medium"
            >
              {loading ? "Creating..." : "Create repository"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateRepo;
