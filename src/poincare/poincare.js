// 'use strict';

import EventEmitter from 'eventemitter3';
import nGraph from 'ngraph.graph';
import createForceLayout from 'ngraph.forcelayout';
import d3 from 'd3';
import util from 'util';
import { isFunction, isString } from 'lodash';

import Options from './options';
import Core from './core';

import './poincare.less';

const eventProxyMethods = Symbol();
const pluginsListProp = Symbol();
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
    this.options(opts);
    this._createEmitter();
    this._createContainer();
    this._installModules();
    this._createCore();
    this.updateDimensions();
    this[pluginsListProp] = {};
    this._installPlugins();
  }

  options(opts) {
    if (opts != null) {
      this._options = Options.merge(this._options, opts);
    }
    return this._options;
  }

  run() {
    this.core.run();
    this.emit('run');
  }

  stop() {
    this.core.stopLayout();
  }

  destroy() {
    this._uninstallPlugins();
    this._destroyEmitter();
    this._destroyCore();
    this._destroyLayout();
    this._destroyContainer();
    this._kickGraph();
    this._options = null;
  }

  /* --- Emitter --- */

  _createEmitter() {
    const methods = [
      'on', 'off', 'once', 'emit',
      'addListener', 'removeListener'
    ];
    this._events = new EventEmitter();
    this[eventProxyMethods] = methods;
    for (const m of methods)
      this[m] = this._events[m].bind(this._events);
  }

  _renewEmitter() {
    if (this._events instanceof EventEmitter)
      this._events.removeAllListeners();
  }

  _destroyEmitter() {
    this._renewEmitter();
    for (const m of this[eventProxyMethods])
      this[m] = () => undefined;
    this._events = null;
  }

  /* --- Container  --- */

  _createContainer() {
    this._container = isString(this._options.container)
      ? document.querySelector(this._options.container)
      : this._options.container;

    if (this.container === null)
      throw new PoincareError(`No container '${this._options.container}'` +
                              ' is found');

    d3.select(this.container)
      .classed('poincare-graph', true);
  }

  _destroyContainer() {
    if (!this.container)
      return;
    d3.select(this.container)
      .classed('poincare-graph', false);
    this._container = null;
  }

  get container() {
    return this._container;
  }

  updateDimensions() {
    const bbox = this.container.getBoundingClientRect();
    this._dims = [bbox.width, bbox.height];
    this.emit('dimensions', this._dims);
  }

  get size() {
    return this._dims.slice();
  }

  /* --- Modules --- */

  _installModules(){
    for (const module of this._options._modules) {
      this[module.name] = new module(this, this._options[module.name]);
      debug('${module.name} module is installed');
    }
  }
  
  _destroyModules() {
    for (const module of this._options._modules) {
      const m = this[module.name];
      if (m !== undefined) {
        isFunction(m.destroy) && m.destroy();
        this[module.name] = null;
        debug(`${module.name} module is destroyed`);
      }
    }
  }

  /* --- Core --- */

  _createCore() {
    this._core = new Core({
      options: this._options,
      container: this.container,
      pn: this
    });
  }

  _destroyCore() {
    if (!this.core)
      return;
    this.core.destroy();
    this._core = null;
  }

  get core() {
    return this._core;
  }

  /* --- Plugins --- */

  _installPlugins() {
    const plugins = Array.from(this._options.plugins);
    plugins.sort((a, b) => a.priority - b.priority);
    for (const plugin of plugins) {
      const name = plugin.name.toLowerCase();
      this[pluginsListProp][name] = new plugin(this, this._options[name]);
      debug('Plugin ${name} is installed');
    }
  }

  _uninstallPlugins() {
    const plugins = Array.from(this._options.plugins);
    for (const plugin of plugins) {
      const name = plugin.name.toLowerCase();
      const p = this[pluginsListProp][name];
      if (p !== undefined) {
        isFunction(p.unplug) && p.unplug();
        delete this[pluginsListProp][name];
        debug(`Plugin ${name} is uninstalled`);
      }
    }
  }

  get plugins() {
    return this[pluginsListProp];
  }

  /* --- Layout --- */

  _createLayout() {
    switch (this._options.layout) {
      case 'force':
        this._layout = createForceLayout(this._graph, this._options.physics);
        break;
      default:
        throw new PoincareError('No such layout supported: ' +
                                `${this._options.layout}`);
    }
  }

  _destroyLayout() {
    if (!this.layout)
      return;
    switch (this._options.layout) {
      case 'force':
        this.layout.off();
        this.layout.simulator.off();
        Object.assign(this.layout.simulator, {
          bodies: null, springs: null
        });
        this._layout = null;
        break;
    }
  }

  get layout() {
    return this._layout;
  }

  /* --- Graph --- */

  // original
  __graph__(g) {
    if (g != null) {
      this._graph = g;
      debug('Attempting to display graph [%o, %o]', g.getNodesCount(),
            g.getLinksCount());
      this._createLayout();
      this._core.init(this._graph, this._layout);
    }
    return this._graph;
  }

  graph(g) {
    if (!(g instanceof nGraph)) {
      g = new nGraph();
      debug('Attempting to display empty graph');
    } else {
      debug(
        'Attempting to display graph [%o, %o]',
        g.getNodesCount(),
        g.getLinksCount()
      );
    }

    if (this.graph) {

      // kill 'em all

    }

    this._graph = g;

    // make pretty init

    return this.graph;
  }

  _destroyGraph() {
    this.graph.off();
    this._graph = null;
  }

  get graph() {
    return this._graph;
  }
}
