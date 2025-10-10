const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-ts");

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
        "react/jsx-runtime": require.resolve("react/jsx-runtime.js"),
      },
      extensions: [".tsx", ".ts", ".js", ".jsx"],
    }
  });
};
