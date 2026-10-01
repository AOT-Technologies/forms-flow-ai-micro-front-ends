module.exports = {
  rootDir: "src",
  testEnvironment: "jsdom",
  transform: {
    // rootMode "upward": jest 29's babel-jest sets Babel's `root` to the jest
    // rootDir ("src"), so the package-root babel.config.json is otherwise
    // never found and JSX/TS transforms silently do not apply.
    "^.+\\.(j|t)sx?$": ["babel-jest", { rootMode: "upward" }],
  },
  moduleNameMapper: {
    // scss added: source files import .scss, which crashed the test parse
    // because only .css was mapped.
    "\\.(css|scss)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    // Webpack externals supplied by the root-config at runtime; not present
    // in node_modules, so map them to local manual mocks for tests.
    "^@formsflow/service$": "<rootDir>/__mocks__/formsflowService.js",
    "^@formsflow/components$": "<rootDir>/__mocks__/formsflowComponents.js",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom", "<rootDir>/setupTests.js"],
};
