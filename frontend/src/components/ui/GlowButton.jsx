import { motion } from 'framer-motion';
import clsx from 'clsx';

const GlowButton = ({
  children,
  onClick,
  variant = 'cyan',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const variants = {
    cyan: {
      bg: 'bg-fs-cyan/10 hover:bg-fs-cyan/20',
      border: 'border-fs-cyan/50 hover:border-fs-cyan',
      text: 'text-fs-cyan',
      shadow: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]',
      glow: 'after:bg-fs-cyan/20',
    },
    crimson: {
      bg: 'bg-fs-crimson/10 hover:bg-fs-crimson/20',
      border: 'border-fs-crimson/50 hover:border-fs-crimson',
      text: 'text-fs-crimson',
      shadow: 'hover:shadow-[0_0_30px_rgba(255,45,85,0.3)]',
      glow: 'after:bg-fs-crimson/20',
    },
    solid: {
      bg: 'bg-fs-cyan hover:bg-fs-cyan/90',
      border: 'border-fs-cyan',
      text: 'text-fs-bg font-semibold',
      shadow: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]',
      glow: 'after:bg-fs-cyan/30',
    },
    ghost: {
      bg: 'bg-transparent hover:bg-fs-surface',
      border: 'border-fs-border hover:border-fs-muted',
      text: 'text-fs-muted hover:text-fs-text',
      shadow: '',
      glow: '',
    },
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const v = variants[variant];

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={clsx(
        'relative rounded-xl border font-medium transition-all duration-300',
        'flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        v.bg, v.border, v.text, v.shadow,
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
};

export default GlowButton;
