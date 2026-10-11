import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, RefreshCw, ExternalLink, Zap, Globe,
  Cpu, Activity, Filter, ChevronRight, AlertTriangle,
  CheckCircle, Clock
} from 'lucide-react';
import { newsAPI, analyzeAPI } from '../api/client';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import TrustMePulseBadge from '../components/common/TrustMePulseBadge';

const CATEGORIES = [
  { id: 'general',            label: 'All India Health',        icon: Globe },
  { id: 'mohfw_icmr',         label: 'ICMR, MoHFW & AIIMS',     icon: CheckCircle },
  { id: 'endemic_tropical',   label: 'Dengue, Malaria & TB',    icon: Newspaper },
  { id: 'diabetes_lifestyle', label: 'Diabetes & Heart India',  icon: Activity },
  { id: 'ayush_myths',        label: 'Ayush & Herbal Myths',    icon: Zap },
];

// Indian Healthcare Source Color Map
const SOURCE_COLORS = {
  'Google News India Health': '#1A73E8',
  'The Hindu Health': '#0A2540',
  'Times of India Health': '#D32F2F',
  'ICMR & MoHFW Wire': '#008080',
  'PIB Fact Check India': '#E65100',
  'Vector & Infectious Diseases': '#C2185B',
  'India TB Surveillance': '#7B1FA2',
  'ICMR-INDIAB Diabetes & Heart': '#00796B',
  'Times of India Lifestyle': '#C62828',
  'Ayush & Traditional Health': '#2E7D32',
  'India Health Myth Watch': '#D81B60',
};

const NewsCard = ({ article, onVerify, verifying }) => {
  const color = SOURCE_COLORS[article.source] || '#5A6A8A';
  const timeAgo = article.published_at
    ? (() => {
        try {
          const d = new Date(article.published_at);
          const diff = Math.floor((Date.now() - d) / 60000);
          if (diff < 60) return `${diff}m ago`;
          if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
          return `${Math.floor(diff / 1440)}d ago`;
        } catch { return null; }
      })()
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-fs-surface border border-fs-border rounded-2xl overflow-hidden hover:border-pink-400 transition-all duration-300 shadow-card-soft hover:shadow-card-hover hover:-translate-y-1 flex flex-col cursor-pointer"
    >
      {/* Image */}
      {article.image_url && (
        <div className="h-40 overflow-hidden bg-fs-bg">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Source + time */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}
          >
            {article.source}
          </span>
          {timeAgo && (
            <span className="text-[10px] text-fs-muted font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-fs-text leading-snug line-clamp-3 group-hover:text-fs-cyan transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-xs text-fs-muted leading-relaxed line-clamp-2 flex-1">
            {article.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-fs-border/50">
          <button
            onClick={() => onVerify(article)}
            disabled={verifying === article.url}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-fs-cyan/10 border border-fs-cyan/20 text-fs-cyan text-xs font-mono hover:bg-fs-cyan/20 disabled:opacity-50 transition-all"
          >
            {verifying === article.url ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Verifying...</>
            ) : (
              <><Zap className="w-3 h-3" /> Verify This</>
            )}
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-fs-surface border border-fs-border text-fs-muted text-xs font-mono hover:text-fs-text hover:border-fs-muted/40 transition-all"
          >
            <ExternalLink className="w-3 h-3" /> Read
          </a>
        </div>
      </div>
    </motion.div>
  );
};

// Verify Result Overlay
const VerifyResult = ({ result, article, onClose, headlineOnly }) => {
  // Derive display verdict from evidence pipeline first, ML prediction as fallback
  const evVerdict = result.verification?.verdict; // MISLEADING|RELIABLE|UNVERIFIED|OUT_OF_SCOPE
  const isUncertain = result.prediction === 'uncertain';

  let verdictLabel, verdictColor, bgColor, borderColor;
  if (evVerdict === 'MISLEADING' || (!evVerdict && result.prediction === 'fake')) {
    verdictLabel = '\u26a0 MISLEADING';
    verdictColor = 'text-fs-crimson';
    bgColor = 'bg-fs-crimson/10';
    borderColor = 'border-fs-crimson/30';
  } else if (evVerdict === 'RELIABLE' || (!evVerdict && result.prediction === 'real' && !isUncertain)) {
    verdictLabel = '\u2713 RELIABLE';
    verdictColor = 'text-fs-cyan';
    bgColor = 'bg-fs-cyan/10';
    borderColor = 'border-fs-cyan/30';
  } else if (evVerdict === 'OUT_OF_SCOPE') {
    verdictLabel = '\u2298 OUT OF SCOPE';
    verdictColor = 'text-indigo-400';
    bgColor = 'bg-indigo-500/10';
    borderColor = 'border-indigo-500/30';
  } else {
    verdictLabel = '? UNVERIFIED';
    verdictColor = 'text-amber-400';
    bgColor = 'bg-amber-500/10';
    borderColor = 'border-amber-500/30';
  }

  const showConfidence = evVerdict !== 'UNVERIFIED' && !isUncertain && evVerdict !== 'OUT_OF_SCOPE';
  const confidencePct = showConfidence
    ? Math.round(
        result.verification?.confidence != null
          ? (result.verification.confidence > 1
              ? result.verification.confidence
              : result.verification.confidence * 100)
          : result.confidence
      )
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-fs-bg/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-fs-surface border border-fs-border rounded-2xl p-6 space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold font-mono uppercase tracking-wider">Analysis Result</h3>
          <button onClick={onClose} className="text-fs-muted hover:text-fs-text transition-colors">&#x2715;</button>
        </div>

        <p className="text-xs text-fs-muted line-clamp-2">{article?.title}</p>

        {/* Headline-only banner */}
        {headlineOnly && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Headline-only check — limited evidence (article scraping unavailable for this URL)</span>
          </div>
        )}

        <div className={`p-4 rounded-xl border text-center space-y-2 ${bgColor} ${borderColor}`}>
          <div className={`text-3xl font-black font-mono ${verdictColor}`}>
            {verdictLabel}
          </div>
          {showConfidence && confidencePct != null && (
            <div className={`text-sm font-mono ${verdictColor}`}>
              {confidencePct}% Evidence Confidence
            </div>
          )}
        </div>

        {result.verification?.disease && (
          <p className="text-[11px] font-mono text-fs-muted text-center">
            Disease scope: <span className="text-fs-cyan">{result.verification.disease}</span>
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-fs-cyan text-fs-bg font-bold text-sm font-mono hover:bg-fs-cyan/90 transition-all"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

const LiveNews = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [category, setCategory] = useState('general');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingUrl, setVerifyingUrl] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyArticle, setVerifyArticle] = useState(null);
  const [headlineOnly, setHeadlineOnly] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchNews = useCallback(async (cat, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await newsAPI.getFeed(cat, 24, isRefresh);
      setArticles(res.data.articles || []);
      setIsCached(res.data.cached);
      if (res.data.fetched_at) {
        try {
          setFetchedAt(new Date(res.data.fetched_at));
        } catch { setFetchedAt(new Date()); }
      } else {
        setFetchedAt(new Date());
      }
    } catch {
      toast.error('Failed to load news feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(category);
  }, [category, fetchNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => fetchNews(category, true), 300000);
    return () => clearInterval(timer);
  }, [category, fetchNews]);

  const handleVerify = async (article) => {
    setVerifyingUrl(article.url);
    setHeadlineOnly(false);
    try {
      // Step 1: try scraping the full URL
      try {
        const res = await analyzeAPI.analyzeUrl({ url: article.url });
        setVerifyResult(res.data);
        setVerifyArticle(article);
        return;
      } catch (urlErr) {
        // URL scraping failed (Google News redirect, paywall, etc.) — fall back to headline+description
        const text = [article.title, article.description].filter(Boolean).join('. ').trim();
        if (text.length < 10) {
          toast.error('Not enough text to analyze');
          return;
        }
        setHeadlineOnly(true);
        const res = await analyzeAPI.analyzeText({
          text,
          title: article.title,
          source_url: article.url,
        });
        setVerifyResult(res.data);
        setVerifyArticle(article);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Verification failed';
      toast.error(msg);
    } finally {
      setVerifyingUrl(null);
    }
  };

  const ActiveCategoryIcon = CATEGORIES.find(c => c.id === category)?.icon || Globe;

  return (
    <div className="relative min-h-screen bg-fs-bg text-fs-text pt-20 pb-16">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TrustMePulseBadge size="sm" pulseRate="1.5s" />
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-fs-green bg-fs-green/10 border border-fs-green/20 px-2.5 py-1 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-fs-green" />
                  LIVE FEED
                </span>
                {isCached && (
                  <span className="text-[10px] font-mono text-fs-muted bg-fs-surface border border-fs-border px-2 py-0.5 rounded-full">
                    Cached
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">India National Healthcare & Medical Wire</h1>
              <p className="text-sm text-fs-muted mt-1">
                Real-time health bulletins, clinical research, and public advisories from ICMR, MoHFW, The Hindu, Times of India, and AIIMS.{' '}
                <span className="text-fs-cyan">Click &quot;Verify This&quot;</span> to evaluate any health claim against our AI model.
              </p>
            </div>
            <button
              onClick={() => fetchNews(category, true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-fs-surface border border-fs-border text-fs-muted text-sm font-mono hover:text-fs-cyan hover:border-fs-cyan/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  category === id
                    ? 'bg-fs-cyan/10 border border-fs-cyan/30 text-fs-cyan'
                    : 'bg-fs-surface border border-fs-border text-fs-muted hover:text-fs-text hover:border-fs-muted/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {fetchedAt && (
            <p className="text-[10px] text-fs-muted font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isCached ? 'Cached' : 'Live'}, fetched {fetchedAt.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-fs-surface border border-fs-border rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-fs-surface border border-fs-border rounded-2xl">
            <Newspaper className="w-12 h-12 text-fs-muted mx-auto mb-4" />
            <p className="text-fs-muted font-mono">No articles found for this category.</p>
            <p className="text-xs text-fs-muted mt-1 font-mono">Try refreshing or switching category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((article, i) => (
              <NewsCard
                key={article.url + i}
                article={article}
                onVerify={handleVerify}
                verifying={verifyingUrl}
              />
            ))}
          </div>
        )}

        {/* CTA for non-logged-in users */}
        {!token && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-6 bg-gradient-to-r from-fs-cyan/10 to-fs-surface border border-fs-cyan/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-bold text-lg font-mono">Ready to verify articles?</h3>
              <p className="text-sm text-fs-muted mt-1">Create a free account to use the AI verification engine on any article.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 rounded-xl bg-fs-cyan text-fs-bg font-bold text-sm font-mono hover:bg-fs-cyan/90 transition-all whitespace-nowrap"
              >
                Get Started Free
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Verify Result Modal */}
      <AnimatePresence>
        {verifyResult && (
          <VerifyResult
            result={verifyResult}
            article={verifyArticle}
            headlineOnly={headlineOnly}
            onClose={() => { setVerifyResult(null); setVerifyArticle(null); setHeadlineOnly(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveNews;
