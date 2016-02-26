
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
<<<<<<< HEAD
  babel: {
    cacheDirectory: true,
    presets: ['es2015', 'stage-0'],
    plugins: ['transform-runtime']
=======
  devServer: {
    contentBase: './test',
    historyApiFallback: true,
    hot: true,
    inline: true,
    noInfo: true,
    progress: true
>>>>>>> d687be9444b7656b7490c308d12c5252424e05c2
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
<<<<<<< HEAD
        loader: 'babel'
=======
        loader: 'babel',
        query: {
            optional: 'runtime',
            cacheDirectory: true
        }
      },
      {
        test: /\.json$/,
        include: join(__dirname, 'node_modules', 'ngraph.pixi', 'node_modules', 'pixi.js'),
        loader: 'json',
>>>>>>> d687be9444b7656b7490c308d12c5252424e05c2
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