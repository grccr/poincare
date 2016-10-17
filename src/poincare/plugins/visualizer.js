import PIXI from 'pixi.js';
import { setGlobally, Plugin } from './base';
import { css2pixi } from '../helpers';

const DEFAULT_LINE_LENGTH = 1000;

export default class Visualizer extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      show: false
    }, opts || {});

    this._pn = pn;
    this._core = pn.core;
    this._parent = pn.core.stage;
    if (this._options.show) {
      this._pn.on('core:init', this._init, this);
      this._pn.on('view:reset', this._render, this);
      //this._pn.on('link:create', this._onLinkCreate, this);
      //this._pn.on('link:update', this._onLinkCreate, this);
      //this._pn.on('link:remove', this._onLinkRemove, this);
    }
  }

  _init() {
    const graphics = this._graphics = new PIXI.Graphics();
    this._parent.addChild(graphics);
  }

  _render() {
    this._graphics.clear();
    const that = this, core = this._core, graphics = this._graphics;
    core.eachLink((id) => {
      const link = core.link(id);
      const src = [core.xScale(link.from.x), core.yScale(link.from.y)];
      const dst = [core.xScale(link.to.x), core.yScale(link.to.y)];

      graphics.lineStyle(
        that._pn._options.links.width(link), 
        css2pixi(that._pn._options.links.color(link)), 
        1
      );
      graphics.moveTo(src[0], src[1]);
      graphics.lineTo(dst[0], dst[1]);
    });
  }

  _drawLine(src, dst, opts) {
    const gfx = new PIXI.Graphics();
    gfx.lineStyle(opts);
    gfx.moveTo(0, 0);
    gfx.lineTo(DEFAULT_LINE_LENGTH, 0);
    const texture = gfx.generateTexture(1, PIXI.SCALE_MODES.DEFAULT);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.x = sprite.anchor.y = 0.5;
    return sprite;
  }
}

setGlobally(Visualizer);