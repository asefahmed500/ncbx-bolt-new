import React from 'react';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
import Header from './components/Layout/Header';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import Dashboard from './components/Dashboard/Dashboard';
import TemplatesPage from './components/Templates/TemplatesPage';
import EditorPage from './components/Editor/EditorPage';

function App() {
  const { currentView } = useAppStore();
  const { loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView !== 'editor' && (
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}
      {renderCurrentView()}
    </div>
  );
}

export default App;