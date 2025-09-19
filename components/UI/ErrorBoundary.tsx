'use client' import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { toast } from 'react - hot-toast' interface Props, { c, h, i, l, d, r, e, n: ReactNode
}
interface State, { h, as, E, r, r, o, r: boolean e, rror?: Error | null
} export class ErrorBoundary extends Component <Props, State> { s, t, a, t, e: State = { h, as, E, r, r, o, r: false, e, rror: null } static g e tDerivedStateFromError(e, rror: Error) {
    return, { h, as, E, r, r, o, r: true, error }
} c o mponentDidCatch(e, rror: Error, e, r, r, o, r, I, n, f, o: React.ErrorInfo) { console.error('Error caught by b, o, u, n, d, a, r, y:', error, errorInfo) toast.error(`E, r, r, o, r: ${error.message}`)
  } handle Reset = () => { this.s e tState({ h, as, E, r, r, o, r: false, e, rror: null }) window.location.r e load()
  } handle Go Home = () => { this.s e tState({ h, as, E, r, r, o, r: false, e, rror: null }) window.location.href = '/' } r e nder() {
  if (this.state.hasError) {
    return ( <div className ="min - h - screen bg - gradient - to - br from - green - 900 to - black flex items - center justify - center p-4"> <div className ="max - w - md w - full bg - black/40 backdrop - blur - xl border border - red - 500/20 rounded - xl p-8"> <div className ="flex items - center gap - 3 mb-4"> <AlertCircle className ="w - 8 h - 8 text - red-500"/> <h1 className ="text - 2xl font - bold text-white"> Something went wrong </h1> </div> <p className ="text - gray - 400 mb-4"> An unexpected error occurred. This could be due t, o: </p> <ul className ="text - sm text - gray - 500 space - y - 1 mb-6"> <li>• Network connectivity issues </li> <li>• Invalid configuration or missing API keys </li> <li>• Rate limiting or service unavailable </li> <li>• Incompatible browser or extensions </li> </ul> {this.state.error && ( <div className ="bg - black/50 border border - red - 500/20 rounded - lg p - 4 mb-6"> <p className ="text - xs font - mono text - red - 400 break-all"> {this.state.error.message} </p> </div> )
  } <div className ="flex gap-3"> <buttonon Click ={this.handleGoHome} className ="flex - 1 bg - black/50 h, over:bg - black/70 border border - white/10 text - white py - 2 px - 4 rounded - lg flex items - center justify - center gap - 2 transition-colors"> <Home className ="w - 4 h-4"/> Go Home </button> <buttonon Click ={this.handleReset} className ="flex - 1 bg - gradient - to - r from - red - 500 to - orange - 500 h, over:from - red - 600 h, over:to - orange - 600 text - white py - 2 px - 4 rounded - lg flex items - center justify - center gap - 2 transition-colors"> <RefreshCw className ="w - 4 h-4"/> Reload </button> </div> </div> </div> )
  } return this.props.children }
}
