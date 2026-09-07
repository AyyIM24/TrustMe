import { Link } from 'react-router-dom';
import { HeartPulse, ArrowRight, LayoutDashboard, Activity } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function PublicNavbar() {
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  return (
    <nav className="sticky top-0 z-50 bg-[#D6EBFC]/95 backdrop-blur-xl border-b border-pink-300/80 shadow-md shadow-pink-200/40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Brand Logo with Popping Concentric Vitality Rings */}
          <Link to="/" className="flex items-center gap-3 group transition-transform duration-200 hover:scale-105">
            <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
              <span className="absolute inset-0 rounded-full border-2 border-cyan-500/80 animate-spin" style={{ animationDuration: '14s' }} />
              <span className="absolute w-9 h-9 rounded-full border border-teal-500/70" />
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-cyan-500/30 group-hover:shadow-lg group-hover:shadow-cyan-500/40 transition-all animate-heart-pop">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Trust<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">Me</span>
                </span>
                <span className="text-[10px] text-pink-700 font-mono font-bold bg-pink-100 border border-pink-300 px-1.5 py-0.5 rounded-md shadow-sm">
                  AI
                </span>
              </div>
              <p className="text-[10.5px] text-teal-800 font-mono flex items-center gap-1 font-semibold">
                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                Clinical Health Truth & Defense
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-700">
            <Link to="/" className="px-3 py-1.5 rounded-lg hover:text-pink-800 hover:bg-[#C8E4FA] transition-all duration-200">
              Overview
            </Link>
            <a href="#features" className="px-3 py-1.5 rounded-lg hover:text-pink-800 hover:bg-[#C8E4FA] transition-all duration-200">
              Medical Engines
            </a>
            <a href="#dataset" className="px-3 py-1.5 rounded-lg hover:text-pink-800 hover:bg-[#C8E4FA] transition-all duration-200">
              CoAID & FakeHealth Data
            </a>
            <Link to="/about" className="px-3 py-1.5 rounded-lg hover:text-pink-800 hover:bg-[#C8E4FA] transition-all duration-200">
              Clinical Methodology
            </Link>
            <Link to="/factcheck" className="px-3 py-1.5 rounded-lg hover:text-pink-800 hover:bg-[#C8E4FA] transition-all duration-200 font-semibold text-teal-800">
              Medical Fact Check
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono shadow-md shadow-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/40 transition-all hover:scale-105 active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-xs font-bold text-slate-800 hover:text-pink-800 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 hover:border-pink-400 rounded-xl transition-all duration-200 font-mono shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono shadow-md shadow-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
