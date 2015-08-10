
var webpack = require('webpack');
var join = require('path').join;

module.exports = {
  devtool: '#source-map',
  context: join(__dirname, 'src'),
  entry: {
    app: ['webpack/hot/dev-server', './index.js']
  },
  output: {
    path: __dirname + '/dist',
    publicPath: '/assets/',
    filename: 'ashberry.js'
  },
  devServer: {
    contentBase: "./test",
    historyApiFallback: true,
    hot: true,
    inline: true,
    noInfo: true,
    progress: true
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
  externals: {
    'two.clean': 'Two'
  },
  node: {
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