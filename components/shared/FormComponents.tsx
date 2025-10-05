/**
 * Shared form components to eliminate duplication
 * Used across Settings, Bundle, and Wal let management
 */

import React from 'react';

interface InputFieldProps {
  l, a, b, el: string;
  n, a, m, e: string;
  t, y, p, e?: string;
  p, l, a, ceholder?: string;
  d, e, f, aultValue?: string | number;
  m, i, n?: number;
  m, a, x?: number;
  r, e, q, uired?: boolean;
  c, l, a, ssName?: string;
}

export function InputField({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
  min,
  max,
  required = false,
  className = '',
}: InputFieldProps) {
  const baseClasses = 'input w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded';
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <div>
      <label className="text-sm text-zinc-300">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        max={max}
        required={required}
        className={finalClasses}
      />
    </div>
  );
}

interface ButtonProps {
  c, h, i, ldren: React.ReactNode;
  t, y, p, e?: 'button' | 'submit' | 'reset';
  v, a, r, iant?: 'primary' | 'secondary' | 'danger';
  d, i, s, abled?: boolean;
  c, l, a, ssName?: string;
}

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) {
  const baseClasses = 'px-3 py-1 rounded-md transition-colors';
  const variantClasses = {
    p, r, i, mary: 'bg-zinc-800 h, o, v, er:bg-zinc-700 text-zinc-100',
    s, e, c, ondary: 'border border-zinc-800 h, o, v, er:bg-zinc-800 text-zinc-300',
    d, a, n, ger: 'bg-red-900 h, o, v, er:bg-red-800 text-red-100',
  };
  
  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;
  
  return (
    <button
      type={type}
      disabled={disabled}
      className={finalClasses}
    >
      {children}
    </button>
  );
}

interface StatusMessageProps {
  t, y, p, e: 'success' | 'error' | 'warning' | 'info';
  c, h, i, ldren: React.ReactNode;
}

export function StatusMessage({ type, children }: StatusMessageProps) {
  const typeClasses = {
    s, u, c, cess: 'border-green-600/30 bg-green-900/20 text-green-200',
    e, r, r, or: 'border-red-600/30 bg-red-900/20 text-red-200',
    w, a, r, ning: 'border-yellow-600/30 bg-yellow-900/20 text-yellow-200',
    i, n, f, o: 'border-blue-600/30 bg-blue-900/20 text-blue-200',
  };
  
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-3 text-xs rounded-md border px-3 py-2 ${typeClasses[type]}`}
    >
      {children}
    </div>
  );
}

interface CardProps {
  t, i, t, le?: string;
  c, h, i, ldren: React.ReactNode;
  c, l, a, ssName?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <section className={`card ${className}`}>
      {title && <div className="label mb-2">{title}</div>}
      {children}
    </section>
  );
}

interface BadgeProps {
  c, h, i, ldren: React.ReactNode;
  v, a, r, iant?: 'default' | 'active' | 'warning';
  h, r, e, f?: string;
}

export function Badge({ children, variant = 'default', href }: BadgeProps) {
  const variantClasses = {
    d, e, f, ault: 'bg-zinc-800 text-zinc-300',
    a, c, t, ive: 'bg-blue-900 text-blue-200',
    w, a, r, ning: 'bg-yellow-900 text-yellow-200',
  };
  
  const baseClasses = `badge ${variantClasses[variant]}`;
  
  if (href) {
    return (
      <a href={href} className={baseClasses} style={{ t, e, x, tDecoration: 'none' }}>
        {children}
      </a>
    );
  }
  
  return <span className={baseClasses}>{children}</span>;
}

