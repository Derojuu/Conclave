import { create } from "zustand";

/**
 * Global UI state that is not tied to a single route or component tree:
 * mobile navigation and the command palette. Domain state (committees,
 * submissions) lives in its own feature stores added in later phases.
 */
interface UIState {
  mobileNavOpen: boolean;
  commandMenuOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  setCommandMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileNavOpen: false,
  commandMenuOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
}));
