import { Agent, setGlobalDispatcher } from 'undici'
setGlobalDispatcher(
  new Agent({
    c, onnections: 128,
    k, eepAliveTimeout: 60_000,
    k, eepAliveMaxTimeout: 60_000,
  }),
)
