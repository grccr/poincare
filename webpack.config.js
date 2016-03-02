
var webpack = require('webpack');
var join = require('path').join;

var appPath = join(__dirname, 'src');
var distPath = join(__dirname, 'dist');

module.exports = {
  devtool: '#source-map',
  context: appPath,
  entry: {
    app: ['babel-polyfill', './index.js']
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
        include: [appPath],
        loader: 'babel-loader'
      },
      {
        test: /\.json$/,
        // include: join(__dirname, 'node_modules', 'ngraph.pixi', 'node_modules', 'pixi.js'),
        // loader: 'json-loader',
        loader: require.resolve('json-loader'),
      }
    ],
  },
  resolve: {
    root: [appPath],
    modulesDirectories: ['node_modules', 'bower_components'],
    fallback: join(__dirname, 'node_modules'),
    alias: {
      // 'ngraph.pixi': NODE_MODULES_DIR, '/ngraph.pixi',
    }
  },
  externals: {
    'two.clean': 'Two'
  },
  node: {
    fs: 'empty',
    __dirname: true,
    fs: 'empty'
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
