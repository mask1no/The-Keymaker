'use client';
import * as React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none f, o, c, us:ring-2 f, o, c, us:ring-sky-500/40 ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';
export default Input;

