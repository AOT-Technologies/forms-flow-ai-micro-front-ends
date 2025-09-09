const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "formsflow",
    projectName: "rsbcservices",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      port: 3011
    },
    output: {
      filename: "forms-flow-rsbcservice.js"
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "src/component/BCMapSelector/*.geojson",
            to: "[name][ext]"
          }
        ]
      })
    ],
    module: {
      rules: [
        {
          test: /\.scss$/,  // Match SCSS files
          use: [
            'style-loader',  // Inject CSS into the DOM
            'css-loader',    // Resolves CSS imports
            'sass-loader'    // Compiles SCSS to CSS
          ]
        }
      ]
    }
  });
};
