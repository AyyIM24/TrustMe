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
  { id: 'general',          label: 'Health & Medicine', icon: Globe },
  { id: 'covid_vaccines',   label: 'COVID & Vaccines',  icon: CheckCircle },
  { id: 'medical_research', label: 'Clinical Research', icon: Activity },
  { id: 'public_health',    label: 'Public Health',     icon: Newspaper },
  { id: 'wellness',         label: 'Diet & Remedies',   icon: Zap },
];

// Source color map
const SOURCE_COLORS = {
  'BBC News': '#FF6B35',
  'BBC Politics': '#FF6B35',
  'BBC Health': '#FF6B35',
  'BBC Science': '#FF6B35',
  'BBC Sport': '#FF6B35',
  'BBC Business': '#FF6B35',
  'NY Times': '#00D4FF',
  'NY Times Tech': '#00D4FF',
  'NY Times Politics': '#00D4FF',
  'NY Times Health': '#00D4FF',
  'NY Times Science': '#00D4FF',
  'NY Times Sports': '#00D4FF',
  'NY Times Business': '#00D4FF',
  'CNN': '#CC0033',
  'TechCrunch': '#00FF88',
  'Wired': '#FFB300',
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
const VerifyResult = ({ result, article, onClose }) => {
  const isFake = result.prediction === 'fake';
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
          <button onClick={onClose} className="text-fs-muted hover:text-fs-text transition-colors">
            ✕
          </button>
        </div>

        <p className="text-xs text-fs-muted line-clamp-2">{article?.title}</p>

        <div className={`p-4 rounded-xl border text-center space-y-2 ${
          isFake
            ? 'bg-fs-crimson/10 border-fs-crimson/30'
            : 'bg-fs-cyan/10 border-fs-cyan/30'
        }`}>
          <div className={`text-3xl font-black font-mono ${isFake ? 'text-fs-crimson' : 'text-fs-cyan'}`}>
            {isFake ? '⚠ FAKE' : '✓ REAL'}
          </div>
          <div className={`text-sm font-mono ${isFake ? 'text-fs-crimson' : 'text-fs-cyan'}`}>
            {result.confidence}% Confidence
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-fs-bg rounded-lg p-3 border border-fs-border">
            <p className="text-fs-muted mb-1">Fake Probability</p>
            <p className="text-fs-crimson font-bold">{result.fake_probability}%</p>
          </div>
          <div className="bg-fs-bg rounded-lg p-3 border border-fs-border">
            <p className="text-fs-muted mb-1">Real Probability</p>
            <p className="text-fs-cyan font-bold">{result.real_probability}%</p>
          </div>
        </div>

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

// ── Main LiveNews Component ────────────────────────────────────────
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
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNews = useCallback(async (cat, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await newsAPI.getFeed(cat, 24);
      setArticles(res.data.articles || []);
      setIsCached(res.data.cached);
      setLastUpdated(new Date());
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

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const timer = setInterval(() => fetchNews(category, true), 600000);
    return () => clearInterval(timer);
  }, [category, fetchNews]);

  const handleVerify = async (article) => {
    if (!token) {
      toast.error('Please login to verify articles');
      navigate('/login');
      return;
    }
    setVerifyingUrl(article.url);
    try {
      const text = `${article.title}. ${article.description || ''}`;
      if (text.trim().length < 10) {
        toast.error('Not enough text to analyze');
        return;
      }
      const res = await analyzeAPI.analyzeText({
        text,
        title: article.title,
        source_url: article.url,
      });
      setVerifyResult(res.data);
      setVerifyArticle(article);
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
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Live Healthcare & Medical Wire</h1>
              <p className="text-sm text-fs-muted mt-1">
                Real-time medical articles and health advisories from BBC Health and NY Times Health.{' '}
                <span className="text-fs-cyan">Click "Verify This"</span> to test any health claim against our AI model.
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

          {lastUpdated && (
            <p className="text-[10px] text-fs-muted font-mono">
              Last updated: {lastUpdated.toLocaleTimeString()}
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
            onClose={() => { setVerifyResult(null); setVerifyArticle(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveNews;
