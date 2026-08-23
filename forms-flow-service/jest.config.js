// "node" not "jsdom": jest-environment-jsdom is not installed in this package and
// adding dependencies is out of scope; tests shim `window` themselves where needed.
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
  },
};
