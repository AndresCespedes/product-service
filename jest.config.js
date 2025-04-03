/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testRegex": ".*\\.spec\\.ts$",
  "testPathIgnorePatterns": ['/node_modules/', '/test/integration.spec.ts'],
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!src/**/*.dto.ts",
    "!src/**/*.entity.ts",
    "!src/**/*.interface.ts",
    "!src/**/index.ts",
  ],
  coveragePathIgnorePatterns: [
    '/src/main.ts',
    '/src/app.module.ts',
    '/src/common',
    '/src/config',
  ],
  "coverageDirectory": "./coverage",
  "coverageReporters": ["text-summary", "lcov", "html"],
  "testEnvironment": "node",
};
