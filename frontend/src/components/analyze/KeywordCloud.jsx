import { motion } from 'framer-motion';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';

const KeywordCloud = ({ keywords }) => {
  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword, index) => {
        const sev = keyword.severity || 'neutral';
        
        let chipClass = '';
        let Icon = Info;
        
        if (sev === 'high') {
          chipClass = 'bg-fs-crimson/15 text-fs-crimson border-fs-crimson/35';
          Icon = AlertOctagon;
        } else if (sev === 'moderate') {
          chipClass = 'bg-fs-amber/15 text-fs-amber border-fs-amber/35';
          Icon = AlertTriangle;
        } else {
          chipClass = 'bg-fs-muted/10 text-fs-muted border-fs-border';
          Icon = Info;
        }

        return (
          <motion.span
            key={keyword.word}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs ${chipClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="font-semibold text-fs-text">{keyword.word}</span>
            <span className="text-[10px] opacity-60">TF-IDF: {keyword.score.toFixed(3)}</span>
          </motion.span>
        );
      })}
    </div>
  );
};

export default KeywordCloud;
