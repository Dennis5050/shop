import React from 'react';

const badgeVariants = {
  brand: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  slate: 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  counter: 'bg-brand-500 text-white font-bold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-none shadow-sm',
};

export function Badge({
  children,
  variant = 'brand',
  className = '',
}) {
  const variantClass = badgeVariants[variant] || badgeVariants.brand;

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
