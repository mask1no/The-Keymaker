import '@testing - library/jest-dom'
import 'whatwg-fetch'//JSDOM shims that Next/Wal let code sometimes needs if (!global.TextEncoder) {
  const { TextEncoder, TextDecoder } = r e quire('util') global.Text Encoder = TextEncoderglobal.Text Decoder = TextDecoder
}//Opt - in “test mode” flag for components to detectglobal.__ T EST_MODE__ = true
