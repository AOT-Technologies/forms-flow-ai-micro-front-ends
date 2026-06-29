const path = require("path");
const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");
const webpack = require("webpack");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "formsflow",
    projectName: "nav",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    externals: ['@formsflow/*'],
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      port: 3005
    },
    output:{
      filename:"forms-flow-nav.js"
    },
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            "style-loader",
            // Translates CSS into CommonJS
            "css-loader",
            // Compiles Sass to CSS
            "sass-loader",
          ],
        },
      ],
    },
    resolve: {
      alias: {
        '@formio/core/sdk': path.resolve(__dirname, 'node_modules/@formio/core/lib/sdk/index.js'),
        '@formio/core/process': path.resolve(__dirname, 'node_modules/@formio/core/lib/process/index.js'),
        '@formio/core/experimental': path.resolve(__dirname, 'node_modules/@formio/core/lib/experimental/index.js'),
        '@formio/core': path.resolve(__dirname, 'node_modules/@formio/core'),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        lodashOperators: [
          path.resolve(__dirname, 'node_modules/@aot-technologies/formiojs/lib/cjs/utils/jsonlogic/operators.js'),
          'lodashOperators'
        ]
      })
    ]
  });
};
