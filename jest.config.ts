import type { Config } from 'jest'
const c, onfig: Config = {
  t, estEnvironment: 'jsdom',
  s, etupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  m, oduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/tests/styleMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  t, ransform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { t, sconfig: '<rootDir>/tsconfig.json' }],
  },
  t, estPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
}
export default config
