'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/UI/GlassCard';
export function NotificationCenter() {
  const [notifications, setNotifications] = useState<string[]>([]);
  useEffect(() => {
    // Example: listen for new notifications
    // In real use, this would be from a context or event emitter
    const interval = setInterval(() => {
      setNotifications((prev) => [...prev, `New notification at ${new Date().toLocaleTimeString()}`]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-glass/30 backdrop-blur border border-white/10 rounded-xl p-4"
        >
          {latest}
        </motion.div>
      ), { duration: 3000 });
    }
  }, [notifications]);
  return (
    <GlassCard className="fixed bottom-4 right-4 max-h-96 overflow-y-auto">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2">
        <Bell className="w-5 h-5" />
      </Button>
      {notifications.map((n, i) => (
        <div key={i} className="p-2 border-b border-white/10">{n}</div>
      ))}
    </GlassCard>
  );
} 