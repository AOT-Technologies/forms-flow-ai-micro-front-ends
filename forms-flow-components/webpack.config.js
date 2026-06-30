const path = require("path");
const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const webpack = require("webpack");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "formsflow",
    projectName: "components",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      port: 3010
    },
    output:{
      filename:"forms-flow-components.js"
    },  
    externals: ["@formsflow/*", "react", "react-dom"],
    resolve: {

      alias: {
        // Fix MUI / React 17 JSX runtime
        "react/jsx-runtime": require.resolve("react/jsx-runtime"),
        'choices.js': require.resolve('@formio/choices.js'),
        // @aot-technologies/formiojs v2.0.0 ships CJS files at lib/ (not lib/cjs/).
        // The package exports field incorrectly references lib/cjs/index.js.
        // More-specific /lib alias must come before the bare package alias.
        '@aot-technologies/formiojs/lib': path.resolve(__dirname, 'node_modules/@aot-technologies/formiojs/lib'),
        '@aot-technologies/formiojs': path.resolve(__dirname, 'node_modules/@aot-technologies/formiojs/lib'),
        // Force single @formio/core instance. @aot-technologies/formiojs ships a nested
        // @formio/core@2.1.0-dev that only exports BaseEvaluator, but the JS
        // code was compiled expecting DefaultEvaluator from core@2.7.x.
        // Aliasing to the top-level 2.7.x makes the extends work.
        // Subpath aliases are required because webpack bypasses the package
        // "exports" field when the parent is a directory alias.
        // Subpath aliases must come before the bare package alias.
        // Without them, webpack replaces '@formio/core' first and resolves
        // '@formio/core/sdk' as '<dir>/sdk' (no exports-field lookup).
        '@formio/core/sdk': path.resolve(__dirname, 'node_modules/@formio/core/lib/sdk/index.js'),
        '@formio/core/process': path.resolve(__dirname, 'node_modules/@formio/core/lib/process/index.js'),
        '@formio/core/experimental': path.resolve(__dirname, 'node_modules/@formio/core/lib/experimental/index.js'),
        '@formio/core': path.resolve(__dirname, 'node_modules/@formio/core'),
      },

      extensions: [".tsx", ".ts", ".js", ".jsx"],
    },
    plugins: [
      // @aot-technologies/formiojs uses `lodashOperators` in utils.js without importing it —
      // a missing import in the custom build. ProvidePlugin auto-injects it.
      new webpack.ProvidePlugin({
        lodashOperators: [
          path.resolve(__dirname, 'node_modules/@aot-technologies/formiojs/lib/utils/jsonlogic/operators.js'),
          'lodashOperators'
        ]
      })
    ]
  });
};
