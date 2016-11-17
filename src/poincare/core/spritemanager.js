import { MD5 } from 'jshashes';
import memoize from 'lodash/memoize';
import PIXI from 'pixi.js';
import { css2pixi } from '../helpers';

// const debug = require('debug')('poincare:spritemanager');

import { PoincareCoreError } from './core.js';

export const DEFAULT_LINE_LENGTH = 1000;

export const LinkSpriteGenerator = (renderer, options) => {
  return (link) => {
    const gfx = new PIXI.Graphics();
    gfx.lineStyle(0.5, '#CCC', 0.3);
    gfx.moveTo(0, 0);
    gfx.lineTo(DEFAULT_LINE_LENGTH, 0);
    const texture = gfx.generateTexture(1, PIXI.SCALE_MODES.DEFAULT);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.x = sprite.anchor.y = 0.5;
    return sprite;
  };
};

export const IconSpriteGenerator = (renderer, options) => {
  const md5 = new MD5();

  return (node) => {
    const icon = options.source(node);
    const size = options.size(node);
    const hash = md5.hex(`${icon}`);
    const sprite = PIXI.Sprite.fromImage(icon);
    
    sprite.anchor.x = sprite.anchor.y = 0.5; 
    sprite.texture.baseTexture.on('loaded', () => {
      const f = sprite.texture.frame;
      const h = f.height;
      const w = f.width;

      if (h <= size && w <= size)
        return;

      if (h > w) {
        f.height = size;
        f.width = size * w / h;
      } else {
        f.width = size;
        f.height = size * h / w;
      }
    });

    return [hash, sprite];
  };
};

export default class SpriteManager {
  constructor(core, opts) {
    this._options = opts;
    this._getName = opts.nodes.view;
    this._generator = memoize(this._getGenerator.bind(this));
    this._container = memoize(this._getNewContainer.bind(this));
    this._core = core;
    this._renderer = core._pixi;
    this._parent = core._stage;

    this._nodeCount = 5000;
    this._colorLinkCount = {};
  }

  clear() {
    for (const child of this._parent.children) {
      child.destroy();
    }
    this._parent.removeChildren();
    this._generator.cache.clear();
    this._container.cache.clear();
  }

  destroy() {
    this._parent =
    this._renderer =
    this._container =
    this._generator =
    this._options =
      null;
  }

  createNode(data) {
    const generatorName = this._getName(data);
    const [id, sprite] = this._generator(generatorName)(data);
    const container = this._container(id);
    container.addChild(sprite);
    return sprite;
  }

  removeNode(id){
    const md5 = new MD5();
    const node = this._core.node(id);
    const icon = this._options['icons'].source(node);
    const hash = md5.hex(`${icon}`);
    this._container(hash).removeChild(this._core._sprites.nodes[id]);
  }

  createLink(link) {
    const sprite = this._generator('links')(link);
    const container = this._container(`links`);
    container.addChild(sprite);
    return sprite;
  }

  removeLink(id) {
    this._container('links').removeChild(this._core._sprites.links[id]);
  }

  setSizes(nodeCount, colorDict) {
    this._nodeCount = nodeCount;
    this._colorLinkCount = colorDict;
  }

  _getGenerator(name) {
    let Generator = null;

    switch (name) {
      case 'icons':
        Generator = IconSpriteGenerator;
        break;
      
      case 'links':
        Generator = LinkSpriteGenerator;
        break;
    }

    if (Generator)
      return Generator(this._renderer, this._options[name]);
    
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
    //const container = new PIXI.ParticleContainer(sz || this._nodeCount * 2, {
    const container = new PIXI.ParticleContainer(15000, {
      scale: true,
      position: true,
      rotation: true,
      alpha: false
    });
    container.poincareID = id;
    this._parent.addChild(container);
    return container;
  }
}
