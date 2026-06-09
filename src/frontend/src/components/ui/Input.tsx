import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-text uppercase tracking-[0.05em]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full p-3 bg-elevated border border-border rounded-lg text-foreground text-sm transition-all focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--border-muted)] disabled:opacity-50 ${
          error ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[0.75rem] leading-1.4 text-error">{error}</span>}
    </div>
  );
}
);