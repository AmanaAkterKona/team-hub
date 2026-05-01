import { create } from "zustand";
import { api } from "../lib/api";

// Auth Store
export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await api.logout();
    set({ user: null });
  },
}));

// Workspace Store
export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  onlineMembers: [],

  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setOnlineMembers: (members) => set({ onlineMembers: members }),

  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace] })),
}));

// Goals Store with Optimistic UI
export const useGoalStore = create((set, get) => ({
  goals: [],
  setGoals: (goals) => set({ goals }),

  addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),

  // Optimistic update
  updateGoalStatus: async (goalId, status) => {
    const prev = get().goals;
    // Instantly update UI
    set({ goals: prev.map((g) => (g.id === goalId ? { ...g, status } : g)) });
    try {
      await api.updateGoal(goalId, { status });
    } catch {
      // Rollback on error
      set({ goals: prev });
      throw new Error("Failed to update goal status");
    }
  },

  updateGoal: async (goalId, data) => {
    const prev = get().goals;
    set({ goals: prev.map((g) => (g.id === goalId ? { ...g, ...data } : g)) });
    try {
      const res = await api.updateGoal(goalId, data);
      set({ goals: prev.map((g) => (g.id === goalId ? res.goal : g)) });
    } catch {
      set({ goals: prev });
      throw new Error("Failed to update goal");
    }
  },

  removeGoal: (goalId) =>
    set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) })),
}));

// Action Items Store with Optimistic UI
export const useActionStore = create((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),

  // Optimistic status update (for Kanban drag)
  updateItemStatus: async (itemId, status) => {
    const prev = get().items;
    set({ items: prev.map((i) => (i.id === itemId ? { ...i, status } : i)) });
    try {
      await api.updateActionItem(itemId, { status });
    } catch {
      set({ items: prev });
      throw new Error("Failed to update item status");
    }
  },

  updateItem: async (itemId, data) => {
    const prev = get().items;
    set({ items: prev.map((i) => (i.id === itemId ? { ...i, ...data } : i)) });
    try {
      await api.updateActionItem(itemId, data);
    } catch {
      set({ items: prev });
      throw new Error("Failed to update item");
    }
  },

  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),
}));

// Announcements Store
export const useAnnouncementStore = create((set, get) => ({
  announcements: [],
  setAnnouncements: (announcements) => set({ announcements }),

  addAnnouncement: (announcement) =>
    set((state) => ({ announcements: [announcement, ...state.announcements] })),

  updateAnnouncement: (id, data) =>
    set((state) => ({
      announcements: state.announcements.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),

  addComment: (announcementId, comment) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === announcementId ? { ...a, comments: [...(a.comments || []), comment] } : a
      ),
    })),
}));

// Notifications Store
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));