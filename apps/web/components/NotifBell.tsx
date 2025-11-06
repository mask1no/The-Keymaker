"use client";
import { useApp } from "../lib/store";
import { useState } from "react";

export default function NotifBell() {
  const { notifications, unreadCount, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "fixed", top: 12, right: 16, zIndex: 1000 }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ position: "relative", padding: "8px 10px", borderRadius: 10, background: "#18181b", border: "1px solid #27272a" }}>
        <span style={{ marginRight: 6 }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "white", border: "2px solid #111113", borderRadius: 999, padding: "2px 6px", fontSize: 10 }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, marginTop: 8, width: 360, maxHeight: 420, overflow: "auto", background: "#0f0f11", border: "1px solid #27272a", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", padding: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8 }}>
            <div style={{ fontWeight: 600 }}>Notifications</div>
            <button onClick={markAllRead} style={{ fontSize: 12, color: "#93c5fd" }}>Mark all read</button>
          </div>
          <div style={{ display: "grid", gap: 6, paddingBottom: 8 }}>
            {notifications.map((n) => (
              <div key={n.id} style={{ padding: 8, borderRadius: 10, border: "1px solid #27272a", background: n.read ? "#0b0b0c" : "#121214" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div style={{ color: "#a1a1aa" }}>{new Date(n.ts).toLocaleTimeString()}</div>
                </div>
                {n.body && <div style={{ fontSize: 12, color: "#d4d4d8", marginTop: 2 }}>{n.body}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {n.sig && <a target="_blank" rel="noreferrer" href={`https://solscan.io/tx/${n.sig}`} style={{ fontSize: 11, color: "#60a5fa" }}>Tx</a>}
                  {n.ca && <a target="_blank" rel="noreferrer" href={`https://solscan.io/token/${n.ca}`} style={{ fontSize: 11, color: "#60a5fa" }}>Mint</a>}
                </div>
              </div>
            ))}
            {notifications.length === 0 && <div style={{ padding: 12, fontSize: 12, color: "#a1a1aa" }}>No notifications yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}


