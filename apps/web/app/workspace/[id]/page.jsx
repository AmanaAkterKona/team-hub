"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuthStore, useWorkspaceStore, useGoalStore, useActionStore, useAnnouncementStore } from "../../../src/store/useStore";
import { api } from "../../../src/lib/api";
import { connectSocket, disconnectSocket } from "../../../src/lib/socket";
import toast, { Toaster } from "react-hot-toast";
import DashboardLayout from "../../dashboard/layout";

const TABS = ["Overview", "Goals", "Actions", "Announcements", "Analytics", "Audit Log"];

const TAB_MAP = {
  goals: "Goals",
  kanban: "Actions",
  announcements: "Announcements",
  analytics: "Analytics",
  team: "Overview",
};

export default function WorkspacePage() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { user, setUser } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace, onlineMembers, setOnlineMembers } = useWorkspaceStore();
  const { goals, setGoals, updateGoalStatus } = useGoalStore();
  const { items, setItems } = useActionStore();
  const safeItems = Array.isArray(items) ? items : [];
  const { announcements, setAnnouncements, addAnnouncement, addComment } = useAnnouncementStore();

  const [activeTab, setActiveTab] = useState(TAB_MAP[tabParam] || "Overview");
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

  // tabParam change হলে activeTab update করো
  useEffect(() => {
    if (tabParam && TAB_MAP[tabParam]) {
      setActiveTab(TAB_MAP[tabParam]);
    }
  }, [tabParam]);

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
      setItems([data.item, ...safeItems]);
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

  const handleStatusUpdate = async (itemId, newStatus) => {
    const updated = safeItems.map(i => i.id === itemId ? { ...i, status: newStatus } : i);
    setItems(updated);
    try {
      await api.updateActionItem(itemId, { status: newStatus });
      toast.success("Status updated!");
    } catch (err) {
      const data = await api.getActionItems(id);
      setItems(Array.isArray(data.items) ? data.items : []);
      toast.error("Failed to update status.");
    }
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
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#254283]"></div>
      </div>
    </DashboardLayout>
  );

  const todoItems = safeItems.filter(i => i.status === "TODO");
  const inProgressItems = safeItems.filter(i => i.status === "IN_PROGRESS");
  const doneItems = safeItems.filter(i => i.status === "DONE");

  return (
    <DashboardLayout>
      <Toaster position="top-right" />

      {/* Workspace Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: currentWorkspace?.accentColor || "#254283" }}
          >
            {currentWorkspace?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{currentWorkspace?.name}</h1>
            <p className="text-xs text-gray-400">{currentWorkspace?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">{onlineMembers.length} online</span>
          </div>
          {memberRole === "ADMIN" && (
            <button
              onClick={() => setShowInvite(true)}
              className="px-4 py-2 text-sm bg-[#254283] text-white rounded-full hover:bg-[#1e3569] transition font-medium"
            >
              + Invite
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === tab
                ? "bg-[#254283] text-white shadow-md"
                : "text-gray-500 hover:text-[#254283] hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>

        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Goals", value: analytics?.totalGoals || 0, color: "text-[#254283]", bg: "bg-[#254283]/10" },
                { label: "Completed This Week", value: analytics?.completedThisWeek || 0, color: "text-green-600", bg: "bg-green-50" },
                { label: "Overdue Items", value: analytics?.overdueItems || 0, color: "text-red-500", bg: "bg-red-50" },
                { label: "Members", value: analytics?.totalMembers || 0, color: "text-blue-600", bg: "bg-blue-50" },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Team Members</h3>
              <div className="space-y-3">
                {currentWorkspace?.members?.map(member => (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#254283]/10 rounded-xl flex items-center justify-center text-sm font-bold text-[#254283]">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{member.user.name}</p>
                        <p className="text-xs text-gray-400">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onlineMembers.includes(member.user.id) && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        member.role === "ADMIN" ? "bg-[#254283]/10 text-[#254283]" : "bg-gray-100 text-gray-500"
                      }`}>
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
              <h2 className="text-xl font-bold text-gray-800">Goals</h2>
              <button onClick={() => setShowNewGoal(true)}
                className="px-4 py-2 bg-[#254283] hover:bg-[#1e3569] text-white rounded-full text-sm font-medium transition">
                + New Goal
              </button>
            </div>
            <div className="space-y-3">
              {goals.map(goal => (
                <div key={goal.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{goal.title}</h3>
                      {goal.description && <p className="text-sm text-gray-400 mt-1">{goal.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>Owner: {goal.owner?.name}</span>
                        {goal.dueDate && <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <select value={goal.status} onChange={(e) => updateGoalStatus(goal.id, e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#254283]/20">
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  {goal.milestones?.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {goal.milestones.map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#254283] h-1.5 rounded-full transition-all" style={{ width: `${m.progress}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-400">{m.title} {m.progress}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {goals.length === 0 && (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">No goals yet. Create your first goal!</div>
              )}
            </div>
          </div>
        )}

        {/* ACTIONS / KANBAN */}
        {activeTab === "Actions" && (
          <div>
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">Action Items</h2>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button onClick={() => setViewMode("kanban")}
                    className={`px-3 py-1 text-xs rounded-lg transition font-medium ${viewMode === "kanban" ? "bg-white text-[#254283] shadow-sm" : "text-gray-400"}`}>
                    Kanban
                  </button>
                  <button onClick={() => setViewMode("list")}
                    className={`px-3 py-1 text-xs rounded-lg transition font-medium ${viewMode === "list" ? "bg-white text-[#254283] shadow-sm" : "text-gray-400"}`}>
                    List
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportCSV}
                  className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#254283] hover:text-[#254283] transition">
                  Export CSV
                </button>
                <button onClick={() => setShowNewItem(true)}
                  className="px-4 py-2 bg-[#254283] hover:bg-[#1e3569] text-white rounded-full text-sm font-medium transition">
                  + New Item
                </button>
              </div>
            </div>

            {viewMode === "kanban" ? (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "To Do", items: todoItems, status: "TODO", accent: "border-t-gray-300" },
                  { label: "In Progress", items: inProgressItems, status: "IN_PROGRESS", accent: "border-t-yellow-400" },
                  { label: "Done", items: doneItems, status: "DONE", accent: "border-t-green-400" },
                ].map(col => (
                  <div key={col.status} className={`bg-white border border-gray-100 border-t-4 ${col.accent} rounded-2xl p-4 shadow-sm`}>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center justify-between">
                      {col.label}
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{col.items.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {col.items.map(item => (
                        <div key={item.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-sm font-medium text-gray-800">{item.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.priority === "HIGH" ? "bg-red-100 text-red-600" :
                              item.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-600"}`}>
                              {item.priority}
                            </span>
                            <div className="flex gap-1">
                              {col.status === "IN_PROGRESS" && (
                                <button onClick={() => handleStatusUpdate(item.id, "TODO")}
                                  className="text-xs text-gray-400 hover:text-[#254283] px-1.5 py-0.5 rounded hover:bg-gray-200 transition">← Todo</button>
                              )}
                              {col.status === "DONE" && (
                                <button onClick={() => handleStatusUpdate(item.id, "IN_PROGRESS")}
                                  className="text-xs text-gray-400 hover:text-[#254283] px-1.5 py-0.5 rounded hover:bg-gray-200 transition">← Back</button>
                              )}
                              {col.status === "TODO" && (
                                <button onClick={() => handleStatusUpdate(item.id, "IN_PROGRESS")}
                                  className="text-xs text-gray-400 hover:text-[#254283] px-1.5 py-0.5 rounded hover:bg-gray-200 transition">→ Start</button>
                              )}
                              {col.status === "IN_PROGRESS" && (
                                <button onClick={() => handleStatusUpdate(item.id, "DONE")}
                                  className="text-xs text-gray-400 hover:text-[#254283] px-1.5 py-0.5 rounded hover:bg-gray-200 transition">→ Done</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {col.items.length === 0 && (
                        <p className="text-center text-xs text-gray-300 py-4">Empty</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {safeItems.map(item => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{item.priority}</span>
                        {item.assignee && <span>→ {item.assignee.name}</span>}
                        {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <select value={item.status} onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none">
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                ))}
                {safeItems.length === 0 && (
                  <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">No action items yet.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === "Announcements" && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Announcements</h2>
              {memberRole === "ADMIN" && (
                <button onClick={() => setShowNewAnnouncement(true)}
                  className="px-4 py-2 bg-[#254283] hover:bg-[#1e3569] text-white rounded-full text-sm font-medium transition">
                  + Post Announcement
                </button>
              )}
            </div>
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${a.isPinned ? "border-[#254283]/30" : "border-gray-100"}`}>
                  {a.isPinned && <span className="text-xs text-[#254283] font-bold mb-2 block uppercase tracking-wider">📌 Pinned</span>}
                  <p className="text-sm leading-relaxed text-gray-700">{a.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      {["👍", "❤️", "🎉", "🚀"].map(emoji => (
                        <button key={emoji} onClick={() => handleReact(a.id, emoji)}
                          className="text-lg hover:scale-125 transition-transform px-1">
                          {emoji}
                          {a.reactions?.[emoji]?.length > 0 && (
                            <span className="text-xs text-gray-400 ml-0.5">{a.reactions[emoji].length}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {memberRole === "ADMIN" && (
                      <button onClick={() => handlePin(a.id)} className="text-xs text-gray-400 hover:text-[#254283] transition font-medium">
                        {a.isPinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {a.comments?.map(c => (
                      <div key={c.id} className="bg-gray-50 rounded-xl p-3 text-sm border border-gray-100">
                        <span className="font-semibold text-[#254283]">{c.author?.name}: </span>
                        <span className="text-gray-600">{c.content}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={commentText[a.id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [a.id]: e.target.value })}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20"
                        placeholder="Add a comment..."
                      />
                      <button onClick={() => handleComment(a.id)}
                        className="px-4 py-2 bg-[#254283] hover:bg-[#1e3569] text-white rounded-xl text-sm transition">Send</button>
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">No announcements yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "Analytics" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Goals", value: analytics?.totalGoals || 0, color: "bg-[#254283]" },
                { label: "Completed This Week", value: analytics?.completedThisWeek || 0, color: "bg-green-500" },
                { label: "Overdue Items", value: analytics?.overdueItems || 0, color: "bg-red-500" },
                { label: "Total Members", value: analytics?.totalMembers || 0, color: "bg-blue-500" },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className={`w-10 h-10 ${stat.color} rounded-xl mb-3 shadow-md`}></div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Goals by Status</h3>
              <div className="space-y-3">
                {analytics?.goalsByStatus?.map(s => (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-28">{s.status.replace("_", " ")}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-[#254283] h-2 rounded-full transition-all"
                        style={{ width: `${analytics.totalGoals ? (s._count / analytics.totalGoals) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-6 text-right">{s._count}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleExportCSV}
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#254283] hover:text-[#254283] transition font-medium">
              Export Workspace Data as CSV
            </button>
          </div>
        )}

        {/* AUDIT LOG */}
        {activeTab === "Audit Log" && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Audit Log</h2>
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-9 h-9 bg-[#254283]/10 rounded-xl flex items-center justify-center text-sm font-bold text-[#254283] flex-shrink-0">
                    {log.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{log.user?.name}</span>{" "}
                      <span className="text-gray-400">{log.action.toLowerCase()}d</span>{" "}
                      <span className="text-[#254283] font-medium">{log.entity}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    log.action === "CREATE" ? "bg-green-100 text-green-600" :
                    log.action === "DELETE" ? "bg-red-100 text-red-500" :
                    "bg-gray-100 text-gray-500"}`}>
                    {log.action}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">No audit logs yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showNewGoal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <input required value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20"
                placeholder="Goal title" />
              <textarea value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20 resize-none"
                rows={3} placeholder="Description (optional)" />
              <input type="date" value={newGoal.dueDate} onChange={e => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewGoal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#254283] hover:bg-[#1e3569] rounded-xl text-white font-medium text-sm transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Action Item</h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <input required value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20"
                placeholder="Item title" />
              <select value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20">
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
              <input type="date" value={newItem.dueDate} onChange={e => setNewItem({ ...newItem, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewItem(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#254283] hover:bg-[#1e3569] rounded-xl text-white font-medium text-sm transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewAnnouncement && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Post Announcement</h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <textarea required value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20 resize-none"
                rows={5} placeholder="Write your announcement..." />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewAnnouncement(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#254283] hover:bg-[#1e3569] rounded-xl text-white font-medium text-sm transition">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Invite Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#254283]/20"
                placeholder="member@email.com" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvite(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#254283] hover:bg-[#1e3569] rounded-xl text-white font-medium text-sm transition">Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}