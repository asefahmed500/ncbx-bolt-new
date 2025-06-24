import React, { useEffect } from 'react';
import {
  useLocation,
  useNavigate,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
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

// Create a router using react-router-dom's createBrowserRouter
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    // You can add children routes here if needed
  }
]);

function AppWrapper() {
  return (
    <RouterProvider router={router} />
  );
}

function App() {
  // State hooks at the top (React hook rules)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isPasswordReset, setIsPasswordReset] = React.useState(false);
  
  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  
  // Store hooks
  const { currentView, isAuthenticated, setCurrentView } = useAppStore();
  const { loading, isAuthenticated: authIsAuthenticated } = useAuth();

  // Check for password reset in URL
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

  // Handle route protection and redirection
  useEffect(() => {
    if (loading) return;

    const protectedRoutes = ['profile', 'dashboard', 'templates', 'editor', 'admin'];
    const publicRoutes = ['landing', 'auth'];
    
    // Redirect unauthenticated users trying to access protected routes
    if (!authIsAuthenticated && protectedRoutes.includes(currentView)) {
      setCurrentView('landing');
      navigate('/', { replace: true });
    }

    // Redirect authenticated users trying to access public routes
    if (authIsAuthenticated && publicRoutes.includes(currentView)) {
      setCurrentView('dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [loading, authIsAuthenticated, currentView, setCurrentView, navigate]);

  // Debug current state (debounced)
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

  // Show loading spinner while auth is initializing
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
    // Handle password reset page first (highest priority)
    if (isPasswordReset) {
      return <ResetPasswordPage />;
    }

    // Render based on current view
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
        console.warn('⚠️ Unknown view:', currentView, 'defaulting to landing');
        return <LandingPage />;
    }
  };

  const shouldShowHeader = currentView !== 'editor' && !isPasswordReset;

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowHeader && (
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}
      <main className="pb-16">
        {renderCurrentView()}
      </main>
      <MadeWithBolt />
    </div>
  );
}

export default AppWrapper;