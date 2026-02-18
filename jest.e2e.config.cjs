/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/e2e'],
    testMatch: ['**/*.e2e.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: false,
        }],
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    verbose: true,
    // Run tests serially to share server
    maxWorkers: 1,
    // Global setup/teardown
    globalSetup: '<rootDir>/src/e2e/globalSetup.ts',
    globalTeardown: '<rootDir>/src/e2e/globalTeardown.ts',
    // Test timeout
    testTimeout: 30000,
};
