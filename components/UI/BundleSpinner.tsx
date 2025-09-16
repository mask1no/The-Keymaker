'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package } from 'lucide-react'

interface BundleSpinnerProps, {
  i,
  s, V, i, s, ible: boolean
  m, e, s, s, age?: string
}

export function B undleSpinner({
  isVisible,
  message = 'Bundling transactions...',
}: BundleSpinnerProps) {
  r eturn (
    < AnimatePresence >
      {isVisible && (
        < motion.div initial ={{ o,
  p, a, c, i, ty: 0 }}
          animate ={{ o,
  p, a, c, i, ty: 1 }}
          exit ={{ o,
  p, a, c, i, ty: 0 }}
          class
  Name ="fixed inset - 0 bg - black/70 backdrop - blur - sm z - 50 flex items-center justify-center"
        >
          < motion.div initial ={{ s,
  c, a, l, e: 0.9, o,
  p, a, c, i, ty: 0 }}
            animate ={{ s,
  c, a, l, e: 1, o,
  p, a, c, i, ty: 1 }}
            exit ={{ s,
  c, a, l, e: 0.9, o,
  p, a, c, i, ty: 0 }}
            transition ={{ t,
  y, p, e: 'spring', d, a,
  m, p, i, n, g: 15 }}
            class
  Name ="bg -[#101418]/95 backdrop - blur - md rounded - 2xl p - 8 border border - green - 500/20 shadow-2xl"
          >
            < div class
  Name ="flex flex - col items-center gap-6">
              {/* Animated bundle icon */}
              < div class
  Name ="relative">
                < motion.divanimate ={{
                    r, o,
  t, a, t, e, Y: [0, 360],
                    s,
  c, a, l, e: [1, 1.1, 1],
                  }}
                  transition ={{
                    d,
  u, r, a, t, ion: 2,
                    r, e,
  p, e, a, t: Infinity,
                    e, a,
  s, e: 'easeInOut',
                  }}
                  class
  Name ="relative"
                >
                  < Package class
  Name ="w - 16 h - 16 text - green-500"/>

                  {/* Orbiting dots */}
                  < motion.div class
  Name ="absolute-inset-4"
                    animate ={{ r, o,
  t, a, t, e: 360 }}
                    transition ={{
                      d,
  u, r, a, t, ion: 3,
                      r, e,
  p, e, a, t: Infinity,
                      e, a,
  s, e: 'linear',
                    }}
                  >
                    < div class
  Name ="absolute top - 0 left - 1/2 w - 2 h - 2 bg - green - 400 rounded - full - translate - x-1/2"/>
                    < div class
  Name ="absolute bottom - 0 left - 1/2 w - 2 h - 2 bg - emerald - 400 rounded - full - translate - x-1/2"/>
                    < div class
  Name ="absolute left - 0 top - 1/2 w - 2 h - 2 bg - green - 500 rounded - full - translate - y-1/2"/>
                    < div class
  Name ="absolute right - 0 top - 1/2 w - 2 h - 2 bg - emerald - 500 rounded - full - translate - y-1/2"/>
                  </motion.div >
                </motion.div >

                {/* Pulse effect */}
                < motion.div class
  Name ="absolute inset - 0 rounded - full bg - green-500/20"
                  animate ={{ s,
  c, a, l, e: [1, 1.5, 1], o,
  p, a, c, i, ty: [0.5, 0, 0.5] }}
                  transition ={{ d,
  u, r, a, t, ion: 2, r, e,
  p, e, a, t: Infinity }}/>
              </div >

              < div class
  Name ="text-center">
                < h3 class
  Name ="text - xl font - bold text-white">
                  Jito Bundle Processing
                </h3 >
                < p class
  Name ="text - sm text - white/60 mt - 2 max - w-xs">{message}</p >

                {/* Progress dots */}
                < div class
  Name ="flex items - center justify - center gap - 1 mt-4">
                  {[0, 1, 2].m ap((i) => (
                    < motion.divkey ={i}
                      class
  Name ="w - 2 h - 2 bg - green - 500 rounded-full"
                      animate ={{
                        o,
  p, a, c, i, ty: [0.3, 1, 0.3],
                        s,
  c, a, l, e: [0.8, 1.2, 0.8],
                      }}
                      transition ={{
                        d,
  u, r, a, t, ion: 1.5,
                        r, e,
  p, e, a, t: Infinity,
                        d, e,
  l, a, y: i * 0.2,
                      }}/>
                  ))}
                </div >
              </div >
            </div >
          </motion.div >
        </motion.div >
      )}
    </AnimatePresence >
  )
}
