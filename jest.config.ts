import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/generated/jest/**/*.spec.ts'],
  collectCoverageFrom: ['<rootDir>/test/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage/jest',
  coverageProvider: 'v8',
  coverageReporters: ['html', 'text-summary', 'json-summary'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};

export default config;
