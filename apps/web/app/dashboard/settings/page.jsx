"use client";
import { useState } from "react";
import { useAuthStore, useWorkspaceStore } from "../../../src/store/useStore";
import { api } from "../../../src/lib/api";
import toast, { Toaster } from "react-hot-toast";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "");
  const [workspaceDesc, setWorkspaceDesc] = useState(currentWorkspace?.description || "");
  const [accentColor, setAccentColor] = useState(currentWorkspace?.accentColor || "#254283");
  const [saving, setSaving] = useState(false);

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!currentWorkspace?.id) {
      toast.error("No workspace selected.");
      return;
    }
    setSaving(true);
    try {
      const data = await api.updateWorkspace(currentWorkspace.id, {
        name: workspaceName,
        description: workspaceDesc,
        accentColor,
      });
      setCurrentWorkspace(data.workspace);
      toast.success("Workspace updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update workspace.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const COLORS = [
    "#254283", "#6366f1", "#8b5cf6", "#ec4899",
    "#ef4444", "#f59e0b", "#10b981", "#14b8a6",
    "#3b82f6", "#06b6d4", "#84cc16", "#f97316",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your workspace and account preferences.</p>
      </div>

      {/* Workspace Settings */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-5">Workspace Settings</h2>

        {!currentWorkspace ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No workspace selected.</p>
            <a href="/dashboard" className="text-[#254283] text-sm font-medium hover:underline mt-2 inline-block">
              Go to Dashboard →
            </a>
          </div>
        ) : (
          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Workspace Name</label>
              <input
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#254283]/20"
                placeholder="My Workspace"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={workspaceDesc}
                onChange={e => setWorkspaceDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#254283]/20 resize-none"
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
                    onClick={() => setAccentColor(color)}
                    className={`w-8 h-8 rounded-xl transition-all ${accentColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-8 h-8 rounded-xl shadow-md" style={{ backgroundColor: accentColor }} />
                <span className="text-sm text-gray-500 font-mono">{accentColor}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#254283] hover:bg-[#1e3569] disabled:opacity-60 text-white rounded-full text-sm font-medium transition"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-5">Account</h2>
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-[#254283]/10 flex items-center justify-center">
            <span className="text-[#254283] text-lg font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name || "User"}</p>
            <p className="text-sm text-gray-400">{user?.email || ""}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <span className="text-xs px-3 py-1 bg-green-50 text-green-600 rounded-full font-medium">Verified</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Account Type</p>
              <p className="text-xs text-gray-400">Standard account</p>
            </div>
            <span className="text-xs px-3 py-1 bg-[#254283]/10 text-[#254283] rounded-full font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-400 mb-4">These actions are irreversible. Please be careful.</p>
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition"
        >
          Logout from TeamHub
        </button>
      </div>
    </div>
  );
}