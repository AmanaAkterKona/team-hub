"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore, useWorkspaceStore, useGoalStore, useActionStore, useAnnouncementStore } from "../../../src/store/useStore";
import { api } from "../../../src/lib/api";
import { connectSocket, disconnectSocket } from "../../../src/lib/socket";
import toast, { Toaster } from "react-hot-toast";

const TABS = ["Overview", "Goals", "Actions", "Announcements", "Analytics", "Audit Log"];

export default function WorkspacePage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, setUser } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace, onlineMembers, setOnlineMembers } = useWorkspaceStore();
  const { goals, setGoals, updateGoalStatus } = useGoalStore();
  const { items, setItems, updateItemStatus } = useActionStore();
  const { announcements, setAnnouncements, addAnnouncement, addComment } = useAnnouncementStore();
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", dueDate: "" });
  const [newItem, setNewItem] = useState({ title: "", priority: "MEDIUM", dueDate: "" });
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [commentText, setCommentText] = useState({});
  const [viewMode, setViewMode] = useState("kanban");

  useEffect(() => {
    const init = async () => {
      try {
        const meData = await api.me();
        setUser(meData.user);
        const wsData = await api.getWorkspace(id);
        setCurrentWorkspace(wsData.workspace);
        const member = wsData.workspace.members.find(m => m.user.id === meData.user.id);
        if (member) setMemberRole(member.role);
        const [goalsData, itemsData, announcementsData, analyticsData] = await Promise.all([
          api.getGoals(id),
          api.getActionItems(id),
          api.getAnnouncements(id),
          api.getAnalytics(id),
        ]);
        setGoals(goalsData.goals);
        setItems(itemsData.items);
        setAnnouncements(announcementsData.announcements);
        setAnalytics(analyticsData);
        const socket = connectSocket(id, meData.user.id);
        socket.on("online:members", (members) => setOnlineMembers(members));
        socket.on("new:announcement", (a) => addAnnouncement(a));
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => disconnectSocket();
  }, [id]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const data = await api.createGoal({ ...newGoal, workspaceId: id });
      setGoals([data.goal, ...goals]);
      setShowNewGoal(false);
      setNewGoal({ title: "", description: "", dueDate: "" });
      toast.success("Goal created!");
    } catch (err) { toast.error(err.message); }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const data = await api.createActionItem({ ...newItem, workspaceId: id });
      setItems([data.item, ...items]);
      setShowNewItem(false);
      setNewItem({ title: "", priority: "MEDIUM", dueDate: "" });
      toast.success("Action item created!");
    } catch (err) { toast.error(err.message); }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const data = await api.createAnnouncement({ content: newAnnouncement, workspaceId: id });
      setAnnouncements([data.announcement, ...announcements]);
      setShowNewAnnouncement(false);
      setNewAnnouncement("");
      toast.success("Announcement posted!");
    } catch (err) { toast.error(err.message); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.inviteMember(id, { email: inviteEmail, role: "MEMBER" });
      setShowInvite(false);
      setInviteEmail("");
      toast.success("Member invited!");
    } catch (err) { toast.error(err.message); }
  };

  const handleComment = async (announcementId) => {
    if (!commentText[announcementId]) return;
    try {
      const data = await api.addComment(announcementId, { content: commentText[announcementId] });
      addComment(announcementId, data.comment);
      setCommentText({ ...commentText, [announcementId]: "" });
    } catch (err) { toast.error(err.message); }
  };

  const handleReact = async (announcementId, emoji) => {
    try {
      const data = await api.reactToAnnouncement(announcementId, { emoji });
      setAnnouncements(announcements.map(a => a.id === announcementId ? data.announcement : a));
    } catch (err) { toast.error(err.message); }
  };

  const handlePin = async (announcementId) => {
    try {
      const data = await api.pinAnnouncement(announcementId);
      setAnnouncements(announcements.map(a => a.id === announcementId ? data.announcement : a));
    } catch (err) { toast.error(err.message); }
  };

  const handleExportCSV = () => {
    window.open(api.exportCSV(id), "_blank");
  };

  const loadAuditLogs = async () => {
    try {
      const data = await api.getAuditLog(id);
      setAuditLogs(data.logs);
    } catch (err) { toast.error(err.message); }
  };

  useEffect(() => {
    if (activeTab === "Audit Log") loadAuditLogs();
  }, [activeTab]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );

  const todoItems = items.filter(i => i.status === "TODO");
  const inProgressItems = items.filter(i => i.status === "IN_PROGRESS");
  const doneItems = items.filter(i => i.status === "DONE");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: currentWorkspace?.accentColor || "#6366f1" }}>
              {currentWorkspace?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold">{currentWorkspace?.name}</h1>
              <p className="text-xs text-gray-400">{currentWorkspace?.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">{onlineMembers.length} online</span>
          </div>
          {memberRole === "ADMIN" && (
            <button onClick={() => setShowInvite(true)}
              className="px-3 py-1.5 text-sm border border-gray-700 rounded-lg hover:border-gray-500 transition">
              + Invite
            </button>
          )}
          <button onClick={() => useAuthStore.getState().logout().then(() => router.push("/auth/login"))}
            className="text-sm text-gray-400 hover:text-white transition">Logout</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Goals", value: analytics?.totalGoals || 0, color: "text-indigo-400" },
                { label: "Completed This Week", value: analytics?.completedThisWeek || 0, color: "text-green-400" },
                { label: "Overdue Items", value: analytics?.overdueItems || 0, color: "text-red-400" },
                { label: "Members", value: analytics?.totalMembers || 0, color: "text-blue-400" },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Team Members</h3>
              <div className="space-y-3">
                {currentWorkspace?.members?.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.user.name}</p>
                        <p className="text-xs text-gray-400">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onlineMembers.includes(member.user.id) && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === "ADMIN"
                        ? "bg-indigo-900 text-indigo-300" : "bg-gray-800 text-gray-400"}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GOALS */}
        {activeTab === "Goals" && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Goals</h2>
              <button onClick={() => setShowNewGoal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
                + New Goal
              </button>
            </div>
            <div className="space-y-3">
              {goals.map(goal => (
                <div key={goal.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      {goal.description && <p className="text-sm text-gray-400 mt-1">{goal.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Owner: {goal.owner?.name}</span>
                        {goal.dueDate && <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <select value={goal.status} onChange={(e) => updateGoalStatus(goal.id, e.target.value)}
                      className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white">
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  {goal.milestones?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {goal.milestones.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${m.progress}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-400">{m.title} {m.progress}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {goals.length === 0 && <div className="text-center py-12 text-gray-500">No goals yet.</div>}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        {activeTab === "Actions" && (
          <div>
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Action Items</h2>
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button onClick={() => setViewMode("kanban")}
                    className={`px-3 py-1 text-xs rounded-md transition ${viewMode === "kanban" ? "bg-gray-700 text-white" : "text-gray-400"}`}>
                    Kanban
                  </button>
                  <button onClick={() => setViewMode("list")}
                    className={`px-3 py-1 text-xs rounded-md transition ${viewMode === "list" ? "bg-gray-700 text-white" : "text-gray-400"}`}>
                    List
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportCSV}
                  className="px-3 py-2 border border-gray-700 rounded-xl text-sm hover:border-gray-500 transition">
                  Export CSV
                </button>
                <button onClick={() => setShowNewItem(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
                  + New Item
                </button>
              </div>
            </div>

            {viewMode === "kanban" ? (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "To Do", items: todoItems, status: "TODO", color: "border-gray-600" },
                  { label: "In Progress", items: inProgressItems, status: "IN_PROGRESS", color: "border-yellow-600" },
                  { label: "Done", items: doneItems, status: "DONE", color: "border-green-600" },
                ].map(col => (
                  <div key={col.status} className={`bg-gray-900 border ${col.color} rounded-xl p-4`}>
                    <h3 className="font-medium text-sm mb-3 flex items-center justify-between">
                      {col.label}
                      <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{col.items.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {col.items.map(item => (
                        <div key={item.id} className="bg-gray-800 rounded-lg p-3">
                          <p className="text-sm font-medium">{item.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.priority === "HIGH" ? "bg-red-900 text-red-300" :
                              item.priority === "MEDIUM" ? "bg-yellow-900 text-yellow-300" :
                              "bg-green-900 text-green-300"}`}>
                              {item.priority}
                            </span>
                            <div className="flex gap-1">
                              {col.status !== "TODO" && (
                                <button onClick={() => updateItemStatus(item.id, "TODO")}
                                  className="text-xs text-gray-400 hover:text-white px-1">←</button>
                              )}
                              {col.status !== "DONE" && (
                                <button onClick={() => updateItemStatus(item.id, col.status === "TODO" ? "IN_PROGRESS" : "DONE")}
                                  className="text-xs text-gray-400 hover:text-white px-1">→</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{item.priority}</span>
                        {item.assignee && <span>→ {item.assignee.name}</span>}
                        {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <select value={item.status} onChange={(e) => updateItemStatus(item.id, e.target.value)}
                      className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white">
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                ))}
                {items.length === 0 && <div className="text-center py-12 text-gray-500">No action items yet.</div>}
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === "Announcements" && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Announcements</h2>
              {memberRole === "ADMIN" && (
                <button onClick={() => setShowNewAnnouncement(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition">
                  + Post Announcement
                </button>
              )}
            </div>
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className={`bg-gray-900 border rounded-xl p-5 ${a.isPinned ? "border-indigo-500" : "border-gray-800"}`}>
                  {a.isPinned && <span className="text-xs text-indigo-400 font-medium mb-2 block">Pinned</span>}
                  <p className="text-sm leading-relaxed">{a.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {["👍", "❤️", "🎉", "🚀"].map(emoji => (
                        <button key={emoji} onClick={() => handleReact(a.id, emoji)}
                          className="text-lg hover:scale-125 transition-transform">
                          {emoji}
                          {a.reactions?.[emoji]?.length > 0 && (
                            <span className="text-xs text-gray-400 ml-0.5">{a.reactions[emoji].length}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {memberRole === "ADMIN" && (
                      <button onClick={() => handlePin(a.id)} className="text-xs text-gray-400 hover:text-white transition">
                        {a.isPinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {a.comments?.map(c => (
                      <div key={c.id} className="bg-gray-800 rounded-lg p-3 text-sm">
                        <span className="font-medium text-indigo-400">{c.author?.name}: </span>{c.content}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input value={commentText[a.id] || ""} onChange={(e) => setCommentText({ ...commentText, [a.id]: e.target.value })}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Add a comment..." />
                      <button onClick={() => handleComment(a.id)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition">Send</button>
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && <div className="text-center py-12 text-gray-500">No announcements yet.</div>}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "Analytics" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Goals", value: analytics?.totalGoals || 0, color: "bg-indigo-500" },
                { label: "Completed This Week", value: analytics?.completedThisWeek || 0, color: "bg-green-500" },
                { label: "Overdue Items", value: analytics?.overdueItems || 0, color: "bg-red-500" },
                { label: "Total Members", value: analytics?.totalMembers || 0, color: "bg-blue-500" },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className={`w-10 h-10 ${stat.color} rounded-xl mb-3`}></div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Goals by Status</h3>
              <div className="space-y-3">
                {analytics?.goalsByStatus?.map(s => (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-28">{s.status.replace("_", " ")}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${analytics.totalGoals ? (s._count / analytics.totalGoals) * 100 : 0}%` }}>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{s._count}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-700 rounded-xl text-sm hover:border-gray-500 transition">
              Export Workspace Data as CSV
            </button>
          </div>
        )}

        {/* AUDIT LOG */}
        {activeTab === "Audit Log" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Audit Log</h2>
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {log.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{log.user?.name}</span>{" "}
                      <span className="text-gray-400">{log.action.toLowerCase()}d</span>{" "}
                      <span className="text-indigo-400">{log.entity}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    log.action === "CREATE" ? "bg-green-900 text-green-300" :
                    log.action === "DELETE" ? "bg-red-900 text-red-300" :
                    "bg-gray-800 text-gray-400"}`}>
                    {log.action}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && <div className="text-center py-12 text-gray-500">No audit logs yet.</div>}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showNewGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <input required value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Goal title" />
              <textarea value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3} placeholder="Description (optional)" />
              <input type="date" value={newGoal.dueDate} onChange={e => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewGoal(false)}
                  className="flex-1 py-2 border border-gray-700 rounded-xl text-gray-400 text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Action Item</h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <input required value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Item title" />
              <select value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
              <input type="date" value={newItem.dueDate} onChange={e => setNewItem({ ...newItem, dueDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewItem(false)}
                  className="flex-1 py-2 border border-gray-700 rounded-xl text-gray-400 text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewAnnouncement && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Post Announcement</h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <textarea required value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={5} placeholder="Write your announcement..." />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewAnnouncement(false)}
                  className="flex-1 py-2 border border-gray-700 rounded-xl text-gray-400 text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Invite Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="member@email.com" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvite(false)}
                  className="flex-1 py-2 border border-gray-700 rounded-xl text-gray-400 text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm">Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}