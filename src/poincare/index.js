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
  Error.captureStackTrace(this, PoincareError);
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
  }

  _initLayout() {
    if (this._options.layout === 'force') {
      this._layout = createForceLayout(this._graph, this._options.physics);
      return;
    }
    throw new PoincareError('No such layout supported: ' +
                            `${this._options._layout}`);

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

  graph(g) {
    if (g != null)
      this._graph = g;
    return this._core.initGraph(this._graph);
  }
}
