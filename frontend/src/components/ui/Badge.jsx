import clsx from 'clsx';

const Badge = ({ type = 'real', size = 'md', children }) => {
  const styles = {
    fake: 'bg-fs-crimson/15 text-fs-crimson border-fs-crimson/30',
    real: 'bg-fs-cyan/15 text-fs-cyan border-fs-cyan/30',
    neutral: 'bg-fs-muted/15 text-fs-muted border-fs-muted/30',
    success: 'bg-fs-green/15 text-fs-green border-fs-green/30',
    warning: 'bg-fs-amber/15 text-fs-amber border-fs-amber/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-semibold uppercase tracking-wider',
        styles[type],
        sizes[size]
      )}
    >
      {children || type.toUpperCase()}
    </span>
  );
};

export default Badge;
