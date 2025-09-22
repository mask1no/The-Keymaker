import { Agent, setGlobalDispatcher } from 'undici';
setGlobalDispatcher(
  new Agent({ connections: 128, keepAliveTimeout: 60_000, keepAliveMaxTimeout: 60_000 }),
);
export {};
