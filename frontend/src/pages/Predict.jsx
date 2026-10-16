import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, AlertTriangle, CheckCircle, HelpCircle, Compass,
  Loader2, RotateCcw, ChevronDown, ChevronUp, Layers, Sparkles
} from 'lucide-react';
import { analyzeAPI } from '../api/client';
import EvidencePanel from '../components/analyze/EvidencePanel';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';

const sampleTexts = [
  {
    label: 'Sample: Dengue myth',
    text: 'Drinking boiled papaya leaf juice and raw goat milk cures dengue fever and permanently restores platelets without hospital admission.',
  },
  {
    label: 'Sample: COVID-19 guidance',
    text: 'Coronavirus disease (COVID-19) is an infectious disease caused by the SARS-CoV-2 virus.',
  },
  {
    label: 'Sample: Diabetes cure claim',
    text: 'Consuming bitter gourd (karela) juice and jamun seed powder every morning completely cures diabetes and eliminates the need for insulin injections permanently.',
  },
  {
    label: 'Sample: Out-of-scope economics',
    text: 'The Reserve Bank of India raised repo interest rates by twenty-five basis points to curb quarterly inflation.',
  },
  {
    label: 'Sample: Dengue protocol',
    text: 'ICMR and MoHFW have issued clinical protocols advising oral rehydration therapy and platelet count monitoring under physician care for dengue patients across India.',
  },
];

export default function Predict() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [styleSignalOpen, setStyleSignalOpen] = useState(false);

  const handlePredict = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzeAPI.analyzeText({ text });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to verify claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  const handleSample = (sampleText) => {
    setText(sampleText);
    setResult(null);
    setError(null);
  };

  const verdict = result?.verification?.verdict || (result?.prediction === 'fake' ? 'MISLEADING' : result?.prediction === 'real' ? 'RELIABLE' : 'UNVERIFIED');
  const isMisleading = verdict === 'MISLEADING';
  const isReliable = verdict === 'RELIABLE';
  const isPartiallyVerified = verdict === 'PARTIALLY_VERIFIED';
  const isOutOfScope = verdict === 'OUT_OF_SCOPE';
  const isUnverified = verdict === 'UNVERIFIED';

  const nliModelName = result?.verification?.method?.nli_model || 'cross-encoder/nli-deberta-v3-base';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header with TrustMe Pulse Icon */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-2">
          <TrustMePulseBadge size="md" pulseRate="2.2s" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          TrustMe AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">Scanner</span>
        </h1>
        <p className="text-slate-700 text-sm sm:text-base max-w-2xl mx-auto mt-2 font-normal">
          Cross-references healthcare assertions against verified medical literature using neural passage retrieval and zero-shot NLI
        </p>
      </motion.div>

      {/* Scope Note */}
      <div className="mb-6 p-3 rounded-xl bg-[#D6EBFC] border border-pink-300 text-xs font-mono text-slate-700 text-center shadow-sm">
        <span className="font-bold text-cyan-900">Coverage Scope:</span> Verifies against WHO, CDC, MedlinePlus and curated Indian guidance. Scope: COVID-19, Tuberculosis, Dengue, Diabetes.
      </div>

      {/* Sample Texts */}
      <motion.div
        className="flex flex-wrap gap-2 justify-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-xs font-mono font-bold text-pink-800 mr-1 self-center">Try Clinical Samples:</span>
        {sampleTexts.map(({ label, text: sampleText }) => (
          <button
            key={label}
            onClick={() => handleSample(sampleText)}
            className="text-xs px-3.5 py-1.5 bg-[#D6EBFC] border border-pink-300 rounded-full text-slate-800
                       hover:border-pink-400 hover:text-pink-900 hover:bg-[#C8E4FA] hover:scale-105 hover:shadow-md shadow-sm transition-all duration-300 font-mono font-semibold cursor-pointer active:scale-95"
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Input Area */}
      <motion.div
        className="glass-card p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a healthcare news article, claim, or clinical assertion here..."
          rows={5}
          className="input-field resize-none text-base leading-relaxed mb-4"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Static Engine Pill */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C8E4FA] border border-pink-300 rounded-full text-xs font-mono font-bold text-cyan-900 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>Evidence Retrieval (MiniLM) + NLI (DeBERTa-v3) — Live</span>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2 py-2 px-4 font-mono text-xs">
              <RotateCcw className="w-4 h-4 text-slate-400" />
              Reset
            </button>
            <button
              onClick={handlePredict}
              disabled={loading || !text.trim()}
              className="btn-primary flex items-center gap-2 py-2 px-6 font-mono text-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? 'Verifying with Evidence...' : 'Scan with Evidence Engine'}
            </button>
          </div>
        </div>

        {/* Character Count */}
        <div className="mt-3 text-right text-[11px] text-slate-400 font-mono">
          {text.length} characters
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="glass-card p-4 mb-6 border-rose-500/30 bg-rose-50/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Result: Evidence Panel & Summary */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Primary Evidence Panel */}
            {result.verification ? (
              <EvidencePanel verification={result.verification} />
            ) : (
              /* Fallback Summary Card */
              <div className={`glass-card p-8 border-l-4 ${
                isMisleading
                  ? 'border-l-rose-500 bg-rose-50/30'
                  : isReliable
                    ? 'border-l-emerald-500 bg-emerald-50/30'
                    : 'border-l-amber-500 bg-amber-50/30'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isMisleading
                      ? 'bg-rose-100 text-rose-600 shadow-sm'
                      : isReliable
                        ? 'bg-emerald-100 text-emerald-600 shadow-sm'
                        : isOutOfScope
                          ? 'bg-indigo-100 text-indigo-600 shadow-sm'
                          : 'bg-amber-100 text-amber-600 shadow-sm'
                  }`}>
                    {isMisleading && <AlertTriangle className="w-7 h-7" />}
                    {isReliable && <CheckCircle className="w-7 h-7" />}
                    {isOutOfScope && <Compass className="w-7 h-7" />}
                    {isUnverified && <HelpCircle className="w-7 h-7" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {isMisleading && 'Potentially Misleading / Refuted'}
                      {isReliable && 'Consistent with guidelines'}
                      {isPartiallyVerified && 'Partially Verified — Inconclusive'}
                      {isOutOfScope && 'Out of Scope — Abstention'}
                      {isUnverified && 'Inconclusive / Unverified'}
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5 font-mono">
                      Stance Inference Model: <span className="font-bold text-slate-700">{nliModelName}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer with NLI model name */}
            <div className="p-3 bg-[#D6EBFC]/60 rounded-xl border border-pink-200 text-xs font-mono text-slate-600 flex flex-wrap justify-between items-center gap-2">
              <span>Primary Decision Engine: <strong className="text-slate-800">DeBERTa-v3 Stance Inference</strong></span>
              <span>Model: <strong className="text-cyan-900">{nliModelName}</strong></span>
            </div>

            {/* ── Collapsed Secondary Writing-Style Signal (TF-IDF + LR) ── */}
            <div className="border border-pink-300 rounded-2xl overflow-hidden bg-[#D6EBFC]/80 shadow-sm">
              <button
                onClick={() => setStyleSignalOpen((o) => !o)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#C8E4FA] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-pink-700" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                    Secondary writing-style signal (TF-IDF + Logistic Regression)
                  </span>
                </div>
                {styleSignalOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                )}
              </button>

              <AnimatePresence>
                {styleSignalOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-pink-200"
                  >
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed font-mono">
                        Vocabulary weights reflect writing-style correlation learned from the CoAID and FakeHealth health news corpus.
                        This is a <strong>secondary statistical signal</strong> only — the evidence panel above serves as the primary verification authority.
                      </p>

                      {/* Display explanations / word features */}
                      {result.explanations && result.explanations.length > 0 ? (
                        <div className="space-y-2">
                          {result.explanations.slice(0, 10).map((ex, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#C8E4FA] border border-pink-200 text-xs font-mono">
                              <span className="font-bold text-slate-800">{ex.feature}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ex.effect === 'fake' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {ex.effect.toUpperCase()}
                                </span>
                                <span className="text-slate-600">weight: {ex.weight.toFixed(3)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : result.keywords && result.keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-full bg-[#C8E4FA] border border-pink-300 text-xs font-mono font-semibold text-slate-800">
                              {kw.word} ({kw.weight > 0 ? `+${kw.weight.toFixed(2)}` : kw.weight.toFixed(2)})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-mono">No specific lexical tokens triggered high TF-IDF deviation.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
