'use client';
import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', ...rest }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm bg-zinc-800 h, o, v, er:bg-zinc-700 d, i, s, abled:opacity-50 d, i, s, abled:cursor-not-allowed ${className}`}
      {...rest}
    />
  )
);
Button.displayName = 'Button';
export default Button;

