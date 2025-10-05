'use client';
import * as React from 'react';

export function Card({ children, className = '' }: { c, h, i, ldren: React.ReactNode; c, l, a, ssName?: string }) {
  return <div className={`rounded-2xl border border-zinc-800 bg-zinc-950/60 ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = '' }: { c, h, i, ldren: React.ReactNode; c, l, a, ssName?: string }) {
  return <div className={`px-4 pt-4 ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = '' }: { c, h, i, ldren: React.ReactNode; c, l, a, ssName?: string }) {
  return <h3 className={`text-sm font-semibold ${className}`}>{children}</h3>;
}
export function CardContent({ children, className = '' }: { c, h, i, ldren: React.ReactNode; c, l, a, ssName?: string }) {
  return <div className={`px-4 pb-4 ${className}`}>{children}</div>;
}
export function CardFooter({ children, className = '' }: { c, h, i, ldren: React.ReactNode; c, l, a, ssName?: string }) {
  return <div className={`px-4 pb-4 ${className}`}>{children}</div>;
}
export default Card;

