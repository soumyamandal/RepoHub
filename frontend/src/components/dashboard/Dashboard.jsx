import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import api from "../../api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const fetchRepositories = async () => {
      try {
        const { data } = await api.get(`/repo/user/${userId}`);
        setRepositories(data.repositories || []);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        setRepositories([]);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const { data } = await api.get("/repo/all");
        // don't suggest the user's own repos
        setSuggestedRepositories(
          (data || []).filter((r) => String(r.owner?._id) !== userId)
        );
      } catch (error) {
        console.error("Error fetching suggested repositories:", error);
        setSuggestedRepositories([]);
      }
    };

    if (userId) fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  const filteredRepositories = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Manage your repositories and projects
            </p>
          </div>

          <button
            onClick={() => navigate("/create")}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium"
          >
            + New Repository
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Your Repositories</p>
            <h2 className="text-2xl font-bold mt-2">{repositories.length}</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Suggested</p>
            <h2 className="text-2xl font-bold mt-2">
              {suggestedRepositories.length}
            </h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Platform</p>
            <h2 className="text-2xl font-bold mt-2">RepoHub</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Repositories</h2>
              <input
                type="text"
                placeholder="Search repository..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              {filteredRepositories.length > 0 ? (
                filteredRepositories.map((repo) => (
                  <Link
                    to={`/repo/${repo._id}`}
                    key={repo._id}
                    className="block bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-blue-400">
                        {repo.name}
                      </h3>
                      <span className="text-xs border border-slate-700 text-slate-400 rounded-full px-2 py-0.5">
                        {repo.visibility ? "Public" : "Private"}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {repo.description || "No description"}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-400">
                    {repositories.length === 0
                      ? "You don't have any repositories yet."
                      : "No repositories match your search."}
                  </p>
                  {repositories.length === 0 && (
                    <Link
                      to="/create"
                      className="inline-block mt-3 text-blue-400 hover:underline"
                    >
                      Create your first repository
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Suggested Repositories</h2>
            <div className="space-y-3">
              {suggestedRepositories.length === 0 && (
                <p className="text-slate-500 text-sm">
                  No public repositories from other users yet.
                </p>
              )}
              {suggestedRepositories.map((repo) => (
                <Link
                  to={`/repo/${repo._id}`}
                  key={repo._id}
                  className="block bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4"
                >
                  <h3 className="font-semibold">{repo.name}</h3>
                  <p className="text-slate-500 text-xs">
                    by {repo.owner?.username || "unknown"}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {repo.description || "No description"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
