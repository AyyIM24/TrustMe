import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link2, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TextInput from '../components/analyze/TextInput';
import UrlInput from '../components/analyze/UrlInput';
import ResultCard from '../components/analyze/ResultCard';
import CredibilityPanel from '../components/analyze/CredibilityPanel';
import StatusBarLoader from '../components/ui/StatusBarLoader';
import { analyzeAPI } from '../api/client';
import toast from 'react-hot-toast';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';

const Analyze = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('text');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTextSubmit = async ({ text }) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await analyzeAPI.analyzeText({ text });
      setTimeout(() => {
        setResult(response.data);
        setIsLoading(false);
        toast.success('Analysis complete!');
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      const msg = err.response?.data?.detail || 'Analysis failed. Please try again.';
      toast.error(msg);
    }
  };

  const handleUrlSubmit = async ({ url }) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await analyzeAPI.analyzeUrl({ url });
      setTimeout(() => {
        setResult(response.data);
        setIsLoading(false);
        toast.success('URL parsed and analyzed successfully!');
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      const msg = err.response?.data?.detail || 'Scraping failed. Make sure it is a valid news article URL.';
      toast.error(msg);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FFE6EE] text-slate-900 py-10 overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-8">
        {/* Header with TrustMe Pulse Icon */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#D6EBFC]/95 border border-pink-300 rounded-full text-xs font-mono text-pink-800 mb-2 shadow-sm hover:border-pink-400 hover:shadow-md transition-all">
            <TrustMePulseBadge size="sm" showLabel={false} />
            <span className="font-bold">TrustMe AI Multi-Signal Clinical NLP Extraction</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Healthcare Article & Claim{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">
              Deep Scanner
            </span>
          </h1>
          <p className="text-sm text-slate-700 max-w-lg mx-auto leading-relaxed font-normal">
            Paste healthcare article text or submit a URL to evaluate medical claims, scientific credibility, and source authenticity.
          </p>
        </div>

        {/* Quick Fact Check Callout (Dense Light Blue, Zero White, Hover Lift) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 bg-[#D6EBFC]/95 border border-pink-300 rounded-2xl shadow-card-soft hover:shadow-card-hover hover:border-pink-400 hover:-translate-y-0.5 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 rounded-xl text-white shadow-sm shadow-cyan-500/20 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-slate-900">Want to verify a specific medical claim?</p>
              <p className="text-xs text-slate-600">
                e.g. &quot;COVID-19 mRNA vaccines alter DNA&quot; or &quot;Bleach cures coronavirus&quot; — cross-reference literature.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/factcheck')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 hover:border-pink-400 text-teal-900 text-xs font-mono font-bold hover:scale-105 hover:shadow-md transition-all whitespace-nowrap shadow-sm cursor-pointer active:scale-95"
          >
            Fact Checker <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </motion.div>

        {/* Tab Controls (Dense Light Blue, Zero White) */}
        <div className="flex border border-pink-300 rounded-2xl bg-[#D6EBFC] p-1 max-w-xs mx-auto shadow-sm">
          {[
            { id: 'text', icon: Search, label: 'Text Input' },
            { id: 'url',  icon: Link2,  label: 'URL Scraper' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer
                ${activeTab === id
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-pink-800'
                }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Input Forms (Dense Light Blue, Zero White, Rich Shadow) */}
        <div className="bg-[#D6EBFC]/95 rounded-3xl border border-pink-300 p-6 md:p-8 shadow-card-soft hover:shadow-card-hover hover:border-pink-400 transition-all duration-300">
          {activeTab === 'text' ? (
            <TextInput onSubmit={handleTextSubmit} isLoading={isLoading} />
          ) : (
            <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
          )}
        </div>

        {/* Inline Status Loader */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <StatusBarLoader isVisible={isLoading} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* ML Prediction Card */}
              <ResultCard result={result} />

              {/* Multi-signal Credibility Breakdown */}
              {result.credibility_signals && (
                <CredibilityPanel
                  credibilityScore={result.credibility_score}
                  credibilityLabel={result.credibility_label}
                  credibilityColor={result.credibility_color}
                  signals={result.credibility_signals}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Analyze;
