import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, BarChart3, LayoutDashboard, Menu, X,
  LogOut, User, Newspaper, ChevronDown, FlaskConical
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const isAuthenticated = !!token;

  const navLinks = [
    { path: '/analyze',   label: 'Analyze',     icon: Search },
    { path: '/factcheck', label: 'Fact Check',   icon: FlaskConical },
    { path: '/news',      label: 'Live News',    icon: Newspaper },
    { path: '/trending',  label: 'Trending',     icon: BarChart3 },
    ...(isAuthenticated ? [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div whileHover={{ rotate: 15 }} transition={{ type: 'spring' }}>
              <Shield className="w-8 h-8 text-fs-cyan" />
            </motion.div>
            <span className="text-xl font-bold text-fs-text">
              Fake<span className="text-fs-cyan">Shield</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(path)
                    ? 'text-fs-cyan bg-fs-cyan/10 border border-fs-cyan/20'
                    : 'text-fs-muted hover:text-fs-text hover:bg-fs-surface'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {label === 'Live News' && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-fs-green animate-pulse" />
                )}
                {label === 'Fact Check' && (
                  <span className="ml-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-fs-amber/20 border border-fs-amber/30 text-fs-amber">
                    NEW
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fs-surface border border-fs-border hover:border-fs-cyan/30 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-fs-cyan/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-fs-cyan" />
                  </div>
                  <span className="text-sm text-fs-text">{user?.username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-fs-muted transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-44 bg-fs-surface border border-fs-border rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-fs-muted hover:text-fs-text hover:bg-fs-bg/50 transition-colors"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <div className="border-t border-fs-border" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-fs-crimson hover:bg-fs-crimson/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-fs-muted hover:text-fs-text hover:bg-fs-surface border border-transparent hover:border-fs-border transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-fs-cyan text-fs-bg hover:bg-fs-cyan/90 transition-all"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-fs-muted hover:text-fs-text"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-fs-border"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(path)
                      ? 'text-fs-cyan bg-fs-cyan/10 border border-fs-cyan/20'
                      : 'text-fs-muted hover:text-fs-text hover:bg-fs-surface'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {label === 'Live News' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-fs-green animate-pulse" />
                  )}
                </Link>
              ))}

              <div className="pt-3 border-t border-fs-border space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-fs-muted hover:text-fs-text hover:bg-fs-surface rounded-xl text-sm transition-all"
                    >
                      <User className="w-5 h-5" /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-fs-crimson hover:bg-fs-crimson/10 rounded-xl text-sm transition-all"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link to="/login" onClick={() => setIsMobileOpen(false)} className="flex-1">
                      <div className="text-center py-2.5 rounded-xl border border-fs-border text-fs-muted text-sm hover:text-fs-text transition-all">Login</div>
                    </Link>
                    <Link to="/register" onClick={() => setIsMobileOpen(false)} className="flex-1">
                      <div className="text-center py-2.5 rounded-xl bg-fs-cyan text-fs-bg font-bold text-sm">Sign Up</div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
