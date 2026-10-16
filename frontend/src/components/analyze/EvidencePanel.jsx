import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, HelpCircle, Compass,
  ExternalLink, ChevronDown, ChevronUp, FileText,
  Layers, Check, X, AlertCircle, Sparkles, BookOpen,
  Flag, MessageSquare, Send
} from 'lucide-react';
import { feedbackAPI } from '../../api/client';
import toast from 'react-hot-toast';

const VERDICT_STYLES = {
  RELIABLE: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: ShieldCheck,
    title: 'Consistent with guidelines',
    subtitle: 'All extracted health assertions are directly supported by official WHO, CDC, or MoHFW medical guidelines.',
    showConfidence: true,
  },
  PARTIALLY_VERIFIED: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: HelpCircle,
    title: 'PARTIALLY VERIFIED',
    subtitle: 'Some claims could not be verified against authoritative medical guidelines.',
    showConfidence: false,
  },
  MISLEADING: {
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: ShieldAlert,
    title: 'POTENTIALLY MISLEADING — REFUTED',
    subtitle: 'Contains medical assertions contradicted by authentic clinical evidence from official health bodies.',
    showConfidence: true,
  },
  UNVERIFIED: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: HelpCircle,
    title: 'INCONCLUSIVE — UNVERIFIED',
    subtitle: 'Authoritative medical guidelines provide insufficient matching evidence in our corpus to confirm or refute these claims.',
    showConfidence: false,  // P0.2: Never show % for uncertain
  },
  OUT_OF_SCOPE: {
    border: 'border-indigo-500/50',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: Compass,
    title: 'OUT OF CLINICAL SCOPE',
    subtitle: 'This article falls outside the current supported diseases (COVID-19, Tuberculosis, Dengue, and Diabetes). TrustMe AI v2 does not guess without verified evidence.',
    showConfidence: false,  // P0.2: Never show % for abstentions
  },
};

const STANCE_BADGES = {
  SUPPORTED: {
    label: 'Supported',
    bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    icon: Check,
  },
  REFUTED: {
    label: 'Refuted',
    bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
    icon: X,
  },
  NOT_ENOUGH_EVIDENCE: {
    label: 'Inconclusive',
    bg: 'bg-slate-500/15 border-slate-500/40 text-slate-300',
    icon: AlertCircle,
  },
};

const DISEASE_LABELS = {
  covid19: 'COVID-19 (MoHFW / WHO Guidelines)',
  tuberculosis: 'Tuberculosis (NTEP / Ni-kshay Protocols)',
  dengue: 'Dengue & Platelet Management (NVBDCP)',
  diabetes: 'Diabetes Care (ICMR-INDIAB Guidelines)',
};

// ── Report Incorrect Result Widget ────────────────────────────────────────────
function ReportResultWidget({ analysisId, claim, verdict }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      if (analysisId) {
        await feedbackAPI.submit(analysisId, { is_correct: false, comment });
      }
      setSubmitted(true);
      toast.success('Feedback submitted — thank you!');
    } catch {
      // If no analysis ID (scanner page) or auth not available, save locally
      const reports = JSON.parse(localStorage.getItem('trustme_reports') || '[]');
      reports.push({ verdict, claim: claim?.slice(0, 200), comment, timestamp: new Date().toISOString() });
      localStorage.setItem('trustme_reports', JSON.stringify(reports));
      setSubmitted(true);
      toast.success('Report saved — thank you!');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 text-center">
        ✓ Report received. Thank you for helping improve TrustMe AI.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Report incorrect result
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <MessageSquare className="w-3 h-3" />
                Why is this result incorrect?
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Describe the issue (e.g., wrong verdict, missing evidence, incorrect claim extraction...)"
                rows={3}
                className="w-full text-xs bg-black/40 border border-white/10 rounded-lg p-2 text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-rose-500/50"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs font-mono text-slate-500 hover:text-slate-300 px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!comment.trim() || submitting}
                  className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-lg hover:bg-rose-500/30 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  {submitting ? 'Sending...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const EvidencePanel = ({ verification, analysisId }) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  if (!verification) return null;

  const verdictKey = verification.verdict || 'UNVERIFIED';
  const style = VERDICT_STYLES[verdictKey] || VERDICT_STYLES.UNVERIFIED;
  const VerdictIcon = style.icon;
  const diseaseName = verification.disease ? DISEASE_LABELS[verification.disease] || verification.disease.toUpperCase() : null;
  const confPct = verification.confidence <= 1.0
    ? Math.round(verification.confidence * 100)
    : Math.round(verification.confidence);

  // P0.4: derive a representative claim for the report widget
  const topClaim = verification.claims?.[0]?.claim || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border-2 ${style.border} ${style.bg} p-6 md:p-8 backdrop-blur-md shadow-xl transition-all duration-300 space-y-6`}
    >
      {/* ── Top Header & Verdict ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-start sm:items-center gap-4">
          <div className={`p-3.5 rounded-2xl bg-black/30 border border-white/10 ${style.text} shadow-inner`}>
            <VerdictIcon className="w-8 h-8" strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
                Evidence Pipeline v2
              </span>
              {diseaseName && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  {diseaseName}
                </span>
              )}
            </div>
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${style.text}`}>
              {style.title}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
              {verification.summary || style.subtitle}
            </p>
          </div>
        </div>

        {/* P0.2: Only show confidence % for RELIABLE and MISLEADING verdicts */}
        {style.showConfidence && confPct > 0 && (
          <div className="sm:text-right flex-shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Evidence Strength
            </span>
            <span
              className={`text-2xl font-mono font-black ${style.text}`}
              title="NLI model probability score — not the probability that this claim is true"
            >
              {confPct}%
            </span>
            <span className="block text-[9px] font-mono text-slate-500">
              NLI model score ⓘ
            </span>
          </div>
        )}
      </div>

      {/* ── Known Myth Callout (if matched) ────────────────────────── */}
      {verification.known_myth_match && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold font-mono uppercase text-amber-300 tracking-wider">
              Documented Misinformation Pattern
            </span>
            <p className="text-slate-300 leading-relaxed">
              Matches documented health debunk: <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">"{verification.known_myth_match.myth}"</code>.
              Official medical advisories explicitly advise against relying on this unverified intervention.
            </p>
          </div>
        </div>
      )}

      {/* ── Claims & Cross-Referenced Evidence ─────────────────────── */}
      {verification.claims && verification.claims.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                Verified Claims & Authoritative Corpus ({verification.claims.length})
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              WHO • CDC • MoHFW • ICMR
            </span>
          </div>

          <div className="space-y-4">
            {verification.claims.map((claimItem, idx) => {
              const stanceStyle = STANCE_BADGES[claimItem.stance] || STANCE_BADGES.NOT_ENOUGH_EVIDENCE;
              const StanceIcon = stanceStyle.icon;
              // P0.2: Only show score for SUPPORTED/REFUTED, not for NOT_ENOUGH_EVIDENCE
              const showScore = claimItem.stance === 'SUPPORTED' || claimItem.stance === 'REFUTED';

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-4 hover:border-white/20 transition-all duration-200"
                >
                  {/* Claim Header & Stance */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <FileText className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-100 italic leading-snug">
                        "{claimItem.claim}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {claimItem.badge && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {claimItem.badge}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${stanceStyle.bg}`}>
                        <StanceIcon className="w-3.5 h-3.5" />
                        {stanceStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* NLI Probability Distribution Bars */}
                  {claimItem.nli_scores && showScore && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>
                          Evidence Strength (DeBERTa-v3 NLI score — not probability claim is true):
                        </span>
                        <div className="flex gap-3">
                          <span className="text-emerald-400 font-semibold">
                            Support: {Math.round(claimItem.nli_scores.entailment * 100)}%
                          </span>
                          <span className="text-rose-400 font-semibold">
                            Refute: {Math.round(claimItem.nli_scores.contradiction * 100)}%
                          </span>
                          <span className="text-slate-400">
                            Neutral: {Math.round(claimItem.nli_scores.neutral * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Stacked probability bar */}
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${claimItem.nli_scores.entailment * 100}%` }}
                          title={`Support: ${Math.round(claimItem.nli_scores.entailment * 100)}%`}
                        />
                        <div
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${claimItem.nli_scores.contradiction * 100}%` }}
                          title={`Refute: ${Math.round(claimItem.nli_scores.contradiction * 100)}%`}
                        />
                        <div
                          className="h-full bg-slate-600 transition-all duration-500"
                          style={{ width: `${claimItem.nli_scores.neutral * 100}%` }}
                          title={`Neutral: ${Math.round(claimItem.nli_scores.neutral * 100)}%`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Retrieved Evidence Passages */}
                  {claimItem.evidence && claimItem.evidence.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
                        Matched Official Health Literature:
                      </span>
                      {claimItem.evidence.slice(0, 2).map((ev, evIdx) => (
                        <div
                          key={evIdx}
                          className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs"
                        >
                          <blockquote className="text-slate-300 leading-relaxed pl-2.5 border-l-2 border-cyan-400/60">
                            "{ev.passage}"
                          </blockquote>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-cyan-300">{ev.source_name}</span>
                              {/* P0.5: Source type badge */}
                              {ev.source_type === 'curated_summary' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300 uppercase tracking-wider">
                                  Curated summary
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 uppercase tracking-wider">
                                  Official page
                                </span>
                              )}
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400 font-mono">
                                {Math.round(ev.similarity * 100)}% semantic match
                              </span>
                            </div>

                            {/* P0.5: Only show link for official_page, never for curated_summary */}
                            {ev.url && ev.source_type !== 'curated_summary' && (
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline font-mono"
                              >
                                Source Guideline <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── "How this verdict was made" 5-Step Transparency Accordion ── */}
      <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Audit Transparency: How this verdict was computed
            </span>
          </div>
          {showHowItWorks ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-white/10 p-5 bg-black/40 space-y-3.5 text-xs text-slate-300 leading-relaxed font-mono"
            >
              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">1</span>
                <div>
                  <strong className="text-slate-100">Disease Scoping:</strong> Text is mapped against clinically supported diseases (COVID-19, TB, Dengue, Diabetes). Out-of-scope articles are flagged without speculative guesses.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">2</span>
                <div>
                  <strong className="text-slate-100">Claim Extraction:</strong> Sentence-boundary parsing extracts declarative medical assertions containing health-cue verbs and disease predicates. News-reporting sentences (case counts, official announcements) are excluded.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">3</span>
                <div>
                  <strong className="text-slate-100">Semantic Passage Retrieval:</strong> Passages are embedded using <code className="text-cyan-300">all-MiniLM-L6-v2</code> and matched against 479+ indexed passages from WHO, CDC, MoHFW, and ICMR.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">4</span>
                <div>
                  <strong className="text-slate-100">Sentence-Level Stance Inference:</strong> Each passage is split into sentences. <code className="text-cyan-300">DeBERTa-v3-base</code> cross-encoder scores each (claim, sentence) pair. Max entailment and contradiction are taken across all sentence chunks.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">5</span>
                <div>
                  <strong className="text-slate-100">Multi-Claim Aggregation:</strong> An article is flagged <span className="text-rose-400 font-bold">MISLEADING</span> if any verifiable assertion is refuted, and <span className="text-emerald-400 font-bold">RELIABLE</span> if claims are corroborated. <span className="text-amber-400 font-bold">UNVERIFIED</span> means insufficient corpus evidence — not necessarily false.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Permanent Disclaimer + Report Widget (P0.4) ────────────────── */}
      <div className="rounded-xl border border-slate-600/40 bg-black/30 p-4 space-y-3">
        <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
          ⚠️ <strong className="text-slate-300">Educational prototype.</strong> Compares claims with
          official guideline text. Not medical advice — consult a qualified doctor.
          Results depend on corpus coverage and NLI model accuracy; they may be incorrect.
        </p>
        <ReportResultWidget
          analysisId={analysisId}
          claim={topClaim}
          verdict={verdictKey}
        />
      </div>
    </motion.div>
  );
};

export default EvidencePanel;
