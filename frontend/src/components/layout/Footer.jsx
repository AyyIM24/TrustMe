import { Link } from 'react-router-dom';
import { Shield, Zap } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-fs-border bg-fs-surface/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-fs-cyan" />
              <span className="text-lg font-bold">
                Fake<span className="text-fs-cyan">Shield</span>
              </span>
            </div>
            <p className="text-xs text-fs-muted leading-relaxed">
              AI-powered fake news detection. Protecting truth in the age of misinformation.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-fs-muted">
              <Zap className="w-3 h-3 text-fs-green" />
              <span>Powered by TF-IDF &amp; Logistic Regression</span>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-fs-muted">Platform</h4>
            <ul className="space-y-2">
              {[
                { to: '/analyze',   label: 'Analyze Text' },
                { to: '/factcheck', label: 'Fact Checker' },
                { to: '/news',      label: 'Live News Feed' },
                { to: '/trending',  label: 'Trending Topics' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-xs text-fs-muted hover:text-fs-cyan transition-colors font-mono">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-fs-muted">Account</h4>
            <ul className="space-y-2">
              {[
                { to: '/register', label: 'Create Account' },
                { to: '/login',    label: 'Login' },
                { to: '/dashboard',label: 'Dashboard' },
                { to: '/profile',  label: 'My Profile' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-xs text-fs-muted hover:text-fs-cyan transition-colors font-mono">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-fs-muted">Tech Stack</h4>
            <ul className="space-y-2 text-xs font-mono text-fs-muted">
              {['FastAPI + Python', 'React + Vite', 'MySQL + SQLAlchemy', 'scikit-learn ML', 'JWT Security', 'RSS News Feeds'].map(t => (
                <li key={t} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-fs-cyan/40" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-fs-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-fs-muted font-mono">
            © {year} FakeShield. Built for truth detection. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded-full bg-fs-green/10 border border-fs-green/20 text-fs-green">
            <span className="w-1.5 h-1.5 rounded-full bg-fs-green animate-pulse" />
            API Online
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
