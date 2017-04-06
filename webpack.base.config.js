const path = require('path')

module.exports = {
  entry: ["babel-polyfill", "./src/index.js"],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'),
    library: 'twinql',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      }
    ]
  },
  externals: {
    child_process: 'child_process',
    fs: 'fs'
  }
}
