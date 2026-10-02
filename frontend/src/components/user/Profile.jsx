import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { BookIcon, RepoIcon } from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../authContext";
import api from "../../api";

const Profile = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const [userDetails, setUserDetails] = useState({ username: "username" });
  const [repositories, setRepositories] = useState([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const load = async () => {
      try {
        const [profile, repos] = await Promise.all([
          api.get(`/userProfile/${userId}`),
          api.get(`/repo/user/${userId}`),
        ]);
        setUserDetails(profile.data);
        setRepositories(repos.data.repositories || []);
      } catch (err) {
        console.error("Cannot fetch profile:", err);
      }
    };

    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    navigate("/auth");
  };

  const tabClass = (key) =>
    `flex items-center gap-2 py-4 border-b-2 ${
      tab === key
        ? "border-white text-white"
        : "border-transparent text-slate-400 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <button onClick={() => setTab("overview")} className={tabClass("overview")}>
              <BookIcon size={16} />
              Overview
            </button>
            <button onClick={() => setTab("repos")} className={tabClass("repos")}>
              <RepoIcon size={16} />
              Repositories ({repositories.length})
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 self-start">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold mb-4">
                {userDetails.username?.charAt(0).toUpperCase()}
              </div>

              <h1 className="text-2xl font-bold">{userDetails.username}</h1>
              <p className="text-slate-400 mt-1">{userDetails.email}</p>

              <div className="flex justify-center gap-8 mt-6 text-sm">
                <div>
                  <p className="font-bold text-lg">{repositories.length}</p>
                  <p className="text-slate-400">Repositories</p>
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {userDetails.followedUsers?.length || 0}
                  </p>
                  <p className="text-slate-400">Following</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {tab === "overview" ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">Contribution activity</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Days you created or updated a repository, over the last year
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <HeatMapProfile repositories={repositories} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {repositories.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                    No repositories yet.{" "}
                    <Link to="/create" className="text-blue-400 hover:underline">
                      Create one
                    </Link>
                  </div>
                ) : (
                  repositories.map((repo) => (
                    <Link
                      key={repo._id}
                      to={`/repo/${repo._id}`}
                      className="block bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5"
                    >
                      <h3 className="text-lg font-semibold text-blue-400">{repo.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        {repo.description || "No description"}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};
export default Profile;
