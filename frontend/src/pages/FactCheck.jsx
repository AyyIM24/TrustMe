import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle, XCircle, HelpCircle, AlertTriangle,
  Zap, BookOpen, ExternalLink, RefreshCw, Lightbulb,
  ArrowRight, ShieldCheck, Database, AlertOctagon, FlaskConical
} from 'lucide-react';
import { factCheckAPI } from '../api/client';
import toast from 'react-hot-toast';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';
import EvidencePanel from '../components/analyze/EvidencePanel';

// ── Verdict Config ────────────────────────────────────────────────
const VERDICT_CONFIG = {
  'Supported by sources': {
    icon: CheckCircle,
    bg: 'bg-emerald-50/95',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100/90 border-emerald-300 text-emerald-800',
    glow: 'shadow-card-soft shadow-emerald-500/10',
  },
  'LIKELY TRUE': {
    icon: CheckCircle,
    bg: 'bg-emerald-50/95',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100/90 border-emerald-300 text-emerald-800',
    glow: 'shadow-card-soft shadow-emerald-500/10',
  },
  'LIKELY FALSE': {
    icon: XCircle,
    bg: 'bg-rose-50/95',
    border: 'border-rose-300',
    text: 'text-rose-800',
    badge: 'bg-rose-100/90 border-rose-300 text-rose-800',
    glow: 'shadow-card-soft shadow-rose-500/10',
  },
  'PARTIALLY VERIFIED': {
    icon: AlertTriangle,
    bg: 'bg-amber-50/95',
    border: 'border-amber-300',
    text: 'text-amber-800',
    badge: 'bg-amber-100/90 border-amber-300 text-amber-800',
    glow: 'shadow-card-soft shadow-amber-500/10',
  },
  'MIXED / PARTIAL': {
    icon: AlertTriangle,
    bg: 'bg-amber-50/95',
    border: 'border-amber-300',
    text: 'text-amber-800',
    badge: 'bg-amber-100/90 border-amber-300 text-amber-800',
    glow: 'shadow-card-soft shadow-amber-500/10',
  },
  'UNVERIFIABLE': {
    icon: HelpCircle,
    bg: 'bg-[#D6EBFC]/95',
    border: 'border-pink-300',
    text: 'text-cyan-900',
    badge: 'bg-[#C8E4FA] border-pink-300 text-cyan-800',
    glow: 'shadow-card-soft shadow-cyan-500/10',
  },
};

// ── Confidence Ring ───────────────────────────────────────────────
const ConfidenceRing = ({ confidence, color, verdict }) => {
  const isEvaluated = verdict === 'Supported by sources' || verdict === 'LIKELY TRUE' || verdict === 'LIKELY FALSE' || verdict === 'SUPPORTED' || verdict === 'REFUTED';
  const showScore = isEvaluated && confidence > 0;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (showScore ? (confidence / 100) : 0) * circumference;
  const colorMap = {
    green: '#059669', red: '#E11D48', amber: '#D97706', cyan: '#0891B2',
  };
  const stroke = colorMap[color] || '#0891B2';

  return (
    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#FBCFE8" strokeWidth="6" />
        {showScore && (
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={stroke} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        )}
      </svg>
      <div className="text-center">
        <p className="text-2xl font-black font-mono" style={{ color: showScore ? stroke : '#64748B' }}>
          {showScore ? `${confidence}%` : '-'}
        </p>
        <p className="text-[8px] text-slate-600 font-mono font-bold uppercase tracking-wider">
          {showScore ? 'Evidence' : 'Evidence'}
        </p>
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
      className={`rounded-3xl border p-6 md:p-8 space-y-6 shadow-card-hover hover:border-pink-400 transition-all ${cfg.bg} ${cfg.border} ${cfg.glow}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`p-3 rounded-2xl border ${cfg.badge} flex-shrink-0 shadow-sm`}>
            <Icon className={`w-7 h-7 ${cfg.text}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${cfg.text}`}>
              {result.verdict}
            </p>
            <p className="text-xs text-slate-700 font-medium mt-1 line-clamp-2 leading-relaxed">
              "{result.claim}"
            </p>
          </div>
        </div>
        <ConfidenceRing confidence={result.confidence} color={result.verdict_color} verdict={result.verdict} />
      </div>

      {/* Explanation */}
      <div className="bg-[#C8E4FA] rounded-2xl p-4 sm:p-5 border border-pink-300 shadow-inner">
        <p className="text-sm text-slate-800 leading-relaxed font-medium">{result.explanation}</p>
      </div>

      {/* Disease Scope Badge */}
      {result.disease_scope && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-800 flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            In-Scope Disease: {result.disease_scope}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Verified against WHO / CDC / NIH</span>
        </div>
      )}

      {/* Disease Knowledge Base Panel */}
      {result.kb_result && <DiseaseKBPanel kbResult={result.kb_result} />}

      {/* TrustMe AI v2 Evidence Verification Panel */}
      {result.verification && (
        <div className="pt-2">
          <EvidencePanel verification={result.verification} />
        </div>
      )}

      {/* Authenticated Evidence Literature & References */}
      {result.evidence && result.evidence.length > 0 && !result.verification && (
        <div className="space-y-2.5">
          <p className="text-xs font-mono font-bold text-pink-800 uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-700" /> Authenticated Evidence Literature
          </p>
          <div className="space-y-2">
            {result.evidence.map((ev, i) => (
              <div key={i} className="bg-[#C8E4FA] rounded-2xl border border-pink-300 p-4 space-y-2 shadow-sm hover:shadow-md hover:border-pink-400 transition-all">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-cyan-800 bg-[#D6EBFC] border border-pink-300 px-3 py-1 rounded-full shadow-sm">
                    {ev.source}
                  </span>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-bold font-mono transition-colors underline"
                    >
                      <ExternalLink className="w-3 h-3" /> View Official Source
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ev.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searched Topics */}
      {result.searched_topics?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-mono font-bold text-slate-600">Searched Topics:</span>
          {result.searched_topics.map((t, i) => (
            <span key={i} className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#C8E4FA] border border-pink-300 text-cyan-900 shadow-sm">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-500 font-mono">
        ⚠ AI-assisted verification using WHO/CDC/NIH Knowledge Base + Wikipedia. Always consult a qualified healthcare provider.
      </p>
    </motion.div>
  );
};

// ── Disease KB Panel ─────────────────────────────────────────────
const DiseaseKBPanel = ({ kbResult }) => {
  if (!kbResult) return null;

  const verdictColors = {
    'LIKELY TRUE': 'text-emerald-800 bg-emerald-50 border-emerald-300',
    'LIKELY FALSE': 'text-rose-800 bg-rose-50 border-rose-300',
    'MIXED / PARTIAL': 'text-amber-800 bg-amber-50 border-amber-300',
    'UNVERIFIABLE': 'text-cyan-800 bg-[#D6EBFC] border-pink-300',
  };
  const badgeClass = verdictColors[kbResult.kb_verdict] || verdictColors['UNVERIFIABLE'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-cyan-300 bg-[#EAF6FF] p-5 space-y-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-100 border border-cyan-300">
            <Database className="w-4 h-4 text-cyan-700" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-cyan-700 uppercase tracking-widest">Disease Knowledge Base</p>
            <p className="text-xs font-bold text-slate-800">{kbResult.disease_display} — WHO / CDC / NIH</p>
          </div>
        </div>
        <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${badgeClass}`}>
          KB: {kbResult.kb_verdict}
        </span>
      </div>

      {/* KB Explanation */}
      <p className="text-xs text-slate-700 leading-relaxed bg-white/60 rounded-xl p-3 border border-cyan-200">
        {kbResult.kb_explanation}
      </p>

      {/* Myth Signals */}
      {kbResult.myth_signals && kbResult.myth_signals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> Misinformation Patterns Detected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {kbResult.myth_signals.map((myth, i) => (
              <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
                ✕ {myth}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Supporting Facts */}
      {kbResult.supporting_facts && kbResult.supporting_facts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Verified Facts from Medical KB
          </p>
          <div className="space-y-1.5">
            {kbResult.supporting_facts.map((sf, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-200">
                <span className="text-emerald-600 font-bold flex-shrink-0">✓</span>
                <span className="leading-relaxed">{sf.fact}</span>
                <span className="ml-auto text-[10px] font-mono text-emerald-600 flex-shrink-0 font-bold">{sf.relevance}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authentic Sources */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
          <FlaskConical className="w-3 h-3" /> Authentic Medical Sources
        </p>
        <div className="flex flex-wrap gap-2">
          {kbResult.authentic_sources.map((src, i) => (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-800 bg-[#D6EBFC] border border-cyan-300 px-3 py-1.5 rounded-full hover:bg-cyan-100 hover:border-cyan-400 transition-all"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              {src.name}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ── Loading Skeleton ──────────────────────────────────────────────
const CheckingAnimation = ({ claim }) => {
  const steps = [
    'Detecting disease scope (COVID-19, Cancer, Diabetes, Vaccines)...',
    'Checking WHO/CDC/NIH knowledge base...',
    'Searching Wikipedia for additional evidence...',
    'Cross-referencing authentic sources...',
    'Computing final verdict...',
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
      className="bg-[#D6EBFC]/95 border border-pink-300 rounded-3xl p-8 text-center space-y-4 shadow-card-soft"
    >
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-pink-200" />
        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-t border-teal-400 animate-spin" style={{ animationDuration: '1.5s' }} />
        <Search className="absolute inset-0 m-auto w-6 h-6 text-cyan-700" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">Verifying Claim</p>
        <p className="text-xs text-slate-600 font-mono mt-1 line-clamp-1 font-medium">"{claim}"</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-xs text-cyan-800 font-mono font-bold"
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
      .then(res => setExamples(res.data?.examples || res.examples || []))
      .catch(() => setExamples([
        'Papaya leaf juice cures dengue fever and permanently raises platelets.',
        'Drinking Karela bitter gourd juice cures diabetes and eliminates need for insulin.',
        'Tuberculosis is a genetic hereditary disease that cannot be cured by antibiotics.',
        'Cow urine gomutra cures cancer tumors according to traditional healers.',
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
      const res = await factCheckAPI.check(claim.trim());
      const data = res.data || res;
      setResult(data);
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
              { step: '01', title: 'Detect Disease Scope', desc: 'The system detects if the claim is about COVID-19, Cancer, Diabetes, or Vaccines — our defined project scope.' },
              { step: '02', title: 'WHO/CDC/NIH Knowledge Base', desc: 'Claims are checked against verified medical facts and known myth patterns from WHO, CDC, and NIH.' },
              { step: '03', title: 'Wikipedia + Verdict', desc: 'Additional Wikipedia evidence is gathered. Both signals are combined to give a final veracity verdict with source links.' },
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
