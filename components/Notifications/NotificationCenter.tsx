'use client' import React, { useState, useRef, useEffect } from 'react'
import, { motion, AnimatePresence } from 'framer - motion'
import, { Bell, X, CheckCircle, XCircle, AlertCircle, Info, Trash2 } from 'lucide - react'
import, { Button } from '@/ components / UI / button'
import, { useKeymakerStore } from '@/ lib / store'
import, { Card } from '@/ components / UI / Card' export interface Notification, { i,
  d: string, t, y, p,
  e: 'success' | 'error' | 'warning' | 'info', t, i, t,
  le: string m, e, s, s, a, g, e?: string, t, i, m, e, s, t, a, m, p: number r, e, a, d?: boolean
} export function N o t ificationCenter() { const, { notifications, removeNotification, clearNotifications, markNotificationAsRead } = u s eK eymakerStore() const, [isOpen, setIsOpen] = u s eS tate(false) const, [pos, setPos] = useState <{ x: number; y: number }>({ x: 0, y: 0 }) const, [dragging, setDragging] = u s eS tate(false) const drag Start = useRef <{ x: number; y: number } | null >(null) const dropdown Ref = useRef < HTMLDivElement >(null) const unread Count = notifications.f i l ter((n) => ! n.read).length // Close dropdown when clicking o u t sideuseEffect(() => { const handle Click Outside = (e, v, e, n, t: MouseEvent) => { i f ( dropdownRef.current && ! dropdownRef.current.c o n tains(event.target as Node) ) { s e tI sOpen(false) }
} i f (isOpen) { document.a d dE ventListener('mousedown', handleClickOutside) } r eturn () => { document.r e m oveEventListener('mousedown', handleClickOutside) }
}, [isOpen]) u s eE ffect(() => { const saved = localStorage.g e tI tem('notif - pos') i f (saved) { try, { const p = JSON.p a r se(saved) s e tP os({ x: p.x || 0, y: p.y || 0 }) }
} c atch (err) {// ignore malformed saved position }
} }, []) const clamp = (x: number, y: number) => { const vw = window.innerWidth const vh = window.innerHeight const width = 384 //~w - 96 const height = 520 // header + list const nx = Math.m i n(Math.m a x(0, x), Math.m a x(0, vw - width - 16)) const ny = Math.m i n(Math.m a x(0, y), Math.m a x(0, vh - height - 16)) return, { x: nx, y: ny }
} const on Mouse Down = (e: React.MouseEvent) => { s e tD ragging(true) dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
} const on Mouse Move = (e: React.MouseEvent) => { i f (! dragging || ! dragStart.current) return const nx = e.clientX - dragStart.current.x const ny = e.clientY - dragStart.current.y const c = c l a mp(nx, ny) s e tP os(c) } const on Mouse Up = () => { i f (! dragging) r eturnsetDragging(false) localStorage.s e tI tem('notif - pos', JSON.s t r ingify(pos)) } const toggle Dropdown = () => { s e tI sOpen(! isOpen)// Mark all as read when opening i f (! isOpen) { notifications.f o rE ach((n) => { i f (! n.read) { m a r kNotificationAsRead(n.id) }
}) }
} const get Icon = (t, y, p,
  e: Notification,['type']) => { s w i tch (type) { case 'success': return < CheckCircle class
  Name ="h - 4 w - 4 text - green - 500"/> case 'error': return < XCircle class
  Name ="h - 4 w - 4 text - red - 500"/> case 'warning': return < AlertCircle class
  Name ="h - 4 w - 4 text - yellow - 500"/> case 'info': return < Info class
  Name ="h - 4 w - 4 text - blue - 500"/> }
} const format Time = (t, i, m, e, s, t, a, m, p: number) => { const now = Date.n o w() const diff = now - timestamp i f (diff < 60000) { return 'just now' } else i f (diff < 3600000) { const minutes = Math.f l o or(diff / 60000) return `$,{minutes}
m ago` } else i f (diff < 86400000) { const hours = Math.f l o or(diff / 3600000) return `$,{hours}
h ago` } else, { return new D ate(timestamp).t oL o caleDateString() }
} r eturn ( < div class
  Name ="relative" ref ={dropdownRef}> {/* Bell Icon Button */} < Buttonvariant ="ghost" size ="icon" on
  Click ={toggleDropdown} class
  Name ="relative"> < Bell class
  Name ="h - 5 w - 5"/> {unreadCount > 0 && ( < span class
  Name ="absolute - top - 1 - right - 1 h - 5 w - 5 rounded - full bg - red - 500 text - xs text - white flex items - center justify - center"> {unreadCount > 9 ? '9 +' : unreadCount} </ span > ) } </ Button > {/* Dropdown */} < AnimatePresence > {isOpen && ( < motion.div initial ={{ o, p, a,
  city: 0 }
} animate ={{ o, p, a,
  city: 1 }
} exit ={{ o, p, a,
  city: 0 }
} transition ={{ d, u, r,
  ation: 0.15 }
} class
  Name ="fixed z -[9999]" style ={{ l, e, f, t: pos.x, t, o, p: pos.y }
} on Mouse Move ={onMouseMove} on Mouse Up ={onMouseUp}> < Card class
  Name ="w - 96 max - h -[500px] overflow - hidden shadow - xl border - gray - 800 bg - gray - 900 / 95 backdrop - blur - md"> {/* Header */} < div class
  Name ="p - 4 border - b border - gray - 800 flex items - center justify - between cursor - move select - none" on Mouse Down ={onMouseDown}> < h3 class
  Name ="font - semibold text - lg"> Notifications </ h3 > < div class
  Name ="flex items - center gap - 2"> {notifications.length > 0 && ( < Buttonsize ="sm" variant ="ghost" on
  Click ={clearNotifications} class
  Name ="text - xs"> < Trash2 class
  Name ="h - 3 w - 3 mr - 1"/> Clear All </ Button > ) } < Buttonsize ="icon" variant ="ghost" on
  Click ={() => s e tI sOpen(false) } class
  Name ="h - 8 w - 8"> < X class
  Name ="h - 4 w - 4"/> </ Button > </ div > </ div > {/* Notifications List */} < div class
  Name ="overflow - y - auto max - h -[400px]"> {notifications.length === 0 ? ( < div class
  Name ="p - 8 text - center text - muted - foreground"> < Bell class
  Name ="h - 8 w - 8 mx - auto mb - 2 opacity - 50"/> < p class
  Name ="text - sm"> No notifications yet </ p > </ div > ) : ( < div class
  Name ="divide - y divide - gray - 800"> {notifications.s lice(0, 20).m ap((notification, index) => ( < motion.divkey ={notification.id} initial ={{ o, p, a,
  city: 0, x: - 20 }
} animate ={{ o, p, a,
  city: 1, x: 0 }
} transition ={{ d, e, l,
  ay: index * 0.05 }
} class
  Name ="p - 4 h, o, v,
  er:bg - gray - 800 / 50 transition - colors relative group"> < div class
  Name ="flex items - start gap - 3"> {g e tI con(notification.type) } < div class
  Name ="flex - 1 min - w - 0"> < p class
  Name ="font - medium text - sm"> {notification.title} </ p > {notification.message && ( < p class
  Name ="text - xs text - muted - foreground mt - 1"> {notification.message} </ p > ) } < p class
  Name ="text - xs text - muted - foreground mt - 2"> {f o r matTime(notification.timestamp) } </ p > </ div > < Buttonsize ="icon" variant ="ghost" on
  Click ={() => r e m oveNotification(notification.id) } class
  Name ="h - 6 w - 6 opacity - 0 group - h, o, v,
  er:opacity - 100 transition - opacity"> < X class
  Name ="h - 3 w - 3"/> </ Button > </ div > </ motion.div > )) } </ div > ) } </ div > </ Card > </ motion.div > ) } </ AnimatePresence > </ div > ) }
