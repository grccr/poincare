var join = require('path').join;
var appPath = join(__dirname, 'src');

module.exports = function setConfig(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // frameworks to use
    frameworks: ['mocha'],

    // list of files / patterns to load in the browser
    files: [
      'test/poincare/test.poincare.js'
    ],

    // list of preprocessors
    preprocessors: {
      'test/**/test.*.js': ['webpack']
    },

    webpack: {
      // devtool: 'cheap-module-source-map',
      resolve: {
        extensions: ['', '.js'],
        root: [appPath],
        modulesDirectories: ['node_modules', 'bower_components']
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
            loader: 'babel-loader'
          },
          {
            test: /\.json$/,
            loader: require.resolve('json-loader')
          },
          {
            test: /\.png$/,
            loader: 'url-loader?mimetype=image/png'
          }
        ]
      },
      node: {
        fs: 'empty',
        __dirname: true
      }
    },

    webpackMiddleware: {
      noInfo: true,
      stats: {
        // With console colors
        colors: true,
        // add the hash of the compilation
        hash: false,
        // add webpack version information
        version: false,
        // add timing information
        timings: false,
        // add assets information
        assets: false,
        // add chunk information
        chunks: false,
        // add built modules information to chunk information
        chunkModules: false,
        // add built modules information
        modules: false,
        // add also information about cached (not built) modules
        cached: false,
        // add information about the reasons why modules are included
        reasons: false,
        // add the source code of modules
        source: false,
        // add details to errors (like resolving log)
        errorDetails: false,
        // add the origins of chunks and chunk merging info
        chunkOrigins: false,
        // Add messages from child loaders
        children: false
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['spec'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,

    client: {
      captureConsole: true
    },

    // enable / disable watching file and executing tests whenever
    // any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed
    // with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed
    // with `npm install karma-ie-launcher`)
    browsers: ['Chrome'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,


    // List plugins explicitly, since autoloading karma-webpack
    // won't work here
    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
      require('karma-phantomjs-launcher')
    ]
  });
};
