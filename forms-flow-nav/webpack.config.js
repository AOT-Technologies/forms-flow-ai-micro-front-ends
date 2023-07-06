const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");

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
  });
};
