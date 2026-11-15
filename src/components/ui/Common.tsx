import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('bg-slate-200 dark:bg-[#16263D] rounded-lg opacity-70', className)}
      aria-hidden="true"
    />
  );
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const variants = {
    default:
      'bg-[#EFECE3] dark:bg-[#16263D] text-slate-700 dark:text-slate-300 border-[#E5E1D6] dark:border-[#1E2F47]',
    primary:
      'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
    success:
      'bg-lime-50 dark:bg-lime-950/40 text-lime-800 dark:text-lime-300 border-lime-200 dark:border-lime-800/60',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    danger:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    purple:
      'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border tracking-wide whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export const StudioPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      'bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] shadow-2xs transition-colors',
      className
    )}
  >
    {children}
  </div>
);

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}> = ({ eyebrow, title, description, actions, className }) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E5E1D6] dark:border-[#1E2F47]',
      className
    )}
  >
    <div className="space-y-1">
      {eyebrow && (
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400 font-mono block">
          {eyebrow}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
  </div>
);

export const ProgressMeter: React.FC<{
  value: number;
  max?: number;
  tone?: 'teal' | 'lime' | 'amber' | 'rose';
  className?: string;
  label?: string;
}> = ({ value, max = 100, tone = 'teal', className, label }) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  const fillMap = {
    teal: 'bg-teal-600 dark:bg-teal-400',
    lime: 'bg-lime-600 dark:bg-lime-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
    rose: 'bg-rose-600 dark:bg-rose-400',
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress ${pct}%`}
      className={cn(
        'w-full h-2 rounded-full bg-[#EFECE3] dark:bg-[#16263D] overflow-hidden',
        className
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-300', fillMap[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export const StatusIndicator: React.FC<{
  label: string;
  tone?: 'neutral' | 'teal' | 'lime' | 'amber' | 'rose';
  className?: string;
}> = ({ label, tone = 'neutral', className }) => {
  const dotColors = {
    neutral: 'bg-slate-400 dark:bg-slate-500',
    teal: 'bg-teal-600 dark:bg-teal-400',
    lime: 'bg-lime-600 dark:bg-lime-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
    rose: 'bg-rose-500 dark:bg-rose-400',
  };

  const textColors = {
    neutral: 'text-slate-600 dark:text-slate-400',
    teal: 'text-teal-700 dark:text-teal-300',
    lime: 'text-lime-700 dark:text-lime-300',
    amber: 'text-amber-700 dark:text-amber-300',
    rose: 'text-rose-700 dark:text-rose-300',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap', textColors[tone], className)}>
      <span className={cn('w-2 h-2 rounded-full shrink-0', dotColors[tone])} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div
    className={cn(
      'bg-white dark:bg-[#0F1D32] rounded-2xl border border-[#E5E1D6] dark:border-[#1E2F47] p-8 text-center space-y-3',
      className
    )}
  >
    <div className="w-11 h-11 rounded-xl bg-[#EFECE3] dark:bg-[#16263D] text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto">
      {icon}
    </div>
    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
      {description}
    </p>
    {action && <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">{action}</div>}
  </div>
);
