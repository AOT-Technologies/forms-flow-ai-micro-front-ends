module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
    "@formsflow/service": "<rootDir>/__mocks__/@formsflow/service.js"
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom","<rootDir>/jest.setup.js"],
};
