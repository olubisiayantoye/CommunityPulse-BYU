import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MessageSquare, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
//import '../styles/header.css'; // Optional: if you want separate CSS file

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
      <div className="header-container">
        
        {/* Logo */}
        <Link to="/" className="header-logo">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 header-logo-text">CommunityPulse</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav items-center space-x-1">
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

        {/* Desktop Right Side Buttons */}
        <div className="desktop-buttons items-center space-x-3">
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
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

        {/* ✅ MOBILE MENU BUTTON - Uses Custom CSS */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
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

      {/* ✅ MOBILE MENU PANEL - Uses Custom CSS */}
      <div className={`mobile-menu-backdrop ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      
      <div className={`mobile-menu-panel ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-menu-link ${isActive(link.path) ? 'active' : ''}`}
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
                  className="mobile-menu-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-3 text-slate-400" />
                  Profile
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="mobile-menu-link text-red-600 hover:bg-red-50 w-full"
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
    </header>
  );
};

export default Header;