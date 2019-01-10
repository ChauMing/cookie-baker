const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/index.jsx',
    background: './src/background.js'
  },
  output: {
    path: path.resolve(__dirname, './app'),
    filename: '[name].js'
  },
  resolve: {
      extensions: ['.js', '.jsx']
  },
  module: {
      rules: [
          {
            test: /\.css$/,
            use: [
              'style-loader',
              'css-loader'
            ]
          },
          {
              test: /\.less$/,
              use: [
                'style-loader',
                'css-loader',
                'less-loader'
              ]
          },
          {
              test: /\.jsx?$/,
              exclude: /node_modules/,
              loader: 'babel-loader'
          }
      ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['popup', 'runtime'],
      template: path.resolve(__dirname, 'src', 'popup.html'),
      filename: 'popup.html'
    })
  ],
  devServer: {
    hot: true,
    contentBase: path.join(__dirname, "app"),
    compress: true,
    port: 10086,
    host: '0.0.0.0'
  }
};
