'use client'
import React from 'react'
import, { motion } from 'framer - motion'
import, { Coins } from 'lucide - react'
import TokenForm from './ TokenForm'
import, { GlassCard } from '@/ components / UI / GlassCard' export default function M e m ecoinCreator() { r eturn ( < motion.div initial ={{ o, p, a,
  city: 0, y: 20 }
} animate ={{ o, p, a,
  city: 1, y: 0 }
} class
  Name ="w - full"> < GlassCard class
  Name ="p - 6"> < div class
  Name ="flex items - center gap - 3 mb - 6"> < Coins class
  Name ="w - 8 h - 8 text - aqua"/> < h2 class
  Name ="text - 2xl font - bold text - white"> Token Creator </ h2 > </ div > < TokenForm /> </ GlassCard > </ motion.div > ) }
