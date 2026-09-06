import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle, XCircle, HelpCircle, AlertTriangle,
  Zap, BookOpen, ExternalLink, RefreshCw, Lightbulb,
  ArrowRight, Sparkles
} from 'lucide-react';
import { factCheckAPI } from '../api/client';
import toast from 'react-hot-toast';

// ── Verdict Config ────────────────────────────────────────────────
const VERDICT_CONFIG = {
  'LIKELY TRUE': {
    icon: CheckCircle,
    bg: 'bg-fs-green/10',
    border: 'border-fs-green/30',
    text: 'text-fs-green',
    badge: 'bg-fs-green/20 border-fs-green/40',
    glow: 'shadow-[0_0_40px_rgba(0,255,136,0.12)]',
  },
  'LIKELY FALSE': {
    icon: XCircle,
    bg: 'bg-fs-crimson/10',
    border: 'border-fs-crimson/30',
    text: 'text-fs-crimson',
    badge: 'bg-fs-crimson/20 border-fs-crimson/40',
    glow: 'shadow-[0_0_40px_rgba(255,45,85,0.12)]',
  },
  'MIXED / PARTIAL': {
    icon: AlertTriangle,
    bg: 'bg-fs-amber/10',
    border: 'border-fs-amber/30',
    text: 'text-fs-amber',
    badge: 'bg-fs-amber/20 border-fs-amber/40',
    glow: 'shadow-[0_0_40px_rgba(255,179,0,0.12)]',
  },
  'UNVERIFIABLE': {
    icon: HelpCircle,
    bg: 'bg-fs-cyan/10',
    border: 'border-fs-cyan/30',
    text: 'text-fs-cyan',
    badge: 'bg-fs-cyan/20 border-fs-cyan/40',
    glow: 'shadow-[0_0_40px_rgba(0,212,255,0.10)]',
  },
};

// ── Confidence Ring ───────────────────────────────────────────────
const ConfidenceRing = ({ confidence, color }) => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;
  const colorMap = {
    green: '#00FF88', red: '#FF2D55', amber: '#FFB300', cyan: '#00D4FF',
  };
  const stroke = colorMap[color] || '#00D4FF';

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1A2540" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={stroke} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-black font-mono" style={{ color: stroke }}>{confidence}%</p>
        <p className="text-[8px] text-fs-muted font-mono uppercase">Match</p>
      </div>
    </div>
  );
};

// ── Result Card ───────────────────────────────────────────────────
const ResultCard = ({ result }) => {
  const cfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['UNVERIFIABLE'];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-6 space-y-5 ${cfg.bg} ${cfg.border} ${cfg.glow}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl border ${cfg.badge} flex-shrink-0`}>
          <Icon className={`w-7 h-7 ${cfg.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-2xl font-black font-mono tracking-wider ${cfg.text}`}>
            {result.verdict}
          </p>
          <p className="text-xs text-fs-muted font-mono mt-0.5 line-clamp-2">
            "{result.claim}"
          </p>
        </div>
        <ConfidenceRing confidence={result.confidence} color={result.verdict_color} />
      </div>

      {/* Explanation */}
      <div className="bg-fs-bg/50 rounded-xl p-4 border border-fs-border/40">
        <p className="text-sm text-fs-text leading-relaxed">{result.explanation}</p>
      </div>

      {/* Evidence */}
      {result.evidence && result.evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-fs-muted uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" /> Reference Sources
          </p>
          {result.evidence.map((ev, i) => (
            <div key={i} className="bg-fs-surface/60 rounded-xl border border-fs-border p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-fs-cyan bg-fs-cyan/10 border border-fs-cyan/20 px-2 py-0.5 rounded-full">
                  {ev.source}
                </span>
                {ev.url && (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-fs-muted hover:text-fs-cyan transition-colors font-mono"
                  >
                    <ExternalLink className="w-3 h-3" /> View Source
                  </a>
                )}
              </div>
              <p className="text-xs text-fs-muted leading-relaxed">{ev.snippet}</p>
            </div>
          ))}
        </div>
      )}

      {/* Searched Topics */}
      {result.searched_topics?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-fs-muted">Searched:</span>
          {result.searched_topics.map((t, i) => (
            <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fs-surface border border-fs-border text-fs-muted">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-fs-muted font-mono opacity-70">
        ⚠ This is AI-assisted verification using Wikipedia. Always cross-check with official authoritative sources.
      </p>
    </motion.div>
  );
};

// ── Loading Skeleton ──────────────────────────────────────────────
const CheckingAnimation = ({ claim }) => {
  const steps = [
    'Extracting key entities...',
    'Searching Wikipedia...',
    'Analyzing evidence...',
    'Computing verdict...',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % steps.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-fs-surface border border-fs-border rounded-2xl p-8 text-center space-y-4"
    >
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-fs-cyan/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-fs-cyan animate-spin" />
        <div className="absolute inset-2 rounded-full border-t border-fs-cyan/40 animate-spin" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-t border-cyan-500/40 animate-spin" style={{ animationDuration: '1.5s' }} />
        <Search className="absolute inset-0 m-auto w-6 h-6 text-cyan-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">Verifying Claim</p>
        <p className="text-xs text-slate-500 font-mono mt-1 line-clamp-1">"{claim}"</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-xs text-cyan-700 font-mono"
        >
          {steps[step]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main FactCheck Component ──────────────────────────────────────
const FactCheck = () => {
  const [claim, setClaim] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [examples, setExamples] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    factCheckAPI.getExamples()
      .then(res => setExamples(res.examples || []))
      .catch(() => setExamples([
        'COVID-19 mRNA vaccines alter human DNA permanently.',
        'Drinking hot water with lemon kills the coronavirus in the throat.',
        'Ivermectin is an effective prevention and cure for COVID-19 according to medical trials.',
        'Regular physical exercise reduces the risk of severe COVID-19 hospitalisation.',
      ]));
  }, []);

  const handleCheck = async () => {
    if (!claim.trim()) {
      toast.error('Please enter a healthcare claim to verify.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await factCheckAPI.checkClaim(claim.trim());
      setResult(res);
      toast.success('Clinical fact-check complete');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fact-check request failed. Please verify API status.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCheck();
    }
  };

  const handleExample = (ex) => {
    setClaim(ex);
    setResult(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative min-h-screen bg-[#FFE6EE] text-slate-900 pt-12 pb-16 font-sans transition-colors duration-300">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-pink-300/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-cyan-200/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
        {/* Header with TrustMe Pulse Icon */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#D6EBFC]/95 border border-pink-300 rounded-full text-xs font-mono text-pink-800 mb-2 shadow-sm hover:border-pink-400 hover:shadow-md transition-all">
            <TrustMePulseBadge size="sm" showLabel={false} />
            <span className="font-bold">TrustMe AI Medical & Health Claim Fact-Checker</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900"
          >
            Verify <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">Health & Medical Claims</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-700 text-sm max-w-xl mx-auto leading-relaxed"
          >
            Verify viral medical claims, vaccine rumors, and unverified treatments against authoritative medical knowledge bases.
          </motion.p>
        </div>

        {/* Input Box (Dense Light Blue, Zero White, Rich Shadow) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-6 space-y-4 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300"
        >
          <label className="text-xs font-mono text-pink-800 uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <Search className="w-3.5 h-3.5 text-teal-700" /> Enter Healthcare Claim or Remedy
          </label>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={claim}
              onChange={e => setClaim(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "COVID-19 mRNA vaccines alter human DNA" or "Drinking bleach cures coronavirus infection"'
              rows={3}
              maxLength={500}
              className="w-full bg-[#C8E4FA] border border-pink-300 focus:bg-[#D6EBFC] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 text-sm rounded-2xl p-4 resize-none focus:outline-none transition-colors placeholder:text-slate-500 font-mono shadow-inner"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono">
              {claim.length}/500
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10.5px] text-slate-600 font-mono">Press Enter or click Verify</p>
            <button
              onClick={handleCheck}
              disabled={loading || !claim.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs font-mono shadow-md shadow-cyan-500/20 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                <><Zap className="w-4 h-4" /> Verify Claim</>
              )}
            </button>
          </div>
        </motion.div>

        {/* Example Claims (Dense Light Blue, Zero White, Hover Lift) */}
        {!result && !loading && examples.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 text-left"
          >
            <p className="text-xs font-mono text-pink-800 uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Try these clinical examples
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(ex)}
                  className="text-left text-xs text-slate-800 font-mono p-3.5 rounded-2xl bg-[#D6EBFC] border border-pink-300 hover:border-pink-400 hover:bg-[#C8E4FA] hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 transition-all flex items-start gap-2.5 group shadow-sm cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-700 flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                  <span className="line-clamp-2">{ex}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading Animation */}
        <AnimatePresence>
          {loading && <CheckingAnimation claim={claim} />}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <div className="space-y-4">
              <ResultCard result={result} />
              <div className="text-center">
                <button
                  onClick={() => { setResult(null); setClaim(''); inputRef.current?.focus(); }}
                  className="text-xs font-mono font-bold text-pink-800 hover:text-pink-950 underline transition-colors"
                >
                  ← Check another health claim
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* 3 Step Workflow Footer Cards (Dense Light Blue, Zero White, Hover Lift) */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left"
          >
            {[
              { step: '01', title: 'Extract Entities', desc: 'Key medical entities, symptoms, and therapies are extracted from the claim.' },
              { step: '02', title: 'Clinical Literature Query', desc: 'The system queries medical repositories for relevant peer-reviewed information.' },
              { step: '03', title: 'Score & Clinical Verdict', desc: 'Attribution overlap scoring and consistency checks yield the final veracity verdict.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-[#D6EBFC]/95 border border-pink-300 rounded-2xl p-5 space-y-2 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 hover:-translate-y-1 transition-all duration-300">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm shadow-cyan-500/20">
                  {step}
                </div>
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FactCheck;
