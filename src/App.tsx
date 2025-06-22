import React from 'react';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
import Header from './components/Layout/Header';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import Dashboard from './components/Dashboard/Dashboard';
import TemplatesPage from './components/Templates/TemplatesPage';
import EditorPage from './components/Editor/EditorPage';

function App() {
  const { currentView } = useAppStore();
  const { loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Check for password reset in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'recovery') {
      // This is a password reset link
      window.history.replaceState({}, document.title, '/auth/reset-password');
    }
  }, []);

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
    // Check if this is a password reset page
    if (window.location.pathname === '/auth/reset-password') {
      return <ResetPasswordPage />;
    }

    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'auth':
        return <AuthPage />;
      case 'dashboard':
        return <Dashboard />;
      case 'templates':
        return <TemplatesPage />;
      case 'editor':
        return <EditorPage />;
      default:
        return <LandingPage />;
    }
  };

  const shouldShowHeader = currentView !== 'editor' && window.location.pathname !== '/auth/reset-password';

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowHeader && (
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}
      {renderCurrentView()}
    </div>
  );
}

export default App;