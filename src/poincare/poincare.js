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
    this._createCore();
    this._installModules();
    //this._installAPI();
    this.updateDimensions();
  }

  options(opts) {
    if (opts !== null) {
      this._options = Options.merge(this._options, opts);
    }
    return this._options;
  }

  stop() {
    this.core.stopLayout();
  }

  destroy() {
    this._uninstallPlugins();
    this._destroyEmitter();
    this._destroyCore();
    this._uninstallModules();
    this._destroyLayout();
    this._destroyGraph();
    this._destroyContainer();
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
    this._container = isString(this._options.container) ?
      document.querySelector(this._options.container) :
      this._options.container;

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
    this.emit('view:size', this._dims);
  }

  get size() {
    return this._dims.slice();
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

  /* --- Modules --- */

  _installModules() {
    for (const module of this._options._modules) {
      const name = module.name.toLowerCase();
      this[name] = new module(this, this._options[name]);
      debug(`${module.name} module is installed`);
    }
  }

  _destroyModules() {
    for (const module of this._options._modules) {
      const name = module.name.toLowerCase();
      const m = this[name];
      if (m !== undefined) {
        isFunction(m.destroy) && m.destroy();
        this[name] = null;
        debug(`${module.name} module is destroyed`);
      }
    }
  }

  /* --- Plugins --- */

  _installPlugins() {
    const plugins = Array.from(this._options.plugins);
    plugins.sort((a, b) => a.priority - b.priority);
    this[pluginsListProp] = {};
    for (const plugin of plugins) {
      const name = plugin.name.toLowerCase();
      this[pluginsListProp][name] = new plugin(this, this._options[name]);
      debug(`${plugin.name} plugin is installed`);
    }
  }

  _uninstallPlugins() {
    const plugins = Array.from(this._options.plugins);
    for (const plugin of plugins) {
      const name = plugin.name.toLowerCase();
      const p = this[pluginsListProp][name];
      if (p !== undefined) {
        isFunction(p.unplug) && p.unplug();
        this[pluginsListProp][name] = null;
        debug(`${plugin.name} plugin is uninstalled`);
      }
    }
    this[pluginsListProp] = {};
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
  // __graph__(g) {
  //   if (g != null) {
  //     this._graph = g;
  //     debug('Attempting to display graph [%o, %o]', g.getNodesCount(),
  //           g.getLinksCount());
  //     this._createLayout();
  //     this._core.init(this._graph, this._layout);
  //   }
  //   return this._graph;
  // }

  get graph() {
    return this._graph;
  }

  set graph(g) {
    if (undefined === g || null === g) {
      g = new nGraph();
      debug('Attempting to empty graph');
    } else {
      debug(
        'Attempting to display graph [%o, %o]',
        g.getNodesCount(),
        g.getLinksCount()
      );
    }

    if (this.graph) {
      this._uninstallPlugins();
      this.core.clear();
      this._destroyLayout();
      this._destroyGraph();
    }

    this._installPlugins();
    this._graph = g;
    this._createLayout();
    this.core.init(this.graph, this.layout);
    this.updateDimensions();
    this.core.run();

    return this.graph;
  }

  _destroyGraph() {
    this.graph.off();
    this.graph.clear();
    this._graph = null;
  }

  createNode(id, data){
    const node = this.graph.addNode(id, data || {});
    this.core._createNode(node);
    this.emit('node:create', node);
    return node;
  }

  updateNode(id, data){
    const node = this.graph.addNode(id, data || {});
    this.core._updateNodeData(id, data);
    this.emit('node:update', node);
    return node;
  }

  removeNode(id){
    this.emit('node:remove', id);
    this.graph.removeNode(id);
    return this.core._removeNode(id);
  }

  createLink(from, to, data){
    let link = this.graph.addLink(from, to, data || {});
    link = this.core._createLink(link);
    this.emit('link:create', link);
    return link;
  }

  updateLink(id, data){
    const link = this.core._updateLink(id, data);
    this.emit('link:update', link);
    return link;
  }

  removeLink(id){
    const link = _.cloneDeep(this.core.link(id));
    this.graph.removeLink(link.formId, link.toId);
    this.core._removeLink(id);
    this.emit('link:remove', link);
  }

  test(){
    let a = this.createNode('a', {label:'a'});
    let b = this.createNode('b', {label:'b'});
    let l = this.createLink('a', 'b', {label:'ab'});
    l = this.updateLink(l.id, {label:'asdf', color:'#FF0000'});
    this.removeLink(l.id);
  }
}
