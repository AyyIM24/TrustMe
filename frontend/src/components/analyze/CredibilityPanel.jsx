import { motion } from 'framer-motion';

const STATUS_STYLES = {
  pass: { bar: 'bg-fs-green', text: 'text-fs-green', badge: 'bg-fs-green/10 border-fs-green/20 text-fs-green', dot: 'bg-fs-green' },
  warn: { bar: 'bg-fs-amber', text: 'text-fs-amber', badge: 'bg-fs-amber/10 border-fs-amber/20 text-fs-amber', dot: 'bg-fs-amber' },
  fail: { bar: 'bg-fs-crimson', text: 'text-fs-crimson', badge: 'bg-fs-crimson/10 border-fs-crimson/20 text-fs-crimson', dot: 'bg-fs-crimson' },
};

const COLOR_MAP = {
  green: '#00FF88', red: '#FF2D55', amber: '#FFB300', cyan: '#00D4FF',
};

// ── Composite Score Ring ──────────────────────────────────────────
const ScoreRing = ({ score, color, label }) => {
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const stroke = COLOR_MAP[color] || '#00D4FF';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#1A2540" strokeWidth="5" />
          <motion.circle
            cx="40" cy="40" r={radius}
            fill="none" stroke={stroke} strokeWidth="5"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-center">
          <p className="text-lg font-black font-mono" style={{ color: stroke }}>{score}</p>
        </div>
      </div>
      <p className="text-[9px] font-mono text-fs-muted uppercase tracking-wider text-center">{label}</p>
    </div>
  );
};

// ── Single Signal Row ─────────────────────────────────────────────
const SignalRow = ({ signal, index }) => {
  const s = STATUS_STYLES[signal.status] || STATUS_STYLES.warn;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${s.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
          <span className="text-sm">{signal.icon}</span>
          <span className="text-xs font-semibold text-fs-text">{signal.name}</span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${s.badge}`}>
          {signal.score}/100
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-fs-bg rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${s.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${signal.score}%` }}
          transition={{ duration: 0.8, delay: index * 0.06, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-fs-muted leading-tight pl-4.5">{signal.detail}</p>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────
const CredibilityPanel = ({ credibilityScore, credibilityLabel, credibilityColor, signals }) => {
  if (!signals || signals.length === 0) return null;

  const passCount = signals.filter(s => s.status === 'pass').length;
  const warnCount = signals.filter(s => s.status === 'warn').length;
  const failCount = signals.filter(s => s.status === 'fail').length;

  const colorStyle = COLOR_MAP[credibilityColor] || '#00D4FF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-fs-surface border border-fs-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-fs-border bg-fs-bg/30 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider">Credibility Analysis</h3>
          <p className="text-[10px] text-fs-muted mt-0.5">Multi-signal content credibility breakdown</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono font-bold" style={{ color: colorStyle }}>
            {credibilityLabel}
          </p>
          <div className="flex items-center gap-1.5 mt-1 justify-end text-[10px] font-mono">
            <span className="text-fs-green">{passCount} pass</span>
            <span className="text-fs-muted">·</span>
            <span className="text-fs-amber">{warnCount} warn</span>
            <span className="text-fs-muted">·</span>
            <span className="text-fs-crimson">{failCount} fail</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Score + Legend */}
        <div className="flex items-start gap-6">
          <ScoreRing score={credibilityScore} color={credibilityColor} label="Credibility" />
          <div className="flex-1 space-y-1.5 pt-1">
            <p className="text-xs text-fs-muted leading-relaxed">
              This score is calculated based on exactly 5 verified indicators: Domain Reputation, Citation Count, Clickbait Score, Author Credibility, and Grammar Check.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: '75–100', desc: 'High', color: 'text-fs-green' },
                { label: '40–74', desc: 'Moderate', color: 'text-fs-amber' },
                { label: '0–39', desc: 'Low', color: 'text-fs-crimson' },
              ].map(({ label, desc, color }) => (
                <div key={label} className="bg-fs-bg rounded-lg p-2 border border-fs-border text-center">
                  <p className={`text-xs font-mono font-bold ${color}`}>{label}</p>
                  <p className="text-[9px] text-fs-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-fs-border" />

        {/* Signal Rows */}
        <div className="space-y-4">
          {signals.map((signal, i) => (
            <SignalRow key={signal.name} signal={signal} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CredibilityPanel;
