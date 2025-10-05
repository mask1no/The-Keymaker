/**
 * Shared form components to eliminate duplication
 * Used across Settings, Bundle, and Wallet management
 */

import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  min?: number;
  max?: number;
  required?: boolean;
  className?: string;
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
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
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
    primary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
    secondary: 'border border-zinc-800 hover:bg-zinc-800 text-zinc-300',
    danger: 'bg-red-900 hover:bg-red-800 text-red-100',
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
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
}

export function StatusMessage({ type, children }: StatusMessageProps) {
  const typeClasses = {
    success: 'border-green-600/30 bg-green-900/20 text-green-200',
    error: 'border-red-600/30 bg-red-900/20 text-red-200',
    warning: 'border-yellow-600/30 bg-yellow-900/20 text-yellow-200',
    info: 'border-blue-600/30 bg-blue-900/20 text-blue-200',
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
  title?: string;
  children: React.ReactNode;
  className?: string;
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
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'warning';
  href?: string;
}

export function Badge({ children, variant = 'default', href }: BadgeProps) {
  const variantClasses = {
    default: 'bg-zinc-800 text-zinc-300',
    active: 'bg-blue-900 text-blue-200',
    warning: 'bg-yellow-900 text-yellow-200',
  };
  
  const baseClasses = `badge ${variantClasses[variant]}`;
  
  if (href) {
    return (
      <a href={href} className={baseClasses} style={{ textDecoration: 'none' }}>
        {children}
      </a>
    );
  }
  
  return <span className={baseClasses}>{children}</span>;
}

