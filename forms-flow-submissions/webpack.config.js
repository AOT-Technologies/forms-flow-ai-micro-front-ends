const path = require("path");
const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const webpack = require("webpack");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "formsflow",
    projectName: "submissions",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      port: 3012
    },
    output:{
      filename:"forms-flow-submissions.js"
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
    externals: ["@formsflow/*","react","react-dom"],
    resolve: {
      alias: {
        'choices.js': require.resolve('@formio/choices.js'),
        '@aot-technologies/formiojs/lib': path.resolve(__dirname, 'node_modules/@aot-technologies/formiojs/lib'),
        '@aot-technologies/formiojs': path.resolve(__dirname, 'node_modules/@aot-technologies/formiojs/lib'),
        // Force single @formio/core instance. @aot-technologies/formiojs ships a nested
        // @formio/core@2.1.0-dev that only exports BaseEvaluator, but the JS
        // code was compiled expecting DefaultEvaluator from core@2.7.x.
        // Subpath aliases must come before the bare package alias.
        '@formio/core/sdk': path.resolve(__dirname, 'node_modules/@formio/core/lib/sdk/index.js'),
        '@formio/core/process': path.resolve(__dirname, 'node_modules/@formio/core/lib/process/index.js'),
        '@formio/core/experimental': path.resolve(__dirname, 'node_modules/@formio/core/lib/experimental/index.js'),
        '@formio/core': path.resolve(__dirname, 'node_modules/@formio/core'),
      },
    },
    plugins: [
      // @aot-technologies/formiojs uses `lodashOperators` in utils.js without importing it.
      new webpack.ProvidePlugin({
        lodashOperators: [
          path.resolve(__dirname, 'node_modules/@aot-technologies/formiojs/lib/utils/jsonlogic/operators.js'),
          'lodashOperators'
        ]
      })
    ]
  });
};
