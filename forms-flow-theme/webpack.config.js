const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./src/main.scss", // Entry point for your SCSS file
  output: {
    // Output directory for the generated CSS file
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    port: 3008
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Extracts CSS into separate files
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ],
  },
  plugins: [
    // Plugin to extract CSS into separate files
    new MiniCssExtractPlugin({
      filename: "forms-flow-theme.min.css", // Output minified CSS filename
    }),
  ],
};
