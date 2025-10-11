'use client';
import * as React from 'react';

export function Select({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100"
      >
        {children}
      </select>
    </div>
  );
}

export function SelectTrigger({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-zinc-400">{placeholder}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">{children}</div>;
}

export function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
  return (
    <option value={value} className="px-3 py-2 text-zinc-100 hover:bg-zinc-800">
      {children}
    </option>
  );
}

export default Select;
