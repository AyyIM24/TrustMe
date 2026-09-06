import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard,
  LogOut, User, Newspaper, Globe, Sparkles, Brain,
  Activity, X, Zap
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import TrustMePulseBadge from '../common/TrustMePulseBadge';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard & Telemetry', icon: LayoutDashboard, badge: null },
    { path: '/predict', label: 'TrustMe AI Scanner', icon: Zap, badge: 'PRO' },
    { path: '/analyze', label: 'Article Deep Scanner', icon: Search, badge: null },
    { path: '/factcheck', label: 'Medical Fact-Check', icon: Globe, badge: 'LIVE' },
    { path: '/news', label: 'Health News Wire', icon: Newspaper, badge: null },
    { path: '/trending', label: 'Misinfo Trends', icon: Sparkles, badge: null },
    { path: '/explainability', label: 'SHAP Explainability', icon: Brain, badge: null },
    { path: '/profile', label: 'Profile & Biometrics', icon: User, badge: null },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast.success('Signed out of TrustMe AI successfully');
    navigate('/');
    if (setIsOpen) setIsOpen(false);
  };

  const handleNavClick = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Slide-In Left Drawer Sidebar (Luminous Blush Pink Background, Zero White) */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="w-84 max-w-[85vw] h-screen bg-[#FFE6EE] border-r border-pink-300/90 flex flex-col justify-between fixed top-0 left-0 z-50 shadow-2xl shadow-pink-400/30 select-none"
          >
            {/* Top: Logo & Navigation */}
            <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300">
              {/* Brand Header with popping concentric icon (Dense Light Blue Surface, No White) */}
              <div className="h-20 px-4 border-b border-pink-300 flex items-center justify-between flex-shrink-0 bg-[#D6EBFC]/95 backdrop-blur-md">
                <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-105">
                  <TrustMePulseBadge size="sm" showLabel={false} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-extrabold text-slate-900 tracking-tight">
                        TrustMe <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500">AI</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-pink-700 bg-[#C8E4FA] border border-pink-300 px-1.5 py-0.5 rounded-md shadow-sm">
                        PRO
                      </span>
                    </div>
                    <p className="text-[10px] text-teal-800 font-mono tracking-tight flex items-center gap-1 font-semibold">
                      <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                      Clinical Truth Engine
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-500 hover:text-pink-800 rounded-xl hover:bg-[#C8E4FA] border border-transparent hover:border-pink-300 transition-all cursor-pointer active:scale-95"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modules Navigation Links */}
              <div className="px-3.5 py-5 space-y-1.5">
                <div className="px-3 pb-2 text-[10.5px] font-mono font-bold uppercase tracking-wider text-pink-800 flex items-center justify-between">
                  <span>Clinical Intelligence</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>

                {navLinks.map(({ path, label, icon: Icon, badge }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={handleNavClick}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 hover:-translate-x-0.5 ${
                        active
                          ? 'text-pink-950 bg-pink-200/95 border border-pink-300 shadow-md shadow-pink-300/40 font-bold'
                          : 'text-slate-700 hover:text-cyan-900 hover:bg-[#D6EBFC] hover:shadow-sm border border-transparent hover:border-pink-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-colors ${active ? 'text-teal-700' : 'text-slate-500 group-hover:text-cyan-600'}`} />
                        <span className="tracking-wide">{label}</span>
                      </div>
                      {badge && (
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold tracking-wider shadow-sm ${
                            badge === 'LIVE'
                              ? 'bg-emerald-100 border border-emerald-300 text-emerald-800 animate-pulse'
                              : 'bg-[#C8E4FA] border border-pink-300 text-pink-700'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Minimalist Footer with Status & Sign Out (Dense Light Blue, No White) */}
            <div className="p-4 border-t border-pink-300 bg-[#D6EBFC]/95 backdrop-blur-md flex-shrink-0 space-y-3">
              {/* System Status Pill */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#C8E4FA] border border-pink-300 rounded-xl text-[11px] font-mono text-slate-800 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-900 font-semibold">TrustMe Node Active</span>
                </div>
                <span className="text-cyan-800 font-bold">v2.4 Pro</span>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-100/90 hover:bg-rose-200/90 border border-rose-300 transition-all font-mono uppercase tracking-wider shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
