import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MessageSquare, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout: authLogout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Different nav links for authenticated vs non-authenticated
  const navLinks = isAuthenticated ? [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Feedback', path: '/feedback' },
    { label: 'Submit', path: '/feedback/submit' },
    ...(user?.role === 'admin' ? [{ label: 'Admin', path: '/admin' }] : []),
  ] : [
    { label: 'Features', path: '/#features' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Testimonials', path: '/#testimonials' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo - Always Visible */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 hidden sm:block">CommunityPulse</span>
          </Link>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="hidden md:flex items-center space-x-1 flex-shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.path) || (link.path.startsWith('/#') && location.pathname === '/')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side - Hidden on Mobile */}
          <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <Button variant="primary" size="sm" onClick={() => navigate('/feedback/submit')}>
                  + Submit
                </Button>
                
                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden lg:block">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-fade-in">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => { setUserMenuOpen(false); }}
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          Profile
                        </Link>
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            onClick={() => { setUserMenuOpen(false); }}
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* ✅ MOBILE MENU BUTTON - Visible ONLY on Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 flex-shrink-0 z-50"
            aria-label="Toggle menu"
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* ✅ MOBILE MENU - Visible ONLY on Mobile when open */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-slate-200 z-50 md:hidden animate-slide-down shadow-lg">
            <div className="px-4 py-4 space-y-2 max-h-[80vh] overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition ${
                    isActive(link.path)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Divider */}
              <div className="border-t border-slate-200 pt-3 mt-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 rounded-lg text-base text-slate-700 hover:bg-slate-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5 mr-3 text-slate-400" />
                      Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 rounded-lg text-base text-slate-700 hover:bg-slate-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MessageSquare className="w-5 h-5 mr-3 text-slate-400" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-base text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-5 h-5 mr-3 text-red-400" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-center"
                      onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;