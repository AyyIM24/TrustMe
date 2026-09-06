import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Sparkles, TrendingUp, Cpu, Award, Newspaper,
  ArrowRight, CheckCircle, Zap, Globe, Lock
} from 'lucide-react';
import { statsAPI } from '../api/client';
import useAuthStore from '../store/authStore';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant AI Analysis',
    desc: 'TF-IDF + Logistic Regression ML engine delivers results in milliseconds.',
    color: 'text-fs-cyan',
    bg: 'bg-fs-cyan/10 border-fs-cyan/20',
    path: '/analyze',
  },
  {
    icon: Newspaper,
    title: 'Live News Feed',
    desc: 'Real-time articles from BBC, NY Times, CNN — verify any article instantly.',
    color: 'text-fs-green',
    bg: 'bg-fs-green/10 border-fs-green/20',
    path: '/news',
  },
  {
    icon: Lock,
    title: 'Face Registration',
    desc: 'Enhanced biometric security. Register your face during account creation.',
    color: 'text-fs-amber',
    bg: 'bg-fs-amber/10 border-fs-amber/20',
    path: '/register',
  },
  {
    icon: Globe,
    title: 'Medical Fact Checker',
    desc: 'Type any health claim like "COVID vaccines alter human DNA" and get instant verified verdict with citations.',
    color: 'text-fs-crimson',
    bg: 'bg-fs-crimson/10 border-fs-crimson/20',
    path: '/factcheck',
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [globalStats, setGlobalStats] = useState({
    total_analyses: 44898,
    total_users: 1250,
    fake_percentage: 48.2,
    real_percentage: 51.8,
    avg_confidence: 94.7,
  });

  useEffect(() => {
    statsAPI.getGlobal()
      .then(res => setGlobalStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen bg-fs-bg text-fs-text overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fs-cyan/8 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fs-crimson/8 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Hero ── */}
        <div className="pt-16 md:pt-24 pb-12 text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fs-cyan/10 border border-fs-cyan/20 text-fs-cyan text-xs font-mono uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4" /> AI-Powered Fake News Detection v2.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-tight"
          >
            Can You Tell Real From Fake?{' '}
            <span className="text-gradient-cyan">We Can.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-fs-muted text-base md:text-lg max-w-2xl mx-auto"
          >
            FakeShield uses advanced TF-IDF analysis &amp; machine learning to evaluate news articles instantly.
            Verify live news, analyze URLs, and protect your truth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            {token ? (
              <>
                <button
                  onClick={() => navigate('/analyze')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-fs-cyan text-fs-bg font-bold text-sm hover:bg-fs-cyan/90 transition-all"
                >
                  Start Analyzing <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/factcheck')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-fs-border text-fs-text text-sm font-medium hover:border-fs-amber/40 hover:text-fs-amber transition-all"
                >
                  <Sparkles className="w-4 h-4" /> AI Fact Checker
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-fs-cyan text-fs-bg font-bold text-sm hover:bg-fs-cyan/90 transition-all"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/factcheck')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-fs-border text-fs-text text-sm font-medium hover:border-fs-amber/40 hover:text-fs-amber transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Try Fact Checker
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* ── Live Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 bg-fs-surface/60 backdrop-blur-md rounded-2xl border border-fs-border p-6 md:p-8 shadow-2xl"
        >
          {[
            { value: `${globalStats.total_analyses.toLocaleString()}+`, label: 'Analyses Run', color: '' },
            { value: `${globalStats.avg_confidence}%`, label: 'Avg Confidence', color: 'text-fs-cyan' },
            { value: `${globalStats.fake_percentage}%`, label: 'Fake Flagged', color: 'text-fs-crimson' },
            { value: `${globalStats.accuracy_from_feedback || '98.7'}%`, label: 'Verified Accuracy', color: 'text-fs-green' },
          ].map(({ value, label, color }, i) => (
            <div key={i} className={`text-center space-y-1 ${i > 0 ? 'border-l border-fs-border' : ''}`}>
              <p className={`text-2xl md:text-3xl font-extrabold font-mono ${color}`}>{value}</p>
              <p className="text-xs text-fs-muted uppercase font-mono tracking-wider">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Features Grid ── */}
        <div className="mt-24 md:mt-32">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">Why FakeShield?</h2>
            <p className="text-sm text-fs-muted max-w-lg mx-auto">
              A complete truth-verification platform built for the modern information age.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg, path }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => path && navigate(path)}
                className={`bg-fs-surface/40 border border-fs-border rounded-2xl p-6 hover:border-fs-cyan/20 transition-all group ${path ? 'cursor-pointer' : ''}`}
              >
                <div className={`w-11 h-11 rounded-xl ${bg} border flex items-center justify-center ${color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2 text-sm">{title}</h3>
                <p className="text-xs text-fs-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Live News Preview ── */}
        <div className="mt-24 md:mt-32 pb-8">
          <div className="bg-fs-surface border border-fs-border rounded-2xl p-6 md:p-10 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-fs-green bg-fs-green/10 border border-fs-green/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-fs-green animate-pulse" />
                    LIVE
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold">Live News Verification</h2>
                <p className="text-sm text-fs-muted mt-1">
                  Browse real-time news from top global sources and verify any article with one click.
                </p>
              </div>
              <button
                onClick={() => navigate('/news')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fs-cyan/10 border border-fs-cyan/30 text-fs-cyan text-sm font-mono hover:bg-fs-cyan/20 transition-all whitespace-nowrap"
              >
                Open News Feed <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Fake news cards preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { source: 'BBC News', title: 'Scientists discover new treatment for antibiotic-resistant infections', fake: false },
                { source: 'TechCrunch', title: 'Startup claims AI can predict market crashes with 100% accuracy', fake: true },
                { source: 'NY Times', title: 'Global climate summit reaches landmark emissions agreement', fake: false },
              ].map(({ source, title, fake }, i) => (
                <div key={i} className="bg-fs-bg rounded-xl border border-fs-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-fs-muted bg-fs-surface px-2 py-0.5 rounded-full border border-fs-border">{source}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${fake ? 'text-fs-crimson bg-fs-crimson/10 border border-fs-crimson/20' : 'text-fs-cyan bg-fs-cyan/10 border border-fs-cyan/20'}`}>
                      {fake ? '⚠ FAKE' : '✓ REAL'}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-snug">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How It Works ── */}
        <div className="mt-16 pb-16">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">How It Works</h2>
            <p className="text-sm text-fs-muted max-w-lg mx-auto">
              Three steps to instant truth verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Source Parsing', desc: 'Paste text or submit a URL. Our system cleans, tokenizes, and extracts the core textual representation.' },
              { step: '02', title: 'Vector Extraction', desc: 'Content is processed with our TF-IDF model, transforming text into a 5,000-dimensional semantic feature vector.' },
              { step: '03', title: 'Verdict Rendering', desc: 'Logistic Regression computes probability metrics and outputs an instant Fake/Real classification with confidence score.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-fs-surface/40 border border-fs-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-fs-cyan/10 border border-fs-cyan/20 flex items-center justify-center text-fs-cyan font-mono font-bold mb-4 text-sm">
                  {step}
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-fs-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        {!token && (
          <div className="pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center bg-gradient-to-br from-fs-cyan/10 to-fs-surface border border-fs-cyan/20 rounded-2xl p-10 space-y-5"
            >
              <div className="inline-flex p-3 bg-fs-cyan/10 rounded-full text-fs-cyan">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Ready to Stop Misinformation?</h2>
              <p className="text-sm text-fs-muted">
                Create your free account in seconds. Register with face biometrics for enhanced security.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-fs-cyan text-fs-bg font-bold text-sm hover:bg-fs-cyan/90 transition-all"
                >
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 rounded-xl border border-fs-border text-fs-text text-sm font-medium hover:border-fs-cyan/30 transition-all"
                >
                  Already a member? Login
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 pt-2">
                {['Free forever', 'No credit card', 'Face biometrics'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-fs-muted font-mono">
                    <CheckCircle className="w-3.5 h-3.5 text-fs-green" />{t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
