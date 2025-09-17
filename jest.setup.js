import '@testing-library/jest-dom'
import 'whatwg-fetch'

// JSDOM shims
if (!(global as any).TextEncoder) {
  const { TextEncoder, TextDecoder } = require('util')
  ;(global as any).TextEncoder = TextEncoder
  ;(global as any).TextDecoder = TextDecoder
}

;(global as any).__TEST_MODE__ = true
