const path = require('path');

module.exports = {
  mode: 'production',
  entry: './app/index.jsx',
  output: {
    path: path.resolve(__dirname, './app'),
    filename: 'popup.js'
  },
  module: {
      rules: [
          {
              test: /\.less|\.css$/,
              loader: ['css-loader', 'less-loader']
          },
          {
              test: /\.js$|\.jsx$/,
              exclude: /node_modules/,
              loader: 'babel-loader',
              query: {
                  presets: ['es2015', 'react', 'stage-2'],
                  plugins: ['transform-class-properties', 'add-module-exports']
              }
          }
      ]
  },
  resolve: {
      extensions: ['.js', '.jsx']
  },
};
