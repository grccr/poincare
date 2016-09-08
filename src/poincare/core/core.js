
import map from 'lodash/map';
import each from 'lodash/each';
import flatMap from 'lodash/flatMap';
import PIXI from 'pixi.js';
import d3 from 'd3';
import util from 'util';
import random from 'lodash/random';

import { DEFAULT_LINE_LENGTH } from './spritemanager.js';
import SpriteManager from './spritemanager.js';

const debug = require('debug')('poincare:core');

export function PoincareCoreError(message) {
  this.message = message;
  // Error.captureStackTrace(this, PoincareCoreError);
}
util.inherits(PoincareCoreError, Error);
PoincareCoreError.prototype.name = 'PoincareCoreError';

const pol2dec = (alpha, dist) => {
  return [
    dist * Math.cos(alpha),
    dist * Math.sin(alpha)
  ];
};

export default class Core {
  constructor({ pn, container, options }) {
    this._container = container;
    this._pn = pn;

    this._stopped = true;
    this._layoutStopped = false;

    this._dataViews = {
      node: (node) => node,
      link: (link) => link
    };
    this._data = {
      nodes: {},
      links: {}
    };
    this._sprites = {
      nodes: {},
      links: {}
    };

    this._pixi = PIXI.autoDetectRenderer(200, 200, {
      antialias: options.antialias,
      backgroundColor: options.background,
      transparent: options.transparent
    });

    this._container.appendChild(this._pixi.view);

    this._bindedRun = this._run.bind(this);

    this._stage = new PIXI.Container();
    this._group = new PIXI.Container();
    this._stage.addChild(this._group);
    this._spriteManager = new SpriteManager(this._group, this._pixi, options);
    
    this.xScale = d3.scale.linear();
    this.yScale = d3.scale.linear();

    pn.on('dimensions', this._renderResize, this);
  }

  clear(){
    this.stop();
    this._pn.removeListener('dimensions', this._renderResize, this);

    each(this._data.nodes, (node, id) => {
      node.links = null;
      this._data.nodes[id] = null;
      this._sprites.nodes[id].texture.destroy();
    });

    each(this._data.links, (link, id) => {
      this._sprites.links[id].texture.destroy();
      this._data.links[id] = null;
    });
  }

  destroy() {
    this.clear();

    if (this._spriteManager)
      this._spriteManager.destroy();
    if (this._stage)
      this._stage.destroy(true);
    if (this._pixi)
      this._pixi.destroy(true);

    this._spriteManager =
    this._sprites =
    this._stage =
    this._pixi =
    this._dataViews =
    this._data =
    this._graph =
    this._layout =
    this._container =
    this._pn =
      null;

    return null;
  }

  _renderFrame(t) {
    // Object.keys(this._data.links).forEach(this._renderLink);

    // zoom plugin is here :)
    this._pn.emit('frame', t);
    if (this._pn.zoom && this._pn.zoom.scale() < 1 && !this._zoomedOut) {
      this._zoomedOut = true;
    } else if (this._pn.zoom && this._pn.zoom.scale() >= 1 && this._zoomedOut) {
      this._zoomedOut = false;
      this._zoomSwitch = true;
    }
    Object.keys(this._data.nodes).forEach(this._moveNode.bind(this));
    Object.keys(this._data.links).forEach(this._moveLine.bind(this));
    this._zoomSwitch = false;

    this._pixi.render(this._stage);
  }

  _renderResize(dims) {
    this._pixi.resize(dims[0], dims[1]);
  }

  _run(t) {
    if (this._stopped)
      return;
    this._frame = requestAnimationFrame(this._bindedRun);
    if (!this._layoutStopped) {
      this._layoutStopped = this._layout.step();
      if (this._layoutStopped)
        this.stopLayout();
    }
    this._renderFrame(t);
  }

  run(layout = false) {
    this._stopped = false;
    if (layout)
      this._layoutStopped = true;
    this._run();
  }

  stop() {
    this._stopped = true;
    if (this._frame)
      cancelAnimationFrame(this._frame);
  }

  init(g, layout) {
    this._graph = g;
    this._layout = layout;
    const colordict = {};
    g.forEachLink(link => {
      const clr = link.data.color || '#CCC';
      colordict[clr] = (colordict[clr] || 0) + 1;
    });
    this._spriteManager.setSizes(g.getNodesCount(), colordict);
    g.forEachLink(this._initLink.bind(this));
    g.forEachNode(this._initNode.bind(this));
    this._pn.emit('core:init');
    this._pn.emit('viewreset');
    return g;
  }

  switchScales() {
    const x = this.xScale;
    const y = this.yScale;
    this.xScale = this._oldxScale || d3.scale.linear();
    this.yScale = this._oldyScale || d3.scale.linear();
    this._oldxScale = x;
    this._oldyScale = y;
  }

  _moveNode(id) {
    const node = this._data.nodes[id];
    const s = this._sprites.nodes[id];
    s.position.x = this.xScale(node.pos.x);
    s.position.y = this.yScale(node.pos.y);
    if (this._zoomedOut)
      s.scale.x = s.scale.y = this._pn.zoom.scale();
    else if (!this._zoomedOut && this._zoomSwitch)
      s.scale.x = s.scale.y = 1;
    this._pn.emit('node:move', node);
  }

  selectNodes(ids) {
    return ids.map(id => this._data.nodes[id]);
  }

  selectLinks(ids) {
    return ids.map(id => this._data.links[id]);
  }

  mapNodes(fn, flat = false) {
    return !flat ? map(this._data.nodes, fn) :
                   flatMap(this._data.nodes, fn);
  }

  mapLinks(fn, flat = false) {
    return !flat ? map(this._data.links, fn) :
                   flatMap(this._data.links, fn);
  }

  eachNode(fn) {
    return Object.keys(this._data.nodes).forEach(fn);
  }

  eachLink(fn) {
    return Object.keys(this._data.links).forEach(fn);
  }

  node(id) {
    return this._data.nodes[id];
  }

  hasNode(id) {
    return id in this._data.nodes;
  }

  hasLink(id) {
    return id in this._data.links;
  }

  link(id) {
    return this._data.links[id];
  }

  nodeSprite(id) {
    return this._sprites.nodes[id];
  }

  groupContainer() {
    return this._group;
  }

  spriteManager() {
    return this._spriteManager;
  }

  _moveLine(id) {
    const link = this._data.links[id];
    const dy = this.yScale(link.to.y) - this.yScale(link.from.y);
    const dx = this.xScale(link.to.x) - this.xScale(link.from.x);
    const angle = Math.atan2(dy, dx);
    const angle2 = Math.atan2(-dy, -dx);
    const dist = Math.hypot(dx, dy);
    const trg = pol2dec(angle, dist - this._pn._options.nodes.radius);
    const s = this._sprites.links[id];
    s.scale.x = (dist - (link.data.dual ? 2 : 1) * this._pn._options.nodes.radius) / DEFAULT_LINE_LENGTH;
    s.scale.y = 1.0;
    s.rotation = angle2;
    s.position.x = trg[0] + this.xScale(link.from.x);
    s.position.y = trg[1] + this.yScale(link.from.y);
    this._pn.emit('link:move', link);
  }

  _addNodeSprite(node, data) {
    const sprite = this._spriteManager.createNode(data);
    this._sprites.nodes[node.id] = sprite;
  }

  _addNodeData(node) {
    const data = this._dataViews.node(node);
    data.pos = this._layout.getNodePosition(node.id);
    this._data.nodes[node.id] = data;
    return data;
  }

  _addLinkSprite(link, data) {
    const sprite = this._spriteManager.createLink(data);
    this._sprites.links[`${link.id}`] = sprite;
  }

  _addLinkData(link) {
    const data = this._dataViews.link(link);
    data.from = this._layout.getNodePosition(link.fromId);
    data.to = this._layout.getNodePosition(link.toId);
    this._data.links[`${link.id}`] = data;
    return data;
  }

  _initNode(node) {
    const data = this._addNodeData(node);
    this._addNodeSprite(node, data);
  }

  _initLink(link) {
    const data = this._addLinkData(link);
    this._addLinkSprite(link, data);
  }

  stopLayout() {
    this._layoutStopped = true;
    this._pn.emit('layoutstop');
  }
}
