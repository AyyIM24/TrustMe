import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldX, ThumbsUp, ThumbsDown, Share2,
  Download, ChevronDown, ChevronUp, AlertOctagon, CheckCircle2, Cpu
} from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import ProbabilityBar from './ProbabilityBar';
import KeywordCloud from './KeywordCloud';
import { useState } from 'react';
import { feedbackAPI } from '../../api/client';
import useAuthStore from '../../store/authStore';
import { exportToPDF } from '../../utils/pdfExport';
import toast from 'react-hot-toast';

const ResultCard = ({ result }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const { token } = useAuthStore();
  const isFake = result.prediction === 'fake';

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

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className={`rounded-2xl border-2 p-6 md:p-8 transition-all duration-500 bg-fs-surface
        ${isFake
          ? 'border-fs-crimson/50 shadow-[0_0_40px_rgba(255,45,85,0.1)]'
          : 'border-fs-cyan/50 shadow-[0_0_40px_rgba(0,212,255,0.1)]'
        }`}
    >
      {/* Verdict Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          animate={isFake ? { rotate: [0, -8, 8, 0] } : { scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {isFake
            ? <ShieldX className="w-14 h-14 text-fs-crimson" strokeWidth={1.5} />
            : <ShieldCheck className="w-14 h-14 text-fs-green" strokeWidth={1.5} />
          }
        </motion.div>
        <div>
          <p className="text-xs text-fs-muted uppercase tracking-[0.3em] font-mono mb-1">
            Central Verdict
          </p>
          <h2 className={`text-3xl md:text-4xl font-black tracking-tight
            ${isFake ? 'text-fs-crimson' : 'text-fs-green'}`}
          >
            {isFake ? 'DISPUTED CLAIM' : 'VERIFIED REAL'}
          </h2>
        </div>
      </div>

      {/* Combined Verdict Callout Card */}
      <div className={`p-4 mb-6 rounded-xl border-l-4 flex flex-col gap-3
        ${isFake
          ? 'bg-fs-crimson/5 border-fs-crimson'
          : 'bg-fs-green/5 border-fs-green'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isFake ? (
            <AlertOctagon className="w-5 h-5 text-fs-crimson" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-fs-green" />
          )}
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            {isFake ? 'CRITICAL RISK ALERT' : 'SECURE VERDICT SNAPSHOT'}
          </span>
        </div>
        <p className="text-xs text-fs-text leading-relaxed">
          {isFake
            ? `Threat verification systems flagged this claim. ML predicts fake with ${result.confidence}% confidence. Credibility rating is LOW (${result.credibility_score}/100).`
            : `System verification successfully cleared this claim. ML predicts real with ${result.confidence}% confidence. Credibility rating is HIGH (${result.credibility_score}/100).`
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
        <ConfidenceMeter value={result.confidence} isFake={isFake} />
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
            <span>Analyzer Version: {result.model_version}</span>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {result.keywords && result.keywords.length > 0 && (
        <div className="mb-6 bg-fs-bg/40 border border-fs-border/60 p-4 rounded-xl">
          <p className="text-xs text-fs-muted uppercase tracking-[0.2em] font-mono mb-3">
            Threat Highlight Keywords
          </p>
          <KeywordCloud keywords={result.keywords} />
        </div>
      )}


      {/* Model Explainability Collapsible Accordion */}
      {result.explanations && result.explanations.length > 0 && (
        <div className="mb-6 border border-fs-border rounded-xl overflow-hidden">
          <button
            onClick={() => setIsExplainOpen(!isExplainOpen)}
            className="w-full p-4 bg-fs-bg/40 flex items-center justify-between hover:bg-fs-bg/65 transition-all"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-fs-amber" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-fs-text">
                Why did the model predict this?
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
                    Below are the top 5 TF-IDF features with their regression model coefficients.
                    Positive weights drag towards REAL news, negative weights tilt towards FAKE.
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
                                ({isReal ? 'Supports Real' : 'Supports Fake'})
                              </span>
                            </span>
                          </div>
                          {/* Weight bar */}
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
          <span className="text-xs text-fs-muted font-mono mr-2">Verify Audit Accuracy:</span>
          <button
            onClick={() => handleFeedback(true)}
            className={`p-2 rounded-lg transition-all ${feedbackGiven === true ? 'bg-fs-green/20 text-fs-green' : 'text-fs-muted hover:text-fs-green hover:bg-fs-green/10'}`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback(false)}
            className={`p-2 rounded-lg transition-all ${feedbackGiven === false ? 'bg-fs-crimson/20 text-fs-crimson' : 'text-fs-muted hover:text-fs-crimson hover:bg-fs-crimson/10'}`}
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
  );
};

export default ResultCard;
