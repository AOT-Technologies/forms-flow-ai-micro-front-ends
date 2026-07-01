const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");
const webpack = require("webpack");
const { getFormioAliases, getFormioPlugins, sassRule } = require("../webpack.formio");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "formsflow",
    projectName: "nav",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    externals: ["@formsflow/*"],
    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" },
      port: 3005,
    },
    output: { filename: "forms-flow-nav.js" },
    module: { rules: [sassRule] },
    resolve: { alias: getFormioAliases(__dirname) },
    plugins: getFormioPlugins(webpack, __dirname),
  });
};
