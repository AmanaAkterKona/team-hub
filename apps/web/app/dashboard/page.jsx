"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useWorkspaceStore } from "../../src/store/useStore";
import { api } from "../../src/lib/api";
import toast, { Toaster } from "react-hot-toast";

const COLORS = [
  "#254283", "#6366f1", "#8b5cf6", "#ec4899",
  "#ef4444", "#f59e0b", "#10b981", "#14b8a6",
  "#3b82f6", "#06b6d4", "#84cc16", "#f97316",
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { workspaces, setWorkspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", description: "", accentColor: "#254283" });
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
      setNewWorkspace({ name: "", description: "", accentColor: "#254283" });
      toast.success("Workspace created!");
      router.push(`/workspace/${data.workspace.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#254283]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <Toaster position="top-right" />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Title Row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Workspaces</h1>
            <p className="text-gray-400 text-sm mt-1">Select a workspace to get started</p>
          </div>
          <button
            onClick={() => setShowCreateWorkspace(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#254283] hover:bg-[#1e3569] text-white rounded-full text-sm font-medium transition shadow-md shadow-blue-900/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Workspace
          </button>
        </div>

        {/* Workspace Grid */}
        {workspaces.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
            <div className="w-16 h-16 bg-[#254283]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#254283]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No workspaces yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first workspace to get started</p>
            <button
              onClick={() => setShowCreateWorkspace(true)}
              className="px-6 py-2.5 bg-[#254283] hover:bg-[#1e3569] text-white rounded-full text-sm font-medium transition"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setCurrentWorkspace(ws);
                  router.push(`/workspace/${ws.id}`);
                }}
                className="text-left p-6 bg-white border border-gray-100 hover:border-[#254283]/30 hover:shadow-md rounded-2xl transition-all group shadow-sm"
              >
                <div
                  className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: ws.accentColor || "#254283" }}
                >
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-[#254283] transition mb-1">
                  {ws.name}
                </h3>
                {ws.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{ws.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {ws.members?.length || 0} members
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={2}/><circle cx="12" cy="12" r="6" strokeWidth={2}/><circle cx="12" cy="12" r="2" strokeWidth={2}/>
                    </svg>
                    {ws._count?.goals || 0} goals
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateWorkspace && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-5">Create Workspace</h2>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20"
                  placeholder="My Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20 resize-none"
                  rows={3}
                  placeholder="What is this workspace for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewWorkspace({ ...newWorkspace, accentColor: color })}
                      className={`w-8 h-8 rounded-xl transition-all ${newWorkspace.accentColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: newWorkspace.accentColor }} />
                  <span className="text-xs text-gray-400 font-mono">{newWorkspace.accentColor}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkspace(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-[#254283] hover:bg-[#1e3569] rounded-xl text-white font-medium text-sm transition disabled:opacity-50"
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