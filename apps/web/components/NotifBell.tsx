"use client";
import { useApp } from "../lib/store";
import { useState } from "react";

export default function NotifBell() {
  const { notifications, unreadCount, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={()=>setOpen(v=>!v)}
        className="relative rounded-xl border border-zinc-700 bg-zinc-800/80 px-2.5 py-2 hover:bg-zinc-700/80 transition-colors"
      >
        <span className="mr-1.5">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-black bg-red-500 px-1.5 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[420px] overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between p-2">
            <div className="font-semibold">Notifications</div>
            <button onClick={markAllRead} className="text-xs text-blue-300 hover:text-blue-200">
              Mark all read
            </button>
          </div>
          <div className="grid gap-1.5 pb-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border border-zinc-800 p-2 ${n.read ? "bg-zinc-900/70" : "bg-zinc-900"}`}
              >
                <div className="flex justify-between text-xs">
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-zinc-400">{new Date(n.ts).toLocaleTimeString()}</div>
                </div>
                {n.body && <div className="mt-1 text-xs text-zinc-300">{n.body}</div>}
                <div className="mt-1.5 flex gap-2">
                  {n.sig && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://solscan.io/tx/${n.sig}`}
                      className="text-[11px] text-blue-300 hover:text-blue-200 underline"
                    >
                      Tx
                    </a>
                  )}
                  {n.ca && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://solscan.io/token/${n.ca}`}
                      className="text-[11px] text-blue-300 hover:text-blue-200 underline"
                    >
                      Mint
                    </a>
                  )}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-3 text-xs text-zinc-400">No notifications yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
