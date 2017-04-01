const webpack = require('webpack')

const config = require('./webpack.base.config')

module.exports = Object.assign({}, config, {
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ]
})
