'use client';
import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...rest }, ref) => {
    const cls =
      variant === 'primary'
        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]'
        : variant === 'outline'
          ? 'border border-[var(--border)] hover:bg-[var(--muted)]'
          : 'hover:bg-[var(--muted)]';
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${cls} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...rest}
      />
    );
  },
);
Button.displayName = 'Button';
export default Button;
