'use client';
import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...rest }, ref) => {
    const cls =
      variant === 'primary'
        ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
        : variant === 'outline'
          ? 'border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
          : 'text-zinc-300 hover:bg-zinc-800';
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-600 ${cls} ${className}`}
        {...rest}
      />
    );
  },
);
Button.displayName = 'Button';
