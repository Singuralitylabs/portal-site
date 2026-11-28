const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns:
    process.env.JEST_LOCAL_SQL === "1" && !process.env.CI
      ? ["/node_modules/"]
      : ["/node_modules/", "/tests/services/api/master-database\\.test\\.ts$"],
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
