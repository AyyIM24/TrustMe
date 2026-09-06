import { motion } from 'framer-motion';

const ProbabilityBar = ({ label, value, color = 'cyan' }) => {
  const colors = {
    cyan: {
      bar: 'bg-fs-cyan',
      shadow: 'shadow-[0_0_10px_rgba(0,212,255,0.3)]',
      text: 'text-fs-cyan',
    },
    green: {
      bar: 'bg-fs-green',
      shadow: 'shadow-[0_0_10px_rgba(0,255,136,0.3)]',
      text: 'text-fs-green',
    },
    crimson: {
      bar: 'bg-fs-crimson',
      shadow: 'shadow-[0_0_10px_rgba(255,45,85,0.3)]',
      text: 'text-fs-crimson',
    },
  };

  const c = colors[color] || colors.cyan;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-fs-muted font-mono uppercase tracking-wider">
          {label}
        </span>
        <span className={`text-sm font-bold font-mono ${c.text}`}>
          {value}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-fs-border/50 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${c.bar} ${c.shadow}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  );
};

export default ProbabilityBar;
