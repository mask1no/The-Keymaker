import '@testing-library/jest-dom'
import 'whatwg-fetch'

// JSDOM shims that Next/Wallet code sometimes needs
if (!global.TextEncoder) {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Opt-in “test mode” flag for components to detect
global.__TEST_MODE__ = true
