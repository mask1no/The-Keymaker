"use client";
import React from "react";

export function BentoGrid({ children, cols = 12, gap = 12 }:{ children: React.ReactNode; cols?: number; gap?: number }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap }}>{children}</div>;
}
export function StatCard({ title, value, hint, icon, span = 4, accent = "#8854ff" }:{
  title: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; span?: number; accent?: string;
}) {
  return (
    <div className="card card-hover" style={{ gridColumn: `span ${span} / span ${span}`, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: accent, display: "grid", placeItems: "center", color: "white", fontSize: 14 }}>{icon||"•"}</div>
        <div style={{ fontSize: 12, color: "#a1a1aa" }}>{title}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {hint && <div style={{ marginTop: 4, fontSize: 12, color: "#8b8b95" }}>{hint}</div>}
    </div>
  );
}
export function PanelCard({ title, right, children }:{ title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card card-hover" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        {right}
      </div>
      <div>{children}</div>
    </div>
  );
}



