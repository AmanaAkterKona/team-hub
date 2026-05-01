"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useWorkspaceStore } from "../../src/store/useStore";
import { api } from "../../src/lib/api";
import toast, { Toaster } from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { workspaces, setWorkspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "", accentColor: "#6366f1" });
  const [creating, setCreating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.me();
        setUser(data.user);
        const wsData = await api.getWorkspaces();
        setWorkspaces(wsData.workspaces);
        if (wsData.workspaces.length > 0 && !currentWorkspace) {
          setCurrentWorkspace(wsData.workspaces[0]);
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data = await api.createWorkspace(newWorkspace);
      setWorkspaces([...workspaces, data.workspace]);
      setCurrentWorkspace(data.workspace);
      setShowCreateWorkspace(false);
      setNewWorkspace({ name: "", description: "", accentColor: "#6366f1" });
      toast.success("Workspace created!");
      router.push(`/workspace/${data.workspace.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    router.push("/auth/login");
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-bold text-lg">Team Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Welcome, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Workspaces</h1>
            <p className="text-gray-400 mt-1">Select a workspace to get started</p>
          </div>
          <button
            onClick={() => setShowCreateWorkspace(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Workspace
          </button>
        </div>

        {/* Workspace Grid */}
        {workspaces.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No workspaces yet</h3>
            <p className="text-gray-500 mb-6">Create your first workspace to get started</p>
            <button
              onClick={() => setShowCreateWorkspace(true)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.id}`)}
                className="text-left p-6 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl transition group"
              >
                <div
                  className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: ws.accentColor }}
                >
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-white group-hover:text-indigo-400 transition mb-1">
                  {ws.name}
                </h3>
                {ws.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{ws.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{ws.members?.length || 0} members</span>
                  <span>•</span>
                  <span>{ws._count?.goals || 0} goals</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateWorkspace && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5">Create Workspace</h2>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Team"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="What is this workspace for?"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newWorkspace.accentColor}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-gray-400 text-sm">{newWorkspace.accentColor}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkspace(false)}
                  className="flex-1 py-2 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition text-sm disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}