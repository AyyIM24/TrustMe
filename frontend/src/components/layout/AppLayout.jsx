import { useState } from 'react';
import { Menu, HeartPulse, Activity, User, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/authStore';

const PAGE_METADATA = {
  '/dashboard': {
    title: 'Clinical Telemetry & Intelligence Overview',
    subtitle: 'Real-time healthcare misinformation benchmarks & scan telemetry',
    category: 'Telemetry',
  },
  '/predict': {
    title: 'TrustMe AI Healthcare Classifier',
    subtitle: 'Dual-model NLP detection with token-level SHAP explainability',
    category: 'Inference',
  },
  '/analyze': {
    title: 'Clinical Article & URL Deep Scanner',
    subtitle: 'Multi-signal medical article veracity & scraper engine',
    category: 'Extraction',
  },
  '/factcheck': {
    title: 'Medical & Healthcare Claim Fact-Checker',
    subtitle: 'Peer-reviewed literature cross-referencing & citation graph',
    category: 'Verification',
  },
  '/news': {
    title: 'Live Healthcare & Medical News Wire',
    subtitle: 'Curated RSS streams from BBC Health & NY Times Medical',
    category: 'Monitoring',
  },
  '/trending': {
    title: 'Global Health Misinformation Signals',
    subtitle: 'Viral cluster tracking and health rumor propagation alerts',
    category: 'Surveillance',
  },
  '/explainability': {
    title: 'SHAP Medical Attribution Lab',
    subtitle: 'Feature importance and clinical vocabulary impact weights',
    category: 'Explainability',
  },
  '/profile': {
    title: 'Analyst Profile, Biometric Face ID & Vault',
    subtitle: 'Identity verification, security settings, and audit trails',
    category: 'Identity',
  },
};

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  const meta = PAGE_METADATA[location.pathname] || {
    title: 'TrustMe Clinical Terminal',
    subtitle: 'Medical Veracity Assessment Suite',
    category: 'Workspace',
  };

  return (
    <div className="min-h-screen bg-[#FFE6EE] text-slate-900 flex flex-col selection:bg-pink-500/20 selection:text-pink-900 font-sans transition-colors duration-300">
      {/* Slide-out Left Drawer Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Top Fixed Header Bar (Dense Light Blue, Zero White, Soft Pink Border) */}
      <header className="sticky top-0 z-30 h-18 bg-[#D6EBFC]/95 backdrop-blur-xl border-b border-pink-300/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-md shadow-pink-200/30 transition-all duration-300">
        {/* Left: Prominent Hamburger Button & Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Glowing Medical Hamburger Button with Dynamic Hover */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 hover:border-pink-400 rounded-xl text-pink-700 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 group cursor-pointer active:scale-95"
            title="Open Intelligence Menu"
            aria-label="Toggle navigation menu"
          >
            <div className="flex flex-col gap-1 w-5 justify-center items-center">
              <span className="w-5 h-0.5 bg-cyan-600 rounded-full group-hover:bg-emerald-500 transition-colors" />
              <span className="w-3.5 h-0.5 bg-cyan-600 rounded-full group-hover:w-5 group-hover:bg-emerald-500 transition-all" />
              <span className="w-5 h-0.5 bg-cyan-600 rounded-full group-hover:bg-emerald-500 transition-colors" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 group-hover:text-pink-800 hidden sm:inline">
              Menu
            </span>
          </button>

          {/* Platform Mini Branding with Popping Heart */}
          <Link to="/dashboard" className="flex items-center gap-2 group transition-transform duration-200 hover:scale-105">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-cyan-500/25 group-hover:shadow-lg transition-all animate-heart-pop">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Trust<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">Me</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-pink-700 bg-pink-100 border border-pink-300 px-1.5 py-0.5 rounded shadow-sm">
                  AI
                </span>
              </div>
            </div>
          </Link>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block" />

          {/* Current Page Title */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-300 font-bold hidden lg:inline-block shadow-sm">
                {meta.category}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md md:max-w-lg">
                {meta.title}
              </h1>
            </div>
            <p className="text-[10.5px] text-slate-500 font-mono hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Telemetry & User Profile Action */}
        <div className="flex items-center gap-3">
          {/* Live ECG Pulse Pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-emerald-900 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200">
            <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold">Telemetry: Normal</span>
          </div>

          {/* Model Status Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-cyan-900 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 px-3 py-1.5 rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-200">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span>AI Active (77.5% Acc)</span>
          </div>

          {/* User Profile Pill */}
          <Link
            to="/profile"
            className="flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 hover:border-pink-400 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 group active:scale-95"
            title="View User Profile & Biometrics"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center text-[11px] font-bold text-white uppercase shadow-inner">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'TM'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 group-hover:text-pink-800 transition-colors leading-tight">
                {user?.username || 'Analyst'}
              </div>
              <div className="text-[9px] font-mono text-pink-700 leading-none uppercase font-bold">
                {user?.role || 'User'}
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
