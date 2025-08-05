'use client'
import React from 'react'
import { motion } from 'framer-motion'

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#101418]/90 backdrop-blur-md rounded-2xl p-8 border border-white/10"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-white/10"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute top-0 left-1/2 w-1 h-4 bg-green-500 rounded-full -translate-x-1/2" />
            </motion.div>

            {/* Inner ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-white/5"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute top-0 left-1/2 w-1 h-2 bg-emerald-500 rounded-full -translate-x-1/2" />
            </motion.div>

            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">Loading</h3>
            <p className="text-sm text-white/60 mt-1">Please wait...</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
