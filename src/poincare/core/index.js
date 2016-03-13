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

export const IconSpriteGenerator = (options) => {
  const md5 = new MD5();
  const c = d3.rgb('red');
  const matrix = [
    1, 0, 0, 0, c.r,
    0, 1, 0, 0, c.g,
    0, 0, 1, 0, c.b,
    0, 0, 0, 1, 0
  ];
  const colorMatrix = new PIXI.filters.ColorMatrixFilter();
  colorMatrix.matrix = matrix;
  return (node) => {
    const icon = options.source(node);
    const size = options.size(node);
    const sprite = PIXI.Sprite.fromImage(icon);
    // sprite.width = sprite.height = size;
    // sprite.mipmap = true;
    sprite.anchor.x = sprite.anchor.y = 0.5;
    sprite.filters = [colorMatrix];
    // sprite.tint = 0xFF0000;
    return [md5.hex(`${icon}${size}`), sprite];
  };
};

export class SpriteManager {
  constructor(parentContainer, opts) {
    // PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.LINEAR;
    PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
    this._getName = opts.nodeView;
    this._options = opts;
    this._generator = memoize(this._getGenerator.bind(this));
    this._container = memoize(this._getNewContainer.bind(this));
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
      return IconSpriteGenerator(this._options[name]);
    throw new PoincareCoreError(`No available views with name "${name}"`);
  }

  _getNewContainer(id) {
    // const container = new PIXI.ParticleContainer(3000, {
    //   scale: false,
    //   position: true,
    //   rotation: false,
    //   alpha: true
    // });
    const container = new PIXI.Container();
    this._parent.addChild(container);
    return container;
  }
}

export default class Core {
  constructor(opts) {
    const { options, dims, container, layout } = opts;

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

    this._spriteManager = new SpriteManager(this._group, options);
    this._xScale = d3.scale.linear();
    this._yScale = d3.scale.linear();
  }

  _renderFrame() {
    // Object.keys(this._data.links).forEach(this._renderLink);
    Object.keys(this._data.nodes).forEach(this._moveNode.bind(this));
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
    this._sprites.nodes[id].position.x = this._xScale(pos.x);
    this._sprites.nodes[id].position.y = this._yScale(pos.y);
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
