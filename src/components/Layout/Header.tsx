import React from 'react';
import { Menu, X, Zap, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const { user, isAuthenticated, currentView, setCurrentView } = useAppStore();
  const { signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleNavigation = (view: typeof currentView) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => handleNavigation('landing')}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NCBX
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavigation('dashboard')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'dashboard' 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavigation('templates')}
                  className={`text-sm font-medium transition-colors ${
                    currentView === 'templates' 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Templates
                </button>
              </>
            ) : (
              <>
                <button className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                  Features
                </button>
                <button className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                  Pricing
                </button>
                <button className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                  Support
                </button>
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-2 transition-colors"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.plan} Plan</p>
                      </div>
                      <button 
                        onClick={() => {
                          handleNavigation('profile');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      <button 
                        onClick={() => {
                          handleNavigation('profile');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => handleNavigation('auth')}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => handleNavigation('auth')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get started
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavigation('dashboard')}
                    className="block w-full text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigation('templates')}
                    className="block w-full text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Templates
                  </button>
                  <button
                    onClick={() => handleNavigation('profile')}
                    className="block w-full text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Profile
                  </button>
                  <hr className="border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-base font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button className="block w-full text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    Features
                  </button>
                  <button className="block w-full text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    Pricing
                  </button>
                  <button className="block w-full text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    Support
                  </button>
                  <hr className="border-gray-200" />
                  <button
                    onClick={() => handleNavigation('auth')}
                    className="block w-full text-left text-base font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleNavigation('auth')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;