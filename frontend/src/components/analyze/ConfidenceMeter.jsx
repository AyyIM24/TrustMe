import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ConfidenceMeter = ({ value, isFake }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const color = isFake ? '#FF2D55' : '#00D4FF';
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="rgba(26, 37, 64, 0.5)"
            strokeWidth="8"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-black font-mono"
            style={{ color }}
          >
            {displayValue}%
          </span>
          <span className="text-xs text-fs-muted uppercase tracking-widest mt-1">
            Confidence
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceMeter;
