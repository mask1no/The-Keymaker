"use client";
import React from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  rounded?: boolean;
  className?: string;
  area?: boolean;
};

export default function Sparkline({
  data,
  width = 260,
  height = 64,
  stroke = "#8b5cf6",
  fill = "rgba(139,92,246,0.15)",
  strokeWidth = 2,
  rounded = true,
  className,
  area = true
}: SparklineProps) {
  const points = normalize(data, width, height);
  const d = toPath(points);
  const areaD = area ? toArea(points, height) : "";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      {area && <path d={areaD} fill={fill} />}
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin={rounded ? "round" : "miter"} strokeLinecap={rounded ? "round" : "butt"} />
    </svg>
  );
}

function normalize(values: number[], width: number, height: number): Array<[number, number]> {
  const n = Math.max(1, values.length);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = Math.max(1e-9, max - min);
  const step = n > 1 ? width / (n - 1) : 0;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const x = i * step;
    const v = (values[i] - min) / span;
    const y = height - v * (height - 2) - 1;
    pts.push([x, isFinite(y) ? y : height - 1]);
  }
  return pts;
}
function toPath(pts: Array<[number, number]>): string {
  if (!pts.length) return "";
  return pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(" ");
}
function toArea(pts: Array<[number, number]>, height: number): string {
  if (!pts.length) return "";
  const head = `M ${pts[0][0]} ${height} L ${pts[0][0]} ${pts[0][1]}`;
  const body = pts.slice(1).map(([x, y]) => `L ${x} ${y}`).join(" ");
  const tail = `L ${pts[pts.length - 1][0]} ${height} Z`;
  return [head, body, tail].join(" ");
}


