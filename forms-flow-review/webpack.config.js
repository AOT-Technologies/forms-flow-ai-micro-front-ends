const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const webpack = require("webpack");
const { getFormioAliases, getFormioPlugins, sassRule } = require("../webpack.formio");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "formsflow",
    projectName: "review",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" },
      port: 3011,
    },
    output: { filename: "forms-flow-review.js" },
    module: { rules: [sassRule] },
    externals: ["@formsflow/*", "react", "react-dom"],
    resolve: { alias: getFormioAliases(__dirname) },
    plugins: getFormioPlugins(webpack, __dirname),
  });
};
