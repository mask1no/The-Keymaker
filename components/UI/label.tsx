'use client';
import * as React from 'react';

export function Label({
  children,
  className = '',
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium text-zinc-300 ${className}`}>
      {children}
    </label>
  );
}

export default Label;
