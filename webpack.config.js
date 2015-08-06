
var webpack = require('webpack');
var join = require('path').join;

module.exports = {
  context: join(__dirname, 'src'),
  entry: './index.js',
  output: {
    path: __dirname + '/dist',
    publicPath: '/assets/',
    filename: 'ashberry.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
            optional: 'runtime',
            cacheDirectory: true
        }
      }
    ],
  },
  resolve: {
    modulesDirectories: ['node_modules', 'bower_components'],
  },
  plugins: [
    new webpack.ProvidePlugin({
      _: 'lodash',
      'Backbone.Events': 'backbone-events-standalone'
    })
  ]
};