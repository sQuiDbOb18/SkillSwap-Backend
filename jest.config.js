/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@prisma/client$": "<rootDir>/tests/mocks/prismaClient.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node",
          target: "ES2020",
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
}
