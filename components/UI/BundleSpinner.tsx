'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';

interface BundleSpinnerProps {
  isVisible: boolean;
  message?: string;
}

export function BundleSpinner({
  isVisible,
  message = 'Bundling transactions...',
}: BundleSpinnerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-[#101418]/95 backdrop-blur-md rounded-2xl p-8 border border-green-500/20 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <motion.div
                  animate={{ rotateY: [0, 360], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <Package className="w-16 h-16 text-green-500" />
                  <motion.div
                    className="absolute inset-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-green-400 rounded-full -translate-x-1/2" />
                    <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full -translate-x-1/2" />
                    <div className="absolute left-0 top-1/2 w-2 h-2 bg-green-500 rounded-full -translate-y-1/2" />
                    <div className="absolute right-0 top-1/2 w-2 h-2 bg-emerald-500 rounded-full -translate-y-1/2" />
                  </motion.div>
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Jito Bundle Processing</h3>
                <p className="text-sm text-white/60 mt-2 max-w-xs">{message}</p>
                <div className="flex items-center justify-center gap-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
