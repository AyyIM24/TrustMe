import { HeartPulse, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import TrustMePulseBadge from './common/TrustMePulseBadge'

export default function Footer() {
  return (
    <footer className="border-t border-pink-300 bg-[#D6EBFC]/95 backdrop-blur-md transition-all duration-300 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Brand */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <TrustMePulseBadge size="sm" showLabel={false} />
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                TrustMe <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Clinical healthcare truth & misinformation defense platform. Protecting public wellbeing
              through domain-trained NLP and explainable AI attribution.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-pink-800 mb-3 uppercase tracking-wider">Clinical Modules</h4>
            <div className="space-y-2">
              {[
                { to: '/predict', label: 'TrustMe AI Detector' },
                { to: '/dashboard', label: 'Telemetry & Performance' },
                { to: '/analyze', label: 'Deep Article Scanner' },
                { to: '/factcheck', label: 'Medical Fact-Checker' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="block text-xs font-semibold text-slate-700 hover:text-pink-800 hover:translate-x-1 transition-all duration-200">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-xs font-mono font-bold text-pink-800 mb-3 uppercase tracking-wider">Clinical Architecture</h4>
            <div className="flex flex-wrap gap-2">
              {['FastAPI 0.115', 'DistilBERT', 'Scikit-learn', 'SHAP Attribution', 'CoAID Dataset', 'WebRTC Biometrics'].map(tech => (
                <span key={tech} className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-[#C8E4FA] hover:bg-[#BEE0FB] border border-pink-300 rounded-full text-slate-800 shadow-sm transition-all duration-200">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-pink-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
          <p className="text-[11.5px] font-mono text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} TrustMe AI — Healthcare Misinformation Defense Intelligence
          </p>
          <p className="text-[11.5px] font-mono text-slate-600 flex items-center gap-1.5 font-medium">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" /> for global clinical health truth
          </p>
        </div>
      </div>
    </footer>
  )
}
