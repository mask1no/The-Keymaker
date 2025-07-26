'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import TokenForm from './TokenForm';
import { GlassCard } from '@/components/UI/GlassCard';

export default function MemecoinCreator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-8 h-8 text-aqua" />
          <h2 className="text-2xl font-bold text-white">Token Creator</h2>
        </div>
        <TokenForm />
      </GlassCard>
    </motion.div>
  );
} 