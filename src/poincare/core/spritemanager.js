import { MD5 } from 'jshashes';
import memoize from 'lodash/memoize';
import PIXI from 'pixi.js';
import { css2pixi } from '../helpers';

const debug = require('debug')('poincare:spritemanager');

import { PoincareCoreError } from './core.js';

export const DEFAULT_LINE_LENGTH = 1000;

export const LinkSpriteGenerator = (renderer, options) => {
  return (link) => {
    const gfx = new PIXI.Graphics();
    const spriteColor = css2pixi(options.color(link));
    gfx.lineStyle(1, spriteColor, 1);
    gfx.moveTo(0, 0);
    gfx.lineTo(DEFAULT_LINE_LENGTH, 0);
    const texture = gfx.generateTexture(1, PIXI.SCALE_MODES.DEFAULT);
    
    return new PIXI.Sprite(texture);
  };
};

export const IconSpriteGenerator = (renderer, options) => {
  const md5 = new MD5();

  return (node) => {
    const icon = options.source(node);
    const hash = md5.hex(`${icon}`);
    const sprite = PIXI.Sprite.fromImage(icon);
    sprite.anchor.x = sprite.anchor.y = 0.5;
    return [hash, sprite];
  };
};

export default class SpriteManager {
  constructor(parentContainer, renderer, opts) {
    this._getName = opts.nodeView;
    this._options = opts;
    this._generator = memoize(this._getGenerator.bind(this));
    this._container = memoize(this._getNewContainer.bind(this));
    this._renderer = renderer;
    this._parent = parentContainer;

    this._nodeCount = 5000;
    this._colorLinkCount = {
      '#CCC': 5000
    };
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

  createLink(link) {
    const color = link.data.color || '#CCC';
    const container = this._container('links' + color, this._colorLinkCount[color]);
    const sprite = this._generator('links')(link);
    container.addChild(sprite);
    return sprite;
  }

  setSizes(nodeCount, colorDict) {
    this._nodeCount = nodeCount;
    this._colorLinkCount = colorDict;
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
    const container = new PIXI.ParticleContainer(sz || this._nodeCount * 2, {
      scale: true,
      position: true,
      rotation: true,
      alpha: false
    });
    this._parent.addChild(container);
    return container;
  }
}
