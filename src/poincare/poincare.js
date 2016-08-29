// 'use strict';

import util from 'util';

import EventEmitter from 'eventemitter3';
// import graphlib from 'graphlib';
import nGraph from 'ngraph.graph';
import createForceLayout from 'ngraph.forcelayout';
import d3 from 'd3';

import Options from './options';
import Core from './core';
// import DagreLayout from './layouts/dagre';

import './poincare.less';

const debug = require('debug')('poincare:anri');


export function PoincareError(message) {
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
    this._initEmitter();
    this._initContainer();
    this._initLayout();
    this._initCore();
    this._installPlugins();
    this.updateDimensions();
    this.emit('init');
  }

  destroy() {
    this.emit('destroy');
    this._uninstallPlugins();
    this._destroyCore();
    this._destroyLayout();
    this._destroyContainer();
    this._destroyEmitter();
    this._destroyGraph();
    this._options = null;
  }

  _initEmitter() {
    this._events = new EventEmitter();
    this.on = this._events.on.bind(this._events);
    this.addListener = this._events.addListener.bind(this._events);
    this.removeListener = this._events.removeListener.bind(this._events);
    this.off = this._events.off.bind(this._events);
    this.once = this._events.once.bind(this._events);
    this.emit = this._events.emit.bind(this._events);
  }

  _destroyEmitter() {
    if (this._events instanceof EventEmitter) {
      this._events.removeAllListeners();
      const methodsToUnset = [
        'on', 'off', 'once', 'emit',
        'addListener', 'removeListener'
      ];
      for (const m of methodsToUnset)
        this[m] = () => undefined;
    }
    this._events = null;
  }

  _initLayout() {
    if (this._options.layout === 'force') {
      this._layout = createForceLayout(this._graph, this._options.physics);
      return;
    }
    throw new PoincareError('No such layout supported: ' +
                            `${this._options.layout}`);
  }

  _destroyLayout() {
    if (!this._layout)
      return;
    switch (this._options.layout) {
      case 'force':
        this._layout.off();
        this._layout.simulator.off();
        Object.assign(this._layout.simulator, {
          bodies: null, springs: null
        });
        break;
    }
  }

  _installPlugins() {
    const plugins = Array.from(this._options.plugins);
    plugins.sort((a, b) => a.priority - b.priority);
    for (const plugin of plugins) {
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

    d3.select(this._container)
      .classed('poincare-graph', true);
  }

  _destroyContainer() {
    this._container = null;
  }

  container() {
    return this._container;
  }

  updateDimensions() {
    const bbox = this._container.getBoundingClientRect();
    this._dims = [bbox.width, bbox.height];
    this.emit('dimensions', this._dims);
  }

  size() {
    return this._dims.slice();
  }

  _initCore() {
    this._core = new Core({
      options: this._options,
      container: this._container,
      dims: this._dims,
      layout: this._layout,
      zoom: this.zoom,
      pn: this
    });
  }

  _destroyCore() {
    this._core = this._core.destroy();
  }

  core() {
    return this._core;
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
    this.emit('run');
  }

  stop() {
    this._core.stopLayout();
  }

  graph(g) {
    if (g != null) {
      this._graph = g;
      debug('Attempting to display graph [%o, %o]', g.getNodesCount(),
            g.getLinksCount());
      this._initLayout();
      this._core.init(this._graph, this._layout);
    }
    return this._graph;
  }

  _destroyGraph() {
    this._graph.off();
    this._graph = null;
  }
}
