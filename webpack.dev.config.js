const config = require('./webpack.base.config')

module.exports = Object.assign({}, config, {
  devtool: 'inline-source-map'
})
