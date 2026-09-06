import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Menu, X, Activity, BarChart3, Brain,
  Search, Globe, Newspaper, Zap, User, LogOut,
  Sparkles, Lock
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const navLinks = [
  { path: '/', label: 'Home', icon: Shield },
  { path: '/predict', label: 'TrustMe AI', icon: Zap },
  { path: '/analyze', label: 'Article Scanner', icon: Search },
  { path: '/factcheck', label: 'Medical Fact Check', icon: Globe },
  { path: '/news', label: 'Health Wire', icon: Newspaper },
  { path: '/trending', label: 'Misinfo Trends', icon: Sparkles },
  { path: '/dashboard', label: 'Model Metrics', icon: BarChart3 },
  { path: '/explainability', label: 'SHAP Explainer', icon: Brain },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token, logout } = useAuthStore()

  const isAuthenticated = !!token

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
    setMobileOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-hg-bg/85 backdrop-blur-xl border-b border-hg-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center
                            group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all duration-300">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-hg-bg animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-bold text-hg-text">
                TrustMe<span className="gradient-text"> AI</span>
              </span>
              <span className="text-[10px] text-cyan-600 font-semibold ml-1.5 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`nav-link flex items-center gap-1.5 text-xs font-medium ${
                    active ? 'nav-link-active' : ''
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Model Pulse */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-hg-muted bg-hg-card/60 px-2.5 py-1 rounded-full border border-hg-border/40">
              <span className="w-2 h-2 rounded-full bg-hg-success animate-ping" />
              <span>AI Online</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 bg-hg-card hover:bg-hg-border/40 border border-hg-border/60 rounded-xl transition-all duration-200"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-hg-primary to-hg-accent flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.username ? user.username[0] : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-hg-text max-w-[100px] truncate">
                    {user?.username || 'Profile'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-hg-muted hover:text-hg-danger hover:bg-hg-danger/10 border border-transparent hover:border-hg-danger/20 rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-hg-text hover:text-hg-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-gradient-to-r from-hg-primary to-hg-primary-dark hover:shadow-lg hover:shadow-hg-primary/20 text-white text-xs font-semibold rounded-xl transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            {isAuthenticated && (
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-hg-primary/20 border border-hg-primary/40 flex items-center justify-center text-xs font-bold text-hg-primary uppercase"
              >
                {user?.username ? user.username[0] : 'U'}
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-hg-muted hover:text-hg-text rounded-lg hover:bg-hg-card"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-hg-card/95 backdrop-blur-xl border-b border-hg-border/40 px-4 py-4 space-y-1"
          >
            {navLinks.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'text-hg-primary bg-hg-primary/10 border border-hg-primary/20' : 'text-hg-muted hover:text-hg-text hover:bg-hg-bg'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}

            <div className="pt-3 border-t border-hg-border/40 mt-3 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-hg-text bg-hg-surface rounded-xl border border-hg-border/50"
                  >
                    <User className="w-4 h-4 text-hg-primary" />
                    <span>My Profile & Scan History</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-hg-danger bg-hg-danger/10 border border-hg-danger/20 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-hg-text bg-hg-surface border border-hg-border rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-hg-primary rounded-xl"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
