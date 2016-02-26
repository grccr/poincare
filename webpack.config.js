
var webpack = require('webpack');
var join = require('path').join;

var appPath = join(__dirname, 'src');
var distPath = join(__dirname, 'dist');

module.exports = {
  devtool: '#source-map',
  context: appPath,
  entry: {
    app: ['./index.js']
  },
  output: {
    path: distPath,
    publicPath: '/assets/',
    filename: 'poincare.js'
  },
  babel: {
    cacheDirectory: true,
    presets: ['es2015', 'stage-0'],
    plugins: ['transform-runtime']
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      }
    ],
  },
  resolve: {
    root: [appPath],
    modulesDirectories: ['node_modules', 'bower_components'],
  },
  externals: {
    'two.clean': 'Two'
  },
  node: {
    fs: 'empty',
    __dirname: true,
  },
  plugins: [
    new webpack.DefinePlugin({ 'global.GENTLY': false }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      _: 'lodash',
      'Backbone.Events': 'backbone-events-standalone'
    })
  ]
};