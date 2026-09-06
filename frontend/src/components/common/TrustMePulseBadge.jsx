import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';

export default function TrustMePulseBadge({ size = 'md', className = '', showLabel = true, label = 'TrustMe Vital Node' }) {
  const sizeMap = {
    sm: { container: 'w-8 h-8', ring1: 'w-7 h-7', ring2: 'w-6 h-6', heart: 'w-3.5 h-3.5', dots: 10, dotSize: 'w-1 h-1' },
    md: { container: 'w-12 h-12', ring1: 'w-11 h-11', ring2: 'w-9 h-9', heart: 'w-5 h-5', dots: 14, dotSize: 'w-1.5 h-1.5' },
    lg: { container: 'w-20 h-20', ring1: 'w-18 h-18', ring2: 'w-15 h-15', heart: 'w-8 h-8', dots: 18, dotSize: 'w-2 h-2' },
    xl: { container: 'w-28 h-28', ring1: 'w-26 h-26', ring2: 'w-22 h-22', heart: 'w-12 h-12', dots: 18, dotSize: 'w-2.5 h-2.5' },
  };

  const cfg = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Concentric Vitality Popping Icon */}
      <div className={`relative ${cfg.container} flex items-center justify-center flex-shrink-0 select-none`}>
        {/* Outer Cyan Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-0 rounded-full border-2 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.35)]`}
        />

        {/* Inner Teal Orbit Ring with Vitality Nodes (Matching user screenshot) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className={`absolute ${cfg.ring1} rounded-full border border-teal-400/75 flex items-center justify-center`}
        >
          {Array.from({ length: cfg.dots }).map((_, i) => {
            const angle = (i / cfg.dots) * 360;
            return (
              <span
                key={i}
                style={{
                  transform: `rotate(${angle}deg) translate(${size === 'sm' ? '14px' : size === 'lg' ? '34px' : size === 'xl' ? '48px' : '21px'})`,
                }}
                className={`absolute ${cfg.dotSize} rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]`}
              />
            );
          })}
        </motion.div>

        {/* Popping Actual Heart Shape Center */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Radial shockwave pulse */}
          <span className="absolute w-full h-full rounded-full bg-cyan-400/30 animate-ping" />
          
          <div className="animate-heart-pop p-2 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-500 text-white shadow-md shadow-cyan-500/30 flex items-center justify-center">
            <HeartPulse className={`${cfg.heart} drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]`} />
          </div>
        </div>
      </div>

      {showLabel && (
        <div className="text-left">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {label}
          </p>
          <p className="text-[10px] font-mono text-slate-500">TrustMe AI Clinical Telemetry Active</p>
        </div>
      )}
    </div>
  );
}
