const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-ts");

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
    output:{
      filename:"forms-flow-rsbcservice.js"
    },
    module: {
      rules: [
        {
          test: /\.scss$/,  // Match SCSS files
          use: [
            'style-loader',  // Inject CSS into the DOM
            'css-loader',    // Resolves CSS imports
            'sass-loader'    // Compiles SCSS to CSS
          ]
        },
      ]
    }
  });
};
