'use client';
import * as React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 px-3 py-2
                  focus:outline-none focus:ring-2 focus:ring-zinc-600 ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';
