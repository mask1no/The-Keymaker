import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/tests/styleMock.js',
    '^@/(.*)$': '<rootDir>/$1' },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/'] }

export default config
