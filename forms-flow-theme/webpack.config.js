const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/scss/index.scss",
    output: {
      path: path.resolve(__dirname, "dist"),
    },
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      port: 3008,
      watchFiles: {
        paths: ['./src/scss/'],
        options: {
          ignored: ['node_modules/**'] // Example of files to ignore
        }
      }
  
    },
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "sass-loader",
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: isProduction ? "forms-flow-theme.min.css" : "[name].css",
        chunkFilename: isProduction ? "[id].css" : "[id].css",
      }),
    ],
    optimization: {
      minimizer: [
        new CssMinimizerPlugin(),
      ],
    },
    // Exclude source maps in production
    devtool: isProduction ? false : "source-map",
  };
};
