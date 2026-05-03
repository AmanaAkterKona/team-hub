const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  });

  if (res.status === 401) {
    // Try refresh
    await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export const api = {
  // Auth
  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),

  // Workspaces
  getWorkspaces: () => request("/api/workspaces"),
  createWorkspace: (body) => request("/api/workspaces", { method: "POST", body: JSON.stringify(body) }),
  getWorkspace: (id) => request(`/api/workspaces/${id}`),
  updateWorkspace: (id, body) => request(`/api/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  inviteMember: (id, body) => request(`/api/workspaces/${id}/invite`, { method: "POST", body: JSON.stringify(body) }),
  removeMember: (id, memberId) => request(`/api/workspaces/${id}/members/${memberId}`, { method: "DELETE" }),
  getAnalytics: (id) => request(`/api/workspaces/${id}/analytics`),
  getAuditLog: (id) => request(`/api/workspaces/${id}/audit`),

  // Goals
  getGoals: (workspaceId) => request(`/api/goals/workspace/${workspaceId}`),
  createGoal: (body) => request("/api/goals", { method: "POST", body: JSON.stringify(body) }),
  getGoal: (id) => request(`/api/goals/${id}`),
  updateGoal: (id, body) => request(`/api/goals/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteGoal: (id) => request(`/api/goals/${id}`, { method: "DELETE" }),
  addMilestone: (goalId, body) => request(`/api/goals/${goalId}/milestones`, { method: "POST", body: JSON.stringify(body) }),
  updateMilestone: (goalId, milestoneId, body) => request(`/api/goals/${goalId}/milestones/${milestoneId}`, { method: "PATCH", body: JSON.stringify(body) }),
  addGoalUpdate: (goalId, body) => request(`/api/goals/${goalId}/updates`, { method: "POST", body: JSON.stringify(body) }),

  // Announcements
  getAnnouncements: (workspaceId) => request(`/api/announcements/workspace/${workspaceId}`),
  createAnnouncement: (body) => request("/api/announcements", { method: "POST", body: JSON.stringify(body) }),
  pinAnnouncement: (id) => request(`/api/announcements/${id}/pin`, { method: "PATCH" }),
  reactToAnnouncement: (id, body) => request(`/api/announcements/${id}/react`, { method: "POST", body: JSON.stringify(body) }),
  addComment: (id, body) => request(`/api/announcements/${id}/comments`, { method: "POST", body: JSON.stringify(body) }),
  deleteAnnouncement: (id) => request(`/api/announcements/${id}`, { method: "DELETE" }),

  // Action Items
  getActionItems: (workspaceId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/action-items/workspace/${workspaceId}${query ? `?${query}` : ""}`);
  },
  createActionItem: (body) => request("/api/action-items", { method: "POST", body: JSON.stringify(body) }),
  updateActionItem: (id, body) => request(`/api/action-items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteActionItem: (id) => request(`/api/action-items/${id}`, { method: "DELETE" }),
  exportCSV: (workspaceId) => `${API_URL}/api/action-items/export/${workspaceId}`,
  getNotifications: (userId) => request(`/api/action-items/notifications/${userId}`),
  markNotificationRead: (id) => request(`/api/action-items/notifications/${id}/read`, { method: "PATCH" }),
};