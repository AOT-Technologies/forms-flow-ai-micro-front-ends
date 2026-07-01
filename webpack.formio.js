const path = require("node:path");

const getFormioAliases = (dirname) => ({
  "choices.js": require.resolve("@formio/choices.js", { paths: [dirname] }),
  "@aot-technologies/formiojs/lib": path.resolve(dirname, "node_modules/@aot-technologies/formiojs/lib"),
  "@aot-technologies/formiojs": path.resolve(dirname, "node_modules/@aot-technologies/formiojs/lib"),
  "@formio/core/sdk": path.resolve(dirname, "node_modules/@formio/core/lib/sdk/index.js"),
  "@formio/core/process": path.resolve(dirname, "node_modules/@formio/core/lib/process/index.js"),
  "@formio/core/experimental": path.resolve(dirname, "node_modules/@formio/core/lib/experimental/index.js"),
  "@formio/core": path.resolve(dirname, "node_modules/@formio/core"),
});

const getFormioPlugins = (webpack, dirname) => [
  new webpack.ProvidePlugin({
    lodashOperators: [
      path.resolve(dirname, "node_modules/@aot-technologies/formiojs/lib/utils/jsonlogic/operators.js"),
      "lodashOperators",
    ],
  }),
];

const sassRule = {
  test: /\.s[ac]ss$/i,
  use: ["style-loader", "css-loader", "sass-loader"],
};

module.exports = { getFormioAliases, getFormioPlugins, sassRule };
