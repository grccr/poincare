// 'use strict';

import util from 'util';

import graphlib from 'graphlib';
import nGraph from 'ngraph.graph';
import createForceLayout from 'ngraph.forcelayout';
import d3 from 'd3';

import Options from './options';
import Core from './core';
// import DagreLayout from './layouts/dagre';

const debug = require('debug')('poincare:anri');


function PoincareError(message) {
  this.message = message;
  // Error.captureStackTrace(this, PoincareError);
}
util.inherits(PoincareError, Error);
PoincareError.prototype.name = 'PoincareError';

export default class Poincare {
  constructor(opts = {}) {
    this._options = Options.defaults;
    this._graph = new nGraph();
    this.options(opts);
    this._initContainer();
    this.updateDimensions();
    this._initLayout();
    this._initCore();
    this._installPlugins();
  }

  _initLayout() {
    if (this._options.layout === 'force') {
      this._layout = createForceLayout(this._graph, this._options.physics);
      return;
    }
    throw new PoincareError('No such layout supported: ' +
                            `${this._options.layout}`);

  }

  _installPlugins() {
    for (let plugin of this._options.plugins) {
      const nm = plugin.name.toLowerCase();
      this[nm] = new plugin(this, this._options[nm]);
      debug('Plugin "%s" installed', nm);
    }
  }

  _uninstallPlugins() {

  }

  _initContainer() {
    this._container = typeof this._options.container === 'string' ?
      document.querySelector(this._options.container) :
      this._options.container;

    if (this._container == null)
      throw new PoincareError(`No container '${this._options.container}'` +
                              ' is found');
  }

  updateDimensions() {
    const bbox = this._container.getBoundingClientRect();
    this._dims = [bbox.width, bbox.height];
  }

  size() {
    return this._dims.slice();
  }

  _initCore() {
    this._core = new Core({
      options: this._options,
      container: this._container,
      dims: this._dims,
      layout: this._layout
    });
  }

  options(opts) {
    if (opts != null) {
      this._options = Options.merge(this._options, opts);
    }
    return this._options;
  }

  layout() {
    return this._layout;
  }

  run() {
    this._core.run();
  }

  stop() {
    this._core.stop();
  }

  graph(g) {
    if (g != null)
      this._graph = g;
    this._initLayout();
    this._core.init(this._graph, this._layout);
    return this._graph;
  }
}
