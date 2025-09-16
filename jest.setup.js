import '@testing-library/jest-dom'
import 'whatwg-fetch'

// JSDOM shims that Next/Wal let code sometimes needs if(!global.TextEncoder) {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoderglobal.TextDecoder = TextDecoder
}

// Opt-in “test mode” flag for components to detectglobal.__TEST_MODE__ = true
