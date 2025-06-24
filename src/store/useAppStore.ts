import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "business";
  role: "user" | "admin";
}

interface Website {
  id: string;
  name: string;
  description: string;
  domain?: string;
  status: "draft" | "published";
  lastModified: Date;
  thumbnail?: string;
  template: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  currentView: "landing" | "auth" | "profile" | "dashboard" | "editor" | "templates" | "admin";
  currentWebsite: Website | null;
  selectedComponent: string | null;
  editorMode: "desktop" | "tablet" | "mobile";
  isPreviewMode: boolean;
  
  setUser: (user: User | null) => void;
  setCurrentView: (view: AppState["currentView"]) => void;
  setCurrentWebsite: (website: Website | null) => void;
  setSelectedComponent: (id: string | null) => void;
  setEditorMode: (mode: AppState["editorMode"]) => void;
  togglePreviewMode: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      currentView: "landing",
      currentWebsite: null,
      selectedComponent: null,
      editorMode: "desktop",
      isPreviewMode: false,

      setUser: (user) => {
        const currentUser = get().user;
        if ((user?.id !== currentUser?.id) || (!user && currentUser)) {
          set({ user, isAuthenticated: !!user }, false, "setUser");
        }
      },

      setCurrentView: (currentView) => {
        if (currentView !== get().currentView) {
          set({ currentView }, false, "setCurrentView");
        }
      },

      setCurrentWebsite: (currentWebsite) => {
        set({ currentWebsite }, false, "setCurrentWebsite");
      },

      setSelectedComponent: (selectedComponent) => {
        set({ selectedComponent }, false, "setSelectedComponent");
      },

      setEditorMode: (editorMode) => {
        set({ editorMode }, false, "setEditorMode");
      },

      togglePreviewMode: () => {
        set(
          (state) => ({ isPreviewMode: !state.isPreviewMode }),
          false,
          "togglePreviewMode"
        );
      },

      logout: () => {
        set(
          {
            user: null,
            isAuthenticated: false,
            currentView: "landing",
            currentWebsite: null,
          },
          false,
          "logout"
        );
      },
    }),
    { name: "app-store" }
  )
);