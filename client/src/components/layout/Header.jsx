import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MessageSquare, User, LogOut, Settings, BarChart3, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };

  const isActive = (path) => {
    const [pathname, hash = ''] = path.split('#');

    if (location.pathname !== pathname) {
      return false;
    }

    if (!hash) {
      return !location.hash || pathname !== '/admin';
    }

    return location.hash === `#${hash}`;
  };

 const navLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Feedback', path: '/feedback', icon: MessageSquare },
  { label: 'Submit', path: '/feedback/submit', icon: MessageSquare },
];

// Admin-only links
if (user?.role === 'admin') {
  navLinks.push(
    { label: 'Categories', path: '/admin/categories', icon: Settings },
    { label: 'Users', path: '/admin/users', icon: User }, 
    { label: 'Admin', path: '/admin', icon: Settings }
  );
}

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 hidden sm:block">CommunityPulse</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Button variant="primary" size="sm" onClick={() => navigate('/feedback/submit')}>
              + Submit
            </Button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100"
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.name?.split(' ')[0]}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 inline mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive(link.path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="w-5 h-5 mr-3" />
                {link.label}
              </Link>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full flex items-center px-4 py-3 text-sm text-red-600">
              <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
