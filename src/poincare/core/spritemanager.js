import { MD5 } from 'jshashes';
import memoize from 'lodash/memoize';
import PIXI from 'pixi.js';
// import d3 from 'd3';

const debug = require('debug')('poincare:spritemanager');

import { PoincareCoreError } from './core.js';

export const DEFAULT_LINE_LENGTH = 1000;

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

export default class SpriteManager {
  constructor(parentContainer, renderer, opts) {
    // PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.LINEAR;
    // PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
    debug('init opts', opts)
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

  destroy() {
    this._parent =
    this._renderer =
    this._container =
    this._generator =
    this._options =
    null;

    return null;
  }

  createNode(data) {
    const generatorName = this._getName(data);
    const [id, sprite] = this._generator(generatorName)(data);
    const container = this._container(id);
    container.addChild(sprite);
    return sprite;
  }

  createLink(data) {
    const container = this._container('links', this._linkCount * 2);
    const sprite = this._generator('links')(data);
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

  createSpriteContainer(pos = 0, sizehint = 'nodes', factor = 1) {
    const sz = sizehint === 'nodes' ?
               this._nodeCount * factor :
               this._linkCount * factor;
    const container = new PIXI.ParticleContainer(sz, {
      scale: true,
      position: true,
      rotation: true,
      alpha: false
    });

    if (pos != null)
      this._parent.addChildAt(container, pos);
    else
      this._parent.addChild(container);

    return container;
  }

  _getNewContainer(id, sz) {
    const container = new PIXI.ParticleContainer(this._nodeCount * 2 || sz, {
      scale: true,
      position: true,
      rotation: true,
      alpha: false
    });
    // container.interactiveChildren = true;
    // const container = new PIXI.Container();
    this._parent.addChild(container);
    return container;
  }
}
