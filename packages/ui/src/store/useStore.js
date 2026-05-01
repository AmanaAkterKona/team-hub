import { create } from 'zustand';

export const useGoalStore = create((set, get) => ({
  goals: [],
  
  // Optimistic UI: update locally first, rollback on error
  updateGoalStatus: async (goalId, status) => {
    const prev = get().goals;
    // Instantly update UI
    set({ goals: prev.map(g => g.id === goalId ? { ...g, status } : g) });
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
    } catch {
      // Rollback on error
      set({ goals: prev });
      toast.error('Failed to update. Reverted.');
    }
  }
}));