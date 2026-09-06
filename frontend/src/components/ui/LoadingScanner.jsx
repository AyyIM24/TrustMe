import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

const LoadingScanner = ({ isVisible, text = '' }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-fs-bg/95 backdrop-blur-sm"
        >
          <div className="relative flex flex-col items-center gap-8">
            {/* Scanning shield animation */}
            <motion.div
              className="relative"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Shield className="w-24 h-24 text-fs-cyan/30" strokeWidth={1} />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Shield className="w-24 h-24 text-fs-cyan" strokeWidth={1.5} />
              </motion.div>
            </motion.div>

            {/* Scan line effect over text preview */}
            {text && (
              <div className="relative w-[500px] max-w-[90vw] h-32 overflow-hidden rounded-xl bg-fs-surface/50 border border-fs-border p-4">
                <p className="text-fs-muted/40 text-sm font-mono leading-relaxed blur-[2px]">
                  {text.substring(0, 300)}...
                </p>
                <motion.div
                  className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-fs-cyan to-transparent"
                  style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.6)' }}
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}

            {/* Status text */}
            <div className="flex items-center gap-3">
              <span className="text-fs-cyan font-mono text-lg tracking-widest uppercase">
                Analyzing
              </span>
              <motion.span
                className="text-fs-cyan font-mono text-lg"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ...
              </motion.span>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-fs-cyan"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScanner;
