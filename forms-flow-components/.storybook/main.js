const { resolve } = require('path');

module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    });

    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve && config.resolve.alias ? config.resolve.alias : {}),
      },
      extensions: Array.from(new Set([...(config.resolve?.extensions || []), '.ts', '.tsx'])),
    };

    return config;
  },
};


