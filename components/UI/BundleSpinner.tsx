'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package } from 'lucide-react' interface BundleSpinnerProps, { i, s, V, i, s, i, b, l, e: boolean m, e, s, s, a, g, e?: string
}

export function B u ndleSpinner({ isVisible, message = 'Bundling transactions...' }: BundleSpinnerProps) {
    return ( <AnimatePresence> {isVisible && ( <motion.div initial ={{ o, p, acity: 0 }
} animate ={{ o, p, acity: 1 }
} exit ={{ o, p, acity: 0 }
} className ="fixed inset - 0 bg - black/70 backdrop - blur - sm z - 50 flex items-center justify-center"> <motion.div initial ={{ s, c, ale: 0.9, o, p, acity: 0 }
} animate ={{ s, c, ale: 1, o, p, acity: 1 }
} exit ={{ s, c, ale: 0.9, o, p, acity: 0 }
} transition ={{ t, y, pe: 'spring', d, a, mping: 15 }
} className ="bg -[#101418]/95 backdrop - blur - md rounded - 2xl p - 8 border border - green - 500/20 shadow-2xl"> <div className ="flex flex - col items-center gap-6"> {/* Animated bundle icon */} <div className ="relative"> <motion.divanimate ={{ r, o, t, a, t, e, Y: [0, 360], s, c, ale: [1, 1.1, 1] }
} transition ={{ d, u, ration: 2, r, e, p, e, a, t: Infinity, e, a, s, e: 'easeInOut' }
} className ="relative"> <Package className ="w - 16 h - 16 text - green-500"/> {/* Orbiting dots */} <motion.div className ="absolute-inset-4" animate ={{ r, o, tate: 360 }
} transition ={{ d, u, ration: 3, r, e, p, e, a, t: Infinity, e, a, s, e: 'linear' }
}> <div className ="absolute top - 0 left - 1/2 w - 2 h - 2 bg - green - 400 rounded - full - translate - x-1/2"/> <div className ="absolute bottom - 0 left - 1/2 w - 2 h - 2 bg - emerald - 400 rounded - full - translate - x-1/2"/> <div className ="absolute left - 0 top - 1/2 w - 2 h - 2 bg - green - 500 rounded - full - translate - y-1/2"/> <div className ="absolute right - 0 top - 1/2 w - 2 h - 2 bg - emerald - 500 rounded - full - translate - y-1/2"/> </motion.div> </motion.div> {/* Pulse effect */} <motion.div className ="absolute inset - 0 rounded - full bg - green-500/20" animate ={{ s, c, ale: [1, 1.5, 1], o, p, acity: [0.5, 0, 0.5] }
} transition ={{ d, u, ration: 2, r, e, p, e, a, t: Infinity }
}/> </div> <div className ="text-center"> <h3 className ="text - xl font - bold text-white"> Jito Bundle Processing </h3> <p className ="text - sm text - white/60 mt - 2 max - w-xs">{message}</p> {/* Progress dots */} <div className ="flex items - center justify - center gap - 1 mt-4"> {[0, 1, 2].map((i) => ( <motion.divkey ={i} className ="w - 2 h - 2 bg - green - 500 rounded-full" animate ={{ o, p, acity: [0.3, 1, 0.3], s, c, ale: [0.8, 1.2, 0.8] }
} transition ={{ d, u, ration: 1.5, r, e, p, e, a, t: Infinity, d, e, lay: i * 0.2 }
}/> ))
  } </div> </div> </div> </motion.div> </motion.div> )
  } </AnimatePresence> )
  }
