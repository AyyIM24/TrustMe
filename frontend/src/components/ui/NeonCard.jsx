import { motion } from 'framer-motion';
import clsx from 'clsx';

const NeonCard = ({
  children,
  variant = 'default',
  hover = true,
  className = '',
  ...props
}) => {
  const variants = {
    default: 'border-fs-border',
    cyan: 'border-fs-cyan/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]',
    crimson: 'border-fs-crimson/30 shadow-[0_0_15px_rgba(255,45,85,0.1)]',
    green: 'border-fs-green/30 shadow-[0_0_15px_rgba(0,255,136,0.1)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={clsx(
        'bg-fs-surface rounded-2xl border p-6 transition-all duration-300',
        variants[variant],
        hover && 'hover:border-fs-muted/50',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default NeonCard;
