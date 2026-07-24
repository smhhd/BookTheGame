module.exports = {
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
  },
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setupEnv.ts"],
  roots: ["<rootDir>/tests"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/jobs/runExpirationJob.ts"]
};
