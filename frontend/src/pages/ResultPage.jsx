import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { analyzeAPI } from '../api/client';
import ResultCard from '../components/analyze/ResultCard';
import GlowButton from '../components/ui/GlowButton';

const ResultPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await analyzeAPI.getAnalysis(id);
        setResult(res.data);
      } catch (err) {
        setError('Verification record not found or access restricted.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  return (
    <div className="relative min-h-screen bg-fs-bg text-fs-text pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <GlowButton variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back Home
            </GlowButton>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-fs-muted">
            <Shield className="w-4 h-4 text-fs-cyan" />
            <span>ID: {id}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-fs-cyan font-mono animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>Accessing central verification directory...</span>
          </div>
        ) : error ? (
          <div className="bg-fs-surface border border-fs-border rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-fs-crimson font-mono font-bold text-lg">VERIFICATION FAILURE</p>
            <p className="text-sm text-fs-muted">{error}</p>
            <Link to="/analyze" className="inline-block pt-2">
              <GlowButton variant="cyan" size="sm">Perform New Scan</GlowButton>
            </Link>
          </div>
        ) : (
          result && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs uppercase font-mono text-fs-muted tracking-widest">Verification Record Snapshot</span>
                {result.title && <h2 className="text-xl md:text-2xl font-bold tracking-tight text-fs-text">{result.title}</h2>}
                {result.source_url && (
                  <a
                    href={result.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs text-fs-cyan hover:underline font-mono"
                  >
                    {result.source_url}
                  </a>
                )}
              </div>
              <ResultCard result={result} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ResultPage;
