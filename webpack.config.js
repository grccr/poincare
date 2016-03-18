
var webpack = require('webpack');
var join = require('path').join;
var resolve = require('path').resolve;

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
        loader: require.resolve('json-loader')
      },
      {
        test: /\.png$/,
        loader: 'url-loader?mimetype=image/png'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader'
      }
    ],
    postLoaders: [
      {
        include: resolve(__dirname, 'node_modules/pixi.js'),
        loader: 'transform?brfs'
      }
    ]
  },
  resolve: {
    root: [appPath],
    modulesDirectories: ['node_modules', 'bower_components']
  },
  node: {
    // fs: 'empty',
    __dirname: true
  },
  plugins: [
  ]
};
