import React from 'react';
import { Menu, X, Zap, User, Settings, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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
                <Button
                  onClick={() => handleNavigation('dashboard')}
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  className="text-sm font-medium"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => handleNavigation('templates')}
                  variant={currentView === 'templates' ? 'default' : 'ghost'}
                  className="text-sm font-medium"
                >
                  Templates
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    onClick={() => handleNavigation('admin')}
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    className="flex items-center space-x-1 text-sm font-medium"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    <span>Admin Panel</span>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-sm font-medium">
                  Features
                </Button>
                <Button variant="ghost" className="text-sm font-medium">
                  Pricing
                </Button>
                <Button variant="ghost" className="text-sm font-medium">
                  Support
                </Button>
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="relative">
                <Button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  variant="ghost"
                  className="flex items-center space-x-2 rounded-full px-3 py-2"
                >
                  <Avatar>
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {user.name}
                      </span>
                      {user.role === 'admin' && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </Button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{user.plan} Plan</span>
                          {user.role === 'admin' && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          handleNavigation('profile');
                          setShowUserMenu(false);
                        }}
                        variant="ghost"
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 justify-start"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Button>
                      <Button 
                        onClick={() => {
                          handleNavigation('profile');
                          setShowUserMenu(false);
                        }}
                        variant="ghost"
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 justify-start"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Button>
                      {user.role === 'admin' && (
                        <Button 
                          onClick={() => {
                            handleNavigation('admin');
                            setShowUserMenu(false);
                          }}
                          variant="ghost"
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 justify-start"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </Button>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <Button
                          onClick={handleLogout}
                          variant="ghost"
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 justify-start"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign out</span>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  onClick={() => handleNavigation('auth')}
                  variant="ghost"
                  className="text-sm font-medium"
                >
                  Sign in
                </Button>
                <Button
                  onClick={() => handleNavigation('auth')}
                  variant="default"
                  className="text-sm font-medium"
                >
                  Get started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
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
                  <Button
                    onClick={() => handleNavigation('dashboard')}
                    variant="ghost"
                    className="block w-full text-left text-base font-medium justify-start"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => handleNavigation('templates')}
                    variant="ghost"
                    className="block w-full text-left text-base font-medium justify-start"
                  >
                    Templates
                  </Button>
                  {user?.role === 'admin' && (
                    <Button
                      onClick={() => handleNavigation('admin')}
                      variant="ghost"
                      className="flex items-center w-full text-left text-base font-medium text-purple-700 hover:text-purple-600 justify-start"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}
                  <Button
                    onClick={() => handleNavigation('profile')}
                    variant="ghost"
                    className="block w-full text-left text-base font-medium justify-start"
                  >
                    Profile
                  </Button>
                  <hr className="border-gray-200" />
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="block w-full text-left text-base font-medium text-red-600 hover:text-red-700 justify-start"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="block w-full text-left text-base font-medium justify-start">
                    Features
                  </Button>
                  <Button variant="ghost" className="block w-full text-left text-base font-medium justify-start">
                    Pricing
                  </Button>
                  <Button variant="ghost" className="block w-full text-left text-base font-medium justify-start">
                    Support
                  </Button>
                  <hr className="border-gray-200" />
                  <Button
                    onClick={() => handleNavigation('auth')}
                    variant="ghost"
                    className="block w-full text-left text-base font-medium justify-start"
                  >
                    Sign in
                  </Button>
                  <Button
                    onClick={() => handleNavigation('auth')}
                    variant="default"
                    className="w-full text-base font-medium"
                  >
                    Get started
                  </Button>
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