import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'business';
}

interface Website {
  id: string;
  name: string;
  description: string;
  domain?: string;
  status: 'draft' | 'published';
  lastModified: Date;
  thumbnail?: string;
  template: string;
}

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // App state
  currentView: 'landing' | 'auth' | 'dashboard' | 'editor' | 'templates';
  currentWebsite: Website | null;
  websites: Website[];
  
  // Editor state
  selectedComponent: string | null;
  editorMode: 'desktop' | 'tablet' | 'mobile';
  isPreviewMode: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  setCurrentWebsite: (website: Website | null) => void;
  addWebsite: (website: Website) => void;
  updateWebsite: (id: string, updates: Partial<Website>) => void;
  setSelectedComponent: (id: string | null) => void;
  setEditorMode: (mode: AppState['editorMode']) => void;
  togglePreviewMode: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  currentView: 'landing',
  currentWebsite: null,
  websites: [],
  selectedComponent: null,
  editorMode: 'desktop',
  isPreviewMode: false,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentView: (currentView) => set({ currentView }),
  setCurrentWebsite: (currentWebsite) => set({ currentWebsite }),
  addWebsite: (website) => set((state) => ({ websites: [...state.websites, website] })),
  updateWebsite: (id, updates) => set((state) => ({
    websites: state.websites.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  setSelectedComponent: (selectedComponent) => set({ selectedComponent }),
  setEditorMode: (editorMode) => set({ editorMode }),
  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
  logout: () => set({
    user: null,
    isAuthenticated: false,
    currentView: 'landing',
    currentWebsite: null,
    websites: []
  })
}));