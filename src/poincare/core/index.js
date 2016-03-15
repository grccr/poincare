import util from 'util';
import { MD5 } from 'jshashes';

import memoize from 'lodash/memoize';
import PIXI from 'pixi.js';
import d3 from 'd3';

const debug = require('debug')('poincare:core');

export function PoincareCoreError(message) {
  this.message = message;
  // Error.captureStackTrace(this, PoincareCoreError);
}
util.inherits(PoincareCoreError, Error);
PoincareCoreError.prototype.name = 'PoincareCoreError';

const DEFAULT_LINE_LENGTH = 1000;

export const LinkSpriteGenerator = (renderer, options) => {
  const gfx = new PIXI.Graphics();
  gfx.lineStyle(1, 0xcccccc, 1);
  gfx.moveTo(0, 0);
  gfx.lineTo(DEFAULT_LINE_LENGTH, 0);
  const texture = gfx.generateTexture(1, PIXI.SCALE_MODES.DEFAULT);

  return (link) => {
    return new PIXI.Sprite(texture);
  };
};

export const IconSpriteGenerator = (renderer, options) => {
  const md5 = new MD5();
  // const c = d3.rgb('red');
  // const matrix = [
  //   1, 0, 0, 0, c.r,
  //   0, 1, 0, 0, c.g,
  //   0, 0, 1, 0, c.b,
  //   0, 0, 0, 1, 0
  // ];
  // const colorMatrix = new PIXI.filters.ColorMatrixFilter();
  // colorMatrix.matrix = matrix;
  // const textures = {};

  // const genTexture = (icon) => {
  //   // const size = options.size(node);
  //   const sprite = PIXI.Sprite.fromImage(icon);
  //   // sprite.filters = [colorMatrix];
  //   sprite.position.x = sprite.position.y = 0;
  //   debug('Original sprite', sprite);
  //   const renderTexture = new PIXI.RenderTexture(renderer, 16, 16);
  //   renderTexture.render(sprite);
  //   return renderTexture;
  // };

  // const getTexture = (hash, icon) => {
  //   if (hash in textures)
  //     return textures[hash];
  //   const txt = genTexture(icon);
  //   debug('Texture generated for hash "%s"', hash, txt);
  //   textures[hash] = txt;
  //   return txt;
  // };

  return (node) => {
    const icon = options.source(node);
    const hash = md5.hex(`${icon}`);
    // const txt = getTexture(hash, icon);
    const sprite = PIXI.Sprite.fromImage(icon);
    sprite.anchor.x = sprite.anchor.y = 0.5;
    // sprite.cacheAsBitmap = true;
    // sprite.tint = 0xFF0000;
    return [hash, sprite];
  };
};

export class SpriteManager {
  constructor(parentContainer, renderer, opts) {
    // PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.LINEAR;
    // PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
    this._getName = opts.nodeView;
    this._options = opts;
    this._generator = memoize(this._getGenerator.bind(this));
    this._container = memoize(this._getNewContainer.bind(this));
    this._renderer = renderer;
    this._parent = parentContainer;

    this._nodeCount = 5000;
    this._linkCount = 5000;

    // Links container must created first
    // Because order of creation is important
    // this._container('links')
  }

  create(data) {
    const generatorName = this._getName(data);
    const [id, sprite] = this._generator(generatorName)(data);
    const container = this._container(id);
    container.addChild(sprite);
    return sprite;
  }

  createLink(data) {
    const container = this._container('links', this._linkCount * 2);
    const sprite = this._generator('links')(data)
    container.addChild(sprite);
    return sprite;
  }

  setSizes(nodeCount, linkCount) {
    this._nodeCount = nodeCount;
    this._linkCount = linkCount;
  }

  _getGenerator(name) {
    if (name === 'icons')
      return IconSpriteGenerator(this._renderer, this._options[name]);
    if (name === 'links')
      return LinkSpriteGenerator(this._renderer, this._options[name]);
    throw new PoincareCoreError(`No available views with name "${name}"`);
  }

  _getNewContainer(id, sz) {
    const container = new PIXI.ParticleContainer(this._nodeCount * 2 || sz, {
      scale: true,
      position: true,
      rotation: true,
      alpha: false
    });
    // const container = new PIXI.Container();
    this._parent.addChild(container);
    return container;
  }
}

export default class Core {
  constructor(opts) {
    const { options, dims, container, layout, pn } = opts;

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

    // debug('opts is %o, dims is %o, container is %o', options, dims, container);

    this._pixi = PIXI.autoDetectRenderer(dims[0], dims[1], {
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
  }

  _renderFrame() {
    // Object.keys(this._data.links).forEach(this._renderLink);

    // zoom plugin is here :)
    this._pn.emit('frame');
    if (this._pn.zoom && this._pn.zoom.scale() < 1 && !this._zoomedOut) {
      this._zoomedOut = true;
    }
    else if (this._pn.zoom && this._pn.zoom.scale() >= 1 && this._zoomedOut) {
      this._zoomedOut = false;
      this._zoomSwitch = true;
    }
    Object.keys(this._data.nodes).forEach(this._moveNode.bind(this));
    Object.keys(this._data.links).forEach(this._moveLine.bind(this));
    this._zoomSwitch = false;

    this._pixi.render(this._stage);
  }

  _run() {
    if (this._stopped)
      return;
    this._frame = requestAnimationFrame(this._bindedRun);
    if (!this._layoutStopped) {
      this._layoutStopped = this._layout.step();
      if (this._layoutStopped)
        this.stopLayout();
    }
    this._renderFrame();
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
    this._pn.emit('movenode', node);
  }

  nodeData(id) {
    return this._data.nodes[id];
  }

  nodeSprite(id) {
    return this._sprites.nodes[id];
  }

  groupContainer() {
    return this._group;
  }

  _moveLine(id) {
    const link = this._data.links[id];
    const dy = this.yScale(link.to.y) - this.yScale(link.from.y);
    const dx = this.xScale(link.to.x) - this.xScale(link.from.x);
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    const s = this._sprites.links[id];
    s.scale.x = dist / DEFAULT_LINE_LENGTH;
    s.scale.y = 1.0;
    s.rotation = angle;
    s.position.x = this.xScale(link.from.x);
    s.position.y = this.yScale(link.from.y);
    this._pn.emit('moveline', link);
  }

  _addNodeSprite(node, data) {
    const sprite = this._spriteManager.create(data);
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
    this._addLinkSprite(link, data)
  }

  stopLayout() {
    this._layoutStopped = true;
    this._pn.emit('layoutstop');
  }
}
