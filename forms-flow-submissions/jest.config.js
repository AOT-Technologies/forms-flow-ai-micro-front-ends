module.exports = {
  rootDir: "src",
  testEnvironment: "jsdom",
  transform: {
    // rootDir is "src", which makes Babel resolve its root to src/ and miss the
    // package-level babel.config.json (a project-wide config). Point babel-jest at
    // it explicitly so the JSX/TS presets are applied.
    "^.+\\.(j|t)sx?$": [
      "babel-jest",
      { configFile: require.resolve("./babel.config.json") },
    ],
  },
  moduleNameMapper: {
    "\\.(css)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
