'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/UI/button'
import { useKeymakerStore } from '@/lib/store'
import { Card } from '@/components/UI/card'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timestamp: number
  read?: boolean
}

export function NotificationCenter() {
  const {
    notifications,
    removeNotification,
    clearNotifications,
    markNotificationAsRead,
  } = useKeymakerStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    // Mark all as read when opening
    if (!isOpen) {
      notifications.forEach((n) => {
        if (!n.read) {
          markNotificationAsRead(n.id)
        }
      })
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) {
      return 'just now'
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    } else {
      return new Date(timestamp).toLocaleDateString()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 z-50"
          >
            <Card className="w-96 max-h-[500px] overflow-hidden shadow-xl border-gray-800 bg-gray-900/95 backdrop-blur-md">
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearNotifications}
                      className="text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[400px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {notifications.slice(0, 20).map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-gray-800/50 transition-colors relative group"
                      >
                        <div className="flex items-start gap-3">
                          {getIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
