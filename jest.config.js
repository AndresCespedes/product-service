/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    coveragePathIgnorePatterns: [
      '/src/main.ts',
      '/src/app.module.ts',
      '/src/app.controller.ts',
      '/src/app.service.ts',
      '/src/config',
      '/src/common',
      '/src/products/dto',
      '/src/products/entities',
    ],
    collectCoverage: true,
    testTimeout: 100001,
  };
  