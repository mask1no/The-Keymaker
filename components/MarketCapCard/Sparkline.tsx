'use client';
import React from 'react';

interface SparklineProps {
  data: { time: number; price: number }[];
  color?: string;
  className?: string;
}

export function Sparkline({ data, color = '#06b6d4', className = '' }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={`w-full h-full ${className}`} />;
  }

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const width = 100;
  const height = 40;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((d.price - minPrice) / priceRange) * (height - 2 * padding) - padding;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full h-full ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* Fill area */}
      <polygon
        points={fillPoints}
        fill="url(#sparkline-gradient)"
      />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Current price dot */}
      {data.length > 0 && (
        <circle
          cx={width - padding}
          cy={height - ((data[data.length - 1].price - minPrice) / priceRange) * (height - 2 * padding) - padding}
          r="3"
          fill={color}
          className="animate-pulse"
        />
      )}
    </svg>
  );
}