import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldX, ThumbsUp, ThumbsDown, Share2,
  Download, ChevronDown, ChevronUp, AlertOctagon, CheckCircle2,
  HelpCircle, Compass, Cpu, Layers
} from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import ProbabilityBar from './ProbabilityBar';
import KeywordCloud from './KeywordCloud';
import EvidencePanel from './EvidencePanel';
import { useState } from 'react';
import { feedbackAPI } from '../../api/client';
import useAuthStore from '../../store/authStore';
import { exportToPDF } from '../../utils/pdfExport';
import toast from 'react-hot-toast';

const ResultCard = ({ result }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const { token } = useAuthStore();

  const isFake = result.prediction === 'fake';
  const isUncertain = result.prediction === 'uncertain';
  const isOutOfScope = result.verification?.verdict === 'OUT_OF_SCOPE';
  const isUnverified = result.verification?.verdict === 'UNVERIFIED' || isUncertain;

  const handleFeedback = async (isCorrect) => {
    if (!token) {
      toast.error('Please login to submit feedback');
      return;
    }
    try {
      await feedbackAPI.submit(result.id, { is_correct: isCorrect });
      setFeedbackGiven(isCorrect);
      toast.success('Thanks for your feedback!');
    } catch {
      toast.error('Failed to submit feedback');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/result/${result.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Result link copied to clipboard!');
  };

  // Header icon & color configuration
  let headerColor = 'text-fs-green';
  let borderColor = 'border-fs-cyan/50 shadow-[0_0_40px_rgba(0,212,255,0.1)]';
  let verdictText = 'VERIFIED REAL';
  let HeaderIcon = ShieldCheck;

  if (isFake) {
    headerColor = 'text-fs-crimson';
    borderColor = 'border-fs-crimson/50 shadow-[0_0_40px_rgba(255,45,85,0.1)]';
    verdictText = 'DISPUTED / REFUTED';
    HeaderIcon = ShieldX;
  } else if (isOutOfScope) {
    headerColor = 'text-indigo-400';
    borderColor = 'border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.1)]';
    verdictText = 'OUT OF SCOPE';
    HeaderIcon = Compass;
  } else if (isUncertain || isUnverified) {
    headerColor = 'text-amber-400';
    borderColor = 'border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.1)]';
    verdictText = 'INCONCLUSIVE';
    HeaderIcon = HelpCircle;
  }

  return (
    <div className="space-y-6">
      {/* ── Evidence Pipeline Panel (Primary Authority in v2) ── */}
      {result.verification && (
        <EvidencePanel verification={result.verification} />
      )}

      {/* ── Secondary writing-style signal: keyword cloud (collapsed) ── */}
      {result.keywords && result.keywords.length > 0 && (
        <div className="border border-fs-border rounded-xl overflow-hidden">
          <button
            onClick={() => setKeywordsOpen(o => !o)}
            className="w-full p-4 bg-fs-bg/40 flex items-center justify-between hover:bg-fs-bg/65 transition-all"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-fs-muted" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-fs-text">
                Secondary writing-style signal (TF-IDF, trained on CoAID + FakeHealth)
              </span>
            </div>
            {keywordsOpen ? (
              <ChevronUp className="w-4 h-4 text-fs-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-fs-muted" />
            )}
          </button>
          <AnimatePresence>
            {keywordsOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-fs-bg/20 border-t border-fs-border">
                  <p className="text-[11px] text-fs-muted mb-3">
                    Words that pushed the TF-IDF baseline classifier toward Real (cyan) or Fake (rose).
                    This is a writing-style signal only — the evidence pipeline above is the primary truth authority.
                  </p>
                  <KeywordCloud keywords={result.keywords} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Primary Audit Summary Card ── */}
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className={`rounded-2xl border-2 p-6 md:p-8 transition-all duration-500 bg-fs-surface ${borderColor}`}
      >
        {/* Verdict Header */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={isFake ? { rotate: [0, -6, 6, 0] } : { scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <HeaderIcon className={`w-14 h-14 ${headerColor}`} strokeWidth={1.5} />
          </motion.div>
          <div>
            <p className="text-xs text-fs-muted uppercase tracking-[0.3em] font-mono mb-1">
              Overall Audit Verdict
            </p>
            <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${headerColor}`}>
              {verdictText}
            </h2>
          </div>
        </div>

        {/* Combined Verdict Callout Card */}
        <div className={`p-4 mb-6 rounded-xl border-l-4 flex flex-col gap-3
          ${isFake
            ? 'bg-fs-crimson/5 border-fs-crimson'
            : isOutOfScope
              ? 'bg-indigo-500/5 border-indigo-500'
              : isUncertain
                ? 'bg-amber-500/5 border-amber-500'
                : 'bg-fs-green/5 border-fs-green'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isFake ? (
              <AlertOctagon className="w-5 h-5 text-fs-crimson" />
            ) : isOutOfScope ? (
              <Compass className="w-5 h-5 text-indigo-400" />
            ) : isUncertain ? (
              <HelpCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-fs-green" />
            )}
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              {isFake
                ? 'CRITICAL MISINFORMATION ALERT'
                : isOutOfScope
                  ? 'NON-CLINICAL DOMAIN'
                  : isUncertain
                    ? 'INSUFFICIENT EVIDENCE'
                    : 'VERIFIED CONTENT SUMMARY'
              }
            </span>
          </div>

          <p className="text-xs text-fs-text leading-relaxed">
            {isOutOfScope
              ? 'This content discusses topics outside the verified health domain (COVID-19, TB, Dengue, Diabetes). No clinical verdict is asserted.'
              : isFake
                ? `Evidence verification flagged this claim. Medical guidelines contradict assertions with ${result.confidence}% confidence. Credibility score: ${result.credibility_score}/100.`
                : isUnverified
                  ? `Clinical guidelines in our corpus do not provide enough matching evidence to confirm or refute these claims. Credibility score: ${result.credibility_score}/100.`
                  : `Evidence verification corroborated this content against authentic medical literature with ${result.confidence}% confidence. Credibility score: ${result.credibility_score}/100.`
            }
          </p>

          {/* Dynamic Severity Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border
                    ${isFake
                      ? 'bg-fs-crimson/10 border-fs-crimson/20 text-fs-crimson'
                      : 'bg-fs-green/10 border-fs-green/20 text-fs-green'
                    }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Confidence & Probabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {!isUnverified && !isOutOfScope ? (
            <ConfidenceMeter value={result.confidence} isFake={isFake} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-xs text-fs-muted uppercase tracking-widest font-mono">Evidence Confidence</span>
              <span className="text-5xl font-black font-mono text-fs-muted">—</span>
              <span className="text-[11px] text-fs-muted font-mono">Insufficient evidence to score</span>
            </div>
          )}
          <div className="space-y-4">
            <ProbabilityBar
              label="Real Probability"
              value={result.real_probability}
              color="green"
            />
            <ProbabilityBar
              label="Fake Probability"
              value={result.fake_probability}
              color="crimson"
            />
            <div className="flex items-center gap-4 text-xs text-fs-muted font-mono pt-1">
              <span>Word Count: {result.word_count}</span>
              <span>•</span>
              <span>Pipeline: {result.model_version || 'v2-evidence'}</span>
            </div>
          </div>
        </div>

        {/* Keywords moved below EvidencePanel — see collapsed section above main card */}

        {/* Model Explainability Collapsible Accordion (Secondary Writing-Style Signal) */}
        {result.explanations && result.explanations.length > 0 && (
          <div className="mb-6 border border-fs-border rounded-xl overflow-hidden">
            <button
              onClick={() => setIsExplainOpen(!isExplainOpen)}
              className="w-full p-4 bg-fs-bg/40 flex items-center justify-between hover:bg-fs-bg/65 transition-all"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-fs-amber" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-fs-text">
                  Writing-Style Signal (Secondary Model Features)
                </span>
              </div>
              {isExplainOpen ? (
                <ChevronUp className="w-4 h-4 text-fs-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-fs-muted" />
              )}
            </button>
            <AnimatePresence>
              {isExplainOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-fs-bg/20 border-t border-fs-border space-y-3.5">
                    <p className="text-[11px] text-fs-muted leading-relaxed">
                      Below are the secondary writing-style TF-IDF features from the baseline classifier trained on CoAID & FakeHealth (10,000 vocab).
                      Note: In TrustMe AI v2, official evidence retrieval acts as the primary truth authority.
                    </p>
                    <div className="space-y-2.5">
                      {result.explanations.map((ex) => {
                        const isReal = ex.direction === 'real';
                        const absWeight = Math.min(100, Math.abs(ex.contribution) * 150);
                        return (
                          <div key={ex.word} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-semibold text-fs-text">"{ex.word}"</span>
                              <span className={isReal ? 'text-fs-green' : 'text-fs-crimson'}>
                                {ex.contribution > 0 ? '+' : ''}
                                {ex.contribution.toFixed(4)}{' '}
                                <span className="text-[9px] opacity-75">
                                  ({isReal ? 'Style: Real' : 'Style: Fake'})
                                </span>
                              </span>
                            </div>
                            <div className="h-1 bg-fs-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isReal ? 'bg-fs-green' : 'bg-fs-crimson'}`}
                                style={{ width: `${Math.max(5, absWeight)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-fs-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-fs-muted font-mono mr-2">Audit Feedback:</span>
            <button
              onClick={() => handleFeedback(true)}
              className={`p-2 rounded-lg transition-all ${feedbackGiven === true ? 'bg-fs-green/20 text-fs-green' : 'text-fs-muted hover:text-fs-green hover:bg-fs-green/10'}`}
              title="Report audit as accurate"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className={`p-2 rounded-lg transition-all ${feedbackGiven === false ? 'bg-fs-crimson/20 text-fs-crimson' : 'text-fs-muted hover:text-fs-crimson hover:bg-fs-crimson/10'}`}
              title="Report audit as inaccurate"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportToPDF(result)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-fs-green/10 border border-fs-green/20 text-fs-green hover:bg-fs-green/25 transition-all text-xs font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-fs-cyan/10 border border-fs-cyan/20 text-fs-cyan hover:bg-fs-cyan/25 transition-all text-xs font-mono"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Audit
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultCard;
