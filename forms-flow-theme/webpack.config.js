// webpack.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './scss/index.scss',
        output: {
            path: path.resolve(__dirname, 'dist'),
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                      MiniCssExtractPlugin.loader,                        
                      'css-loader',
                      'sass-loader',
                    ],
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: isProduction ? 'forms-flow-theme.min.css' : 'forms-flow-theme.css',
            }),
        ],
        devServer: {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          port: 3008,
          watchFiles: {
            options: {
              ignored: ['node_modules/**'] // Example of files to ignore
            }
          }
      
        },
    };
};