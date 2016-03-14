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
    PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
    this._getName = opts.nodeView;
    this._options = opts;
    this._generator = memoize(this._getGenerator.bind(this));
    this._container = memoize(this._getNewContainer.bind(this));
    this._renderer = renderer;
    this._parent = parentContainer;
  }

  create(data) {
    const generatorName = this._getName(data);
    const [id, sprite] = this._generator(generatorName)(data);
    const container = this._container(id);
    container.addChild(sprite);
    return sprite;
  }

  _getGenerator(name) {
    if (name === 'icons')
      return IconSpriteGenerator(this._renderer, this._options[name]);
    throw new PoincareCoreError(`No available views with name "${name}"`);
  }

  _getNewContainer(id) {
    const container = new PIXI.ParticleContainer(3000, {
      scale: true,
      position: true,
      rotation: false,
      alpha: true
    });
    // const container = new PIXI.Container();
    this._parent.addChild(container);
    return container;
  }
}

export default class Core {
  constructor(opts) {
    const { options, dims, container, layout, pn } = opts;

    this._stop = false;
    this._stage = new PIXI.Container();
    this._layout = layout;
    this._dataViews = {
      node: (node) => node,
      link: () => ({})
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

    debug('opts is %o, dims is %o, container is %o', options, dims, container);

    this._pixi = PIXI.autoDetectRenderer(dims[0], dims[1], {
      antialias: options.antialias,
      backgroundColor: options.background,
      transparent: options.transparent
    });

    container.appendChild(this._pixi.view);

    this._bindedRun = this.run.bind(this);

    this._stage = new PIXI.Container();
    this._group = new PIXI.Container();
    // this._group.scale.x = 0.5;
    // this._group.scale.y = 0.5;
    this._stage.addChild(this._group);

    // const graphics = new PIXI.Graphics();
    // group.addChild(graphics);

    this._spriteManager = new SpriteManager(this._group, this._pixi, options);
    this._xScale = d3.scale.linear();
    this._yScale = d3.scale.linear();
  }

  _renderFrame() {
    // Object.keys(this._data.links).forEach(this._renderLink);

    // zoom plugin is here :)

    if (this._pn.zoom && this._pn.zoom.scale() < 1 && !this._zoomedOut) {
      this._zoomedOut = true;
    }
    else if (this._pn.zoom && this._pn.zoom.scale() >= 1 && this._zoomedOut) {
      this._zoomedOut = false;
      this._zoomSwitch = true;
    }
    Object.keys(this._data.nodes).forEach(this._moveNode.bind(this));
    this._zoomSwitch = false;

    this._pixi.render(this._stage);
  }

  run() {
    requestAnimationFrame(this._bindedRun);
    if (!this._stop)
      this._stop = this._layout.step();
    this._renderFrame();
  }

  init(g, layout) {
    this._graph = g;
    this._layout = layout;
    g.forEachNode(this._initNode.bind(this));
    // g.forEachLink(this._initLink);
    return g;
  }

  switchScales() {
    const x = this._xScale;
    const y = this._yScale;
    this._xScale = this._oldxScale || d3.scale.linear();
    this._yScale = this._oldyScale || d3.scale.linear();
    this._oldxScale = x;
    this._oldyScale = y;
  }

  _moveNode(id) {
    const { pos } = this._data.nodes[id];
    const s = this._sprites.nodes[id];
    s.position.x = this._xScale(pos.x);
    s.position.y = this._yScale(pos.y);
    if (this._zoomedOut)
      s.scale.x = s.scale.y = this._pn.zoom.scale();
    else if (!this._zoomedOut && this._zoomSwitch)
      s.scale.x = s.scale.y = 1;
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

  _initNode(node) {
    const data = this._addNodeData(node);
    this._addNodeSprite(node, data);
  }

  stop() {
    this._stop = true;
  }
}
