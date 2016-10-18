import PIXI from 'pixi.js';
import { setGlobally, Plugin } from './base';
import { css2pixi, pol2dec } from '../helpers';

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
      this._pn.once('layout:ready', this._firstRender, this);
      this._pn.on('view:start', this._clear, this);
      //this._pn.on('link:create', this._onLinkCreate, this);
      //this._pn.on('link:update', this._onLinkCreate, this);
      //this._pn.on('link:remove', this._onLinkRemove, this);
    }
  }

  _init() {
    const graphics = this._graphics = new PIXI.Graphics();
    this._parent.addChild(graphics);
  }

  _clear() {
    this._graphics.clear();
  }

  _firstRender() {
    this._render();
    this._pn.on('view:reset', this._render, this);
  }

  _render() {
    const bbox = this._pn.zoom.bbox();
    const links = this._pn.lineindex._getLinksByBbox({
      minX: bbox.x,
      minY: bbox.y,
      maxX: bbox.x + bbox.w,
      maxY: bbox.y + bbox.h
    });
    const that = this, 
      core = this._core,
      offset = this._pn._options.nodes.radius;
    _.each(links, (l) => {
      const link = core.link(l.id);
      const src = [core.xScale(link.from.x), core.yScale(link.from.y)];
      const dst = [core.xScale(link.to.x), core.yScale(link.to.y)];
      const dy = dst[1] - src[1];
      const dx = dst[0] - src[0];

      const d = Math.hypot(dx, dy);
      let beta = Math.atan2(dy, dx);
      let trg = pol2dec(beta, d - offset);

      let beta2 = Math.atan2(-dy, -dx);
      let trg2 = pol2dec(beta2, d - offset);

      this._drawLine({
        src: _.zipWith(src, trg, _.add),
        dst: _.zipWith(dst, trg2, _.add),
        w: that._pn._options.links.width(link), 
        c: css2pixi(that._pn._options.links.color(link)), 
        a: 0.3
      });
    });
  }

  _drawLine(opts) {
    const graphics = this._graphics;
    graphics.lineStyle(opts.w, opts.c, opts.a);
    graphics.moveTo(opts.src[0], opts.src[1]);
    graphics.lineTo(opts.dst[0], opts.dst[1]);
  }
}

setGlobally(Visualizer);