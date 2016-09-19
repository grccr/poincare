
import PIXI from 'pixi.js';
import d3 from 'd3';
import util from 'util';
import SpriteManager from './spritemanager.js';

import { each, map, flatMap } from 'lodash';
import { pol2dec, css2pixi } from '../helpers';
import { DEFAULT_LINE_LENGTH } from './spritemanager.js';


// const debug = require('debug')('poincare:core');

export function PoincareCoreError(message) {
  this.message = message;
  // Error.captureStackTrace(this, PoincareCoreError);
}
util.inherits(PoincareCoreError, Error);
PoincareCoreError.prototype.name = 'PoincareCoreError';

export default class Core {
  constructor({ pn, container, options }) {
    this._pn = pn;
    this._container = container;

    this._freezed = true;
    this._layoutStopped = false;
    this._frame = null;

    this._getDataFrom = {
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

    this._stage = new PIXI.Container();
    this._spriteManager = new SpriteManager(this._stage, this._pixi, options);

    for (const m of ['_run', '_renderNode', '_renderLine'])
      this[m] = this[m].bind(this);

    this.xScale = d3.scale.linear();
    this.yScale = d3.scale.linear();

    pn.on('view:size', this._renderResize, this);
  }

  clear() {
    this._pn.emit('core:clear');

    this.stop();
    this._pn.removeListener('view:size', this._renderResize, this);

    each(this._data.nodes, (node, id) => {
      node.links = null;
      this._data.nodes[id] = null;
      this._sprites.nodes[id].texture.destroy(true);
    });

    each(this._data.links, (link, id) => {
      this._sprites.links[id].texture.destroy(true);
      this._data.links[id] = null;
    });
  }

  destroy() {
    this.clear();

    this._pn.emit('core:destroy');

    if (this.spriteManager)
      this.spriteManager.destroy();
    if (this.stage)
      this.stage.destroy(true);
    if (this._pixi)
      this._pixi.destroy(true);

    this._spriteManager =
    this._sprites =
    this._pixi =
    this._getDataFrom =
    this._data =
    this._graph =
    this._layout =
    this._container =
    this._pn =
      null;

    return null;
  }

  get spriteManager() {
    return this._spriteManager;
  }

  get stage() {
    return this._stage;
  }

  /* --- Init & Start --- */

  init(g, layout) {
    this._graph = g;
    this._layout = layout;
    const coloredLinksCount = {};
    g.forEachLink(link => {
      const linkColor = css2pixi(this._pn._options.links.color(link));
      coloredLinksCount[linkColor] = (coloredLinksCount[linkColor] || 0) + 1;
    });
    this.spriteManager.setSizes(g.getNodesCount(), coloredLinksCount);
    g.forEachLink(this._createLink.bind(this));
    g.forEachNode(this._createNode.bind(this));
    this._pn.emit('core:init');
    this._pn.emit('view:reset');
    return g;
  }

  _run(t) {
    if (this._freezed)
      return;
    this._frame = requestAnimationFrame(this._run);
    if (!this._layoutStopped) {
      this._layoutStopped = this._layout.step();
      if (this._layoutStopped)
        this.stopLayout();
    }
    this._renderFrame(t);
  }

  run(noLayoutProcessing = false) {
    this._freezed = false;
    if (noLayoutProcessing)
      this._layoutStopped = true;
    this._run();
    this._pn.emit('core:run');
  }

  stop() {
    this._freezed = true;
    if (this._frame)
      cancelAnimationFrame(this._frame);
  }

  stopLayout() {
    this._layoutStopped = true;
    this._pn.emit('layout:ready');
  }

  /* --- Render --- */

  _renderFrame(t) {
    this._pn.emit('view:frame', t);
    if (this._pn.zoom.scale() < 1 && !this._zoomedOut) {
      this._zoomedOut = true;
    } else if (this._pn.zoom.scale() >= 1 && this._zoomedOut) {
      this._zoomedOut = false;
      this._zoomSwitch = true;
    }
    Object.keys(this._data.nodes).forEach(this._renderNode);
    Object.keys(this._data.links).forEach(this._renderLine);
    this._zoomSwitch = false;

    this._pixi.render(this.stage);
  }

  _renderResize(dims) {
    this._pixi.resize(dims[0], dims[1]);
  }

  _renderNode(id) {
    const node = this.node(id);
    const sprite = this.nodeSprite(id);
    sprite.position.x = this.xScale(node.pos.x);
    sprite.position.y = this.yScale(node.pos.y);
    if (this._zoomedOut)
      sprite.scale.x = sprite.scale.y = this._pn.zoom.scale();
    else if (!this._zoomedOut && this._zoomSwitch)
      sprite.scale.x = sprite.scale.y = 1;
    this._pn.emit('node:render', node);
  }

  _renderLine(id) {
    const link = this.link(id);
    const src = [this.xScale(link.from.x), this.yScale(link.from.y)];
    const dst = [this.xScale(link.to.x), this.yScale(link.to.y)];
    const dy = dst[1] - src[1];
    const dx = dst[0] - src[0];
    const angle = Math.atan2(dy, dx);
    const d = Math.hypot(dx, dy);
    const sprite = this.linkSprite(id);
    const r = this._pn._options.nodes.radius;
    sprite.scale.x = (d - 2 * r) / DEFAULT_LINE_LENGTH;
    sprite.scale.y = 1.0;
    sprite.rotation = angle;
    sprite.position.x = (dst[0] + src[0]) / 2;
    sprite.position.y = (dst[1] + src[1]) / 2;
    this._pn.emit('link:render', link);
  }

  /* --- Nodes --- */

  _createNode(node) {
    const data = this._getDataFrom.node(node);
    data.pos = this._layout.getNodePosition(node.id);
    this._data.nodes[`${node.id}`] = data;
    this._addNodeSprite(node, data);
  }

  _updateNodeData(id, data) {
    if(!this.hasNode(id)) return;
    Object.assign(this.node(id).data, data);
    this._pn.emit('update:node', this.node(id));
    return this._data.nodes[id];
  }

  _addNodeSprite(node, data) {
    const sprite = this.spriteManager.createNode(data);
    this._sprites.nodes[node.id] = sprite;
  }

  node(id) {
    return this._data.nodes[id];
  }

  hasNode(id) {
    return id in this._data.nodes;
  }

  nodeSprite(id) {
    return this._sprites.nodes[id];
  }

  selectNodes(ids) {
    return ids.map(id => this._data.nodes[id]);
  }

  eachNode(fn) {
    return Object.keys(this._data.nodes).forEach(fn);
  }

  mapNodes(fn, flat = false) {
    return (flat ? flatMap : map)(this._data.nodes, fn);
  }

  /* --- Links --- */

  _createLink(link) {
    const data = this._getDataFrom.link(link);
    Object.assign(data, {
      from: this._layout.getNodePosition(link.fromId),
      to: this._layout.getNodePosition(link.toId)
    });
    this._data.links[`${link.id}`] = data;
    this._addLinkSprite(link, data);
  }

  _updateLinkData(id, data) {
    if(!this.hasLink(id)) return;
    Object.assign(this.link(id).data, data);
    this._pn.emit('update:link', this.link(id));
    return this._data.links[id];
  }

  _addLinkSprite(link, data) {
    const sprite = this.spriteManager.createLink(data);
    this._sprites.links[`${link.id}`] = sprite;
  }

  link(id) {
    return this._data.links[id];
  }

  hasLink(id) {
    return id in this._data.links;
  }

  linkSprite(id) {
    return this._sprites.links[id];
  }

  selectLinks(ids) {
    return ids.map(id => this._data.links[id]);d
  }

  eachLink(fn) {
    return Object.keys(this._data.links).forEach(fn);
  }

  mapLinks(fn, flat = false) {
    return (flat ? flatMap : map)(this._data.links, fn);
  }

}
