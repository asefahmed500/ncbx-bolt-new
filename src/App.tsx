import React, { useEffect, useState } from 'react';
import {
  useLocation,
  useNavigate,
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';

import Header from './components/Layout/Header';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import ProfilePage from './components/Profile/ProfilePage';
import Dashboard from './components/Dashboard/Dashboard';
import TemplatesPage from './components/Templates/TemplatesPage';
import EditorPage from './components/Editor/EditorPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import MadeWithBolt from './components/MadeWithBolt';

// React Router setup
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);

export default function AppWrapper() {
  return <RouterProvider router={router} />;
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { currentView, isAuthenticated, setCurrentView } = useAppStore();
  const { loading, isAuthenticated: authIsAuthenticated } = useAuth();

  // ✅ Handle Supabase OAuth redirect (e.g., Google login)
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('❌ OAuth exchange error:', error.message);
        } else {
          console.log('✅ OAuth session established:', data);
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, []);

  // ✅ Handle password reset links
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const type = urlParams.get('type');
    const path = location.pathname;

    if (type === 'recovery' || path === '/auth/reset-password') {
      setIsPasswordReset(true);
      if (type === 'recovery') {
        window.history.replaceState({}, document.title, '/auth/reset-password');
      }
    } else {
      setIsPasswordReset(false);
    }
  }, [location]);

  // ✅ Redirect based on auth and view
  useEffect(() => {
    if (loading) return;

    const protectedRoutes = ['profile', 'dashboard', 'templates', 'editor', 'admin'];
    const publicRoutes = ['landing', 'auth'];

    if (!authIsAuthenticated && protectedRoutes.includes(currentView)) {
      setCurrentView('landing');
      navigate('/', { replace: true });
    }

    if (authIsAuthenticated && publicRoutes.includes(currentView)) {
      setCurrentView('dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [loading, authIsAuthenticated, currentView, setCurrentView, navigate]);

  // Optional: Debug current state
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('📱 App state:', {
        currentView,
        isAuthenticated,
        loading,
        isPasswordReset,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentView, isAuthenticated, loading, isPasswordReset]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    if (isPasswordReset) return <ResetPasswordPage />;

    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'auth':
        return <AuthPage />;
      case 'profile':
        return <ProfilePage />;
      case 'dashboard':
        return <Dashboard />;
      case 'templates':
        return <TemplatesPage />;
      case 'editor':
        return <EditorPage />;
      case 'admin':
        return <AdminDashboard />;
      default:
        console.warn('⚠️ Unknown view:', currentView, '→ fallback to Landing');
        return <LandingPage />;
    }
  };

  const shouldShowHeader = currentView !== 'editor' && !isPasswordReset;

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowHeader && (
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}
      <main className="pb-16">{renderCurrentView()}</main>
      <MadeWithBolt />
    </div>
  );
}
