var DefinePlugin = require('webpack/lib/DefinePlugin');

var webpack = require('webpack');
var autoprefixer = require('autoprefixer');

var join = require('path').join;
var resolve = require('path').resolve;

var appPath = join(__dirname, 'src');
var distPath = join(__dirname, 'dist');

var ENV = process.env.NODE_ENV || 'development';

console.log('Node ENV is', ENV);

module.exports = {
  context: appPath,
  entry: {
    app: ['babel-polyfill', ENV === 'production' ? './browser.js'
                                                 : './test.js']
  },
  output: {
    path: distPath,
    publicPath: '/dist/',
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
        loader: 'style-loader!css-loader!postcss-loader'
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!postcss-loader!less-loader'
      }
    ],
    postLoaders: [
      {
        include: resolve(__dirname, 'node_modules/pixi.js'),
        loader: 'transform?brfs'
      }
    ]
  },
  postcss: function () {
    return [autoprefixer];
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
    new DefinePlugin({
      'process.env': { NODE_ENV: '"' + ENV + '"' }
    })
  ]
};

if (ENV === 'production') {
  var UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
  var OccurenceOrderPlugin = require('webpack/lib/optimize/OccurenceOrderPlugin');
  module.exports.plugins = module.exports.plugins.concat([
    new UglifyJsPlugin({
      compress: { warnings: false },
      mangle: {
        except: ['Lighter', 'Events', 'Plugin', 'Radius', 'Zoom',
                 'Tween', 'Cursors', 'Labels', 'AutoResize', 'LineIndex']
      }
    }),
    new OccurenceOrderPlugin()
  ]);
} else {
  module.exports.devtool = '#source-map';
}
