import util from 'util';
import map from 'lodash/map';
import flatMap from 'lodash/flatMap';
import PIXI from 'pixi.js';
import d3 from 'd3';

import { DEFAULT_LINE_LENGTH } from './spritemanager.js';
import SpriteManager from './spritemanager.js';

const debug = require('debug')('poincare:core');

export function PoincareCoreError(message) {
  this.message = message;
  // Error.captureStackTrace(this, PoincareCoreError);
}
util.inherits(PoincareCoreError, Error);
PoincareCoreError.prototype.name = 'PoincareCoreError';

export default class Core {
  constructor(opts) {
    const { options, container, layout, pn } = opts;

    this._stopped = true;
    this._layoutStopped = false;
    this._stage = new PIXI.Container();
    this._layout = layout;
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

    this._pn = pn;
    // const group = new PIXI.Container();

    // stage.addChild(group);

    // debug(
    //   'opts is %o, dims is %o, container is %o',
    //   options, dims, container
    // );

    this._pixi = PIXI.autoDetectRenderer(200, 200, {
      antialias: options.antialias,
      backgroundColor: options.background,
      transparent: options.transparent
    });

    container.appendChild(this._pixi.view);

    this._bindedRun = this._run.bind(this);

    this._stage = new PIXI.Container();
    this._group = new PIXI.Container();
    // this._group.scale.x = 0.5;
    // this._group.scale.y = 0.5;
    this._stage.addChild(this._group);

    // const graphics = new PIXI.Graphics();
    // group.addChild(graphics);

    this._spriteManager = new SpriteManager(this._group, this._pixi, options);
    this.xScale = d3.scale.linear();
    this.yScale = d3.scale.linear();

    pn.on('dimensions', dims => {
      this._pixi.resize(dims[0], dims[1]);
    });
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
    this._spriteManager.setSizes(g.getNodesCount(), g.getLinksCount());
    g.forEachLink(this._initLink.bind(this));
    g.forEachNode(this._initNode.bind(this));
    this._pn.emit('initcore');
    this._pn.emit('viewreset');
    return g;
  }

  destroy() {
    // this._graph = g;
    // this._layout = layout;
    // this._spriteManager.setSizes(g.getNodesCount(), g.getLinksCount());
    // g.forEachLink(this._initLink.bind(this));
    // g.forEachNode(this._initNode.bind(this));
    // this._pn = null;
    // return null;
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
    this._pn.emit('movenode', node);
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
    // const dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    const dist = Math.hypot(dx, dy);
    const s = this._sprites.links[id];
    s.scale.x = dist / DEFAULT_LINE_LENGTH;
    s.scale.y = 1.0;
    s.rotation = angle;
    s.position.x = this.xScale(link.from.x);
    s.position.y = this.yScale(link.from.y);
    this._pn.emit('moveline', link);
  }

  _attachMouseEvents(sprite, id) {
    sprite.interactive = true;
    sprite._id = id;
    sprite.on('mouseover', data => debug('CLICK!!!!', data));
  }

  _addNodeSprite(node, data) {
    const sprite = this._spriteManager.create(data);
    // this._attachMouseEvents(sprite, node.id);
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
