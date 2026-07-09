const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const webpack = require("webpack");
const { getFormioAliases, getFormioPlugins } = require("../webpack.formio");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "formsflow",
    projectName: "components",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" },
      port: 3010,
    },
    output: { filename: "forms-flow-components.js" },
    externals: ["@formsflow/*", "react", "react-dom"],
    resolve: {
      alias: {
        "react/jsx-runtime": require.resolve("react/jsx-runtime"),
        ...getFormioAliases(__dirname),
      },
      extensions: [".tsx", ".ts", ".js", ".jsx"],
    },
    plugins: getFormioPlugins(webpack, __dirname),
  });
};
