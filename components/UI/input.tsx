'use client';
import * as React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-xl bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)] ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';
export default Input;
