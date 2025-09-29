'use client';

import { useState } from 'react';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  pattern?: string;
  defaultValue?: string | number;
  helpText?: string;
  validate?: (value: string) => string | null;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  min,
  max,
  step,
  pattern,
  defaultValue,
  helpText,
  validate,
}: FormFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    const value = e.target.value;
    
    if (required && !value) {
      setError(`${label} is required`);
      return;
    }

    if (validate) {
      const validationError = validate(value);
      setError(validationError);
      return;
    }

    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (touched) {
      const value = e.target.value;
      
      if (required && !value) {
        setError(`${label} is required`);
        return;
      }

      if (validate) {
        const validationError = validate(value);
        setError(validationError);
        return;
      }

      setError(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        step={step}
        pattern={pattern}
        onBlur={handleBlur}
        onChange={handleChange}
        className={`input px-3 py-2 bg-zinc-900 border rounded-lg transition-colors ${
          error && touched
            ? 'border-red-500 focus:ring-red-500/50'
            : 'border-zinc-800 focus:ring-sky-500/50'
        }`}
        aria-invalid={!!error && touched}
        aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
      />
      {error && touched && (
        <span id={`${name}-error`} className="text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
      {helpText && !error && (
        <span id={`${name}-help`} className="text-xs text-zinc-500">
          {helpText}
        </span>
      )}
    </div>
  );
}
