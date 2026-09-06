import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const PHASES = [
  { progress: 12, label: 'Connecting to Threat database...' },
  { progress: 38, label: 'Running TF-IDF tokenization...' },
  { progress: 65, label: 'Comparing regression coefficients...' },
  { progress: 88, label: 'Calculating credibility signal scores...' },
  { progress: 100, label: 'Generating audit report...' }
];

const StatusBarLoader = ({ isVisible }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentPhase(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentPhase((prev) => {
        if (prev < PHASES.length - 1) {
          const next = prev + 1;
          setProgress(PHASES[next].progress);
          return next;
        }
        return prev;
      });
    }, 400);

    setProgress(PHASES[0].progress);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-fs-surface border border-fs-border rounded-xl p-5 space-y-3 shadow-lg">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-fs-cyan uppercase font-bold animate-pulse">Processing Claim Analysis</span>
        <span className="text-fs-muted">{progress}%</span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 bg-fs-bg border border-fs-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-fs-cyan rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      <div className="text-[11px] text-fs-muted font-mono italic">
        Phase {currentPhase + 1}/{PHASES.length}: {PHASES[currentPhase].label}
      </div>
    </div>
  );
};

export default StatusBarLoader;
