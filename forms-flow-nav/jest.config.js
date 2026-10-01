const path = require("path");

module.exports = {
  rootDir: "src",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(j|t)sx?$": [
      "babel-jest",
      { configFile: path.resolve(__dirname, "babel.config.json") },
    ],
  },
  moduleNameMapper: {
    // scss added: source files import .scss, which previously crashed the
    // test parse because only .css was mapped.
    "\\.(css|scss)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    // Webpack externals supplied by the root-config at runtime; not present
    // in node_modules, so map them to local manual mocks for tests.
    "^@formsflow/service$": "<rootDir>/__mocks__/formsflowService.js",
    "^@formsflow/components$": "<rootDir>/__mocks__/formsflowComponents.js",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom", "<rootDir>/setupTests.js"],
};
