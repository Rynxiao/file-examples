const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const mode = process.env.NODE_ENV === 'prod' ? 'production' : 'development';

module.exports = {
  mode,
  entry: {
    download: './public/javascripts/modules/download.js',
    upload: './public/javascripts/modules/upload.js',
  },
  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, 'public/dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/transform-runtime'],
          },
        },
      },
      {
        test: /\.tpl$/,
        exclude: /node_modules/,
        use: {
          loader: './public/javascripts/loaders/source-loader.js',
        },
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
};
