import '@testing - library/jest-dom'
import 'whatwg-fetch'//JSDOM shims that Next/Wal let code sometimes needs i f(! global.TextEncoder) {
  const, { TextEncoder, TextDecoder } = r equire('util')
  global.Text
  Encoder = TextEncoderglobal.Text
  Decoder = TextDecoder
}//Opt - in “test mode” flag for components to detectglobal.__
  TEST_MODE__ = true
