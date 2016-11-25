import d3 from 'd3';
import PIXI from 'pixi.js';
import { setGlobally, Plugin } from './base';
import { css2pixi, pol2dec, fieldGetter } from '../helpers';

const DEFAULT_LINE_LENGTH = 1000;

export default class LinkClassifier extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      show: false,
      alpha: 0.3, 
      colors: 'category20',
      colorGetter: null,
      width: 1,
      widthGetter: null,
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

  get options() { return this._options; } 

  update(pn, opts) {
    Object.assign(this._options, opts || {});
    this._applyOptions();
  }

  _applyOptions() {
    // field getters
    if (typeof this._options.colorGetter === 'string') {
      this._options.colorGetter = fieldGetter(this._options.colorGetter);
    } else if (typeof this._options.colorGetter !== 'function') {
      this._options.colorGetter = this._pn._options.links.color;
    }
    if (typeof this._options.widthGetter === 'string') {
      this._options.widthGetter = fieldGetter(this._options.widthGetter);
    } else if (typeof this._options.widthGetter !== 'function') {
      this._options.widthGetter = this._pn._options.links.width;
    }
    // scale
    this._color = d3.scale.ordinal();
    this._width = d3.scale.ordinal();
    // domains
    let colordomain = [], 
        widthdomain = [];
    this._core.eachLink((id) => {
      const data = this._core.link(id).data;
      const c = this._options.colorGetter(data),
            w = this._options.widthGetter(data);
      colordomain.indexOf(c) == -1 && colordomain.push(c);
      widthdomain.indexOf(w) == -1 && widthdomain.push(w);
    });
    if (typeof colordomain[0] === 'number') {
      this._color.domain(colordomain.sort((a,b) => a - b));
    } else {
      this._color.domain(colordomain.sort());
    }
    if (typeof widthdomain[0] === 'number') {
      this._width.domain(widthdomain.sort((a,b) => a - b));
    } else {
      this._width.domain(widthdomain.sort());
    }
    // ranges
    if (typeof this._options.colors === 'string') {
      if( this._options.colors[0] === '#') {
        this._color.range([this._options.colors]);
      } else {
        this._color.range(d3.scale[this._options.colors]().range());
      }
    } else if (_.isArray(this._options.colors)) {
      if (this._options.colors.length === 2) {
        const interp = d3.interpolate(this._options.colors[0], this._options.colors[1]);
        const len = this._color.domain().length - 1;
        let range = [];
        for(let i = 0; i < (len + 1); range.push(interp(i / len)), i++);
        this._color.range(range);
      }
      else {
        this._color.range(this._options.colors);
      }
    } else {
      console.log("LinkClassifier: colors - Invalid argument");
    }
    if (typeof this._options.width === 'number') {
      this._width.range([this._options.width]);
    } else if (_.isArray(this._options.width)) {
      if (this._options.width.length === 2) {
        // const len = this._color.domain().length;
        this._width.rangePoints(this._options.width);
      } else {
        this._width.range(this._options.width);
      }
    } else {
      console.log("LinkClassifier: width - Invalid argument");
    }
  }

  color(id) {
    return this._color(this._options.colorGetter(this._core.link(id).data));
  }

  width(id) {
    return this._width(this._options.widthGetter(this._core.link(id).data));
  }

  _init() {
    const graphics = this._graphics = new PIXI.Graphics();
    this._parent.addChild(graphics);

    this._applyOptions();
  }

  _clear() {
    this._graphics && this._graphics.clear();
  }

  _clearAndRender() {
    this._clear();
    this._render();
  }

  _firstRender() {
    this._render();
    this._pn.on('view:reset', this._render, this);
    this._pn.on('link:create', this._onLinkCreate, this);
    this._pn.on('link:update', this._onLinkCreate, this);
    this._pn.on('link:remove', this._clearAndRender, this);
    this._pn.on('node:movestart', this._clear, this);
    this._pn.on('node:movestop', this._render, this);
  }

  _onLinkCreate(link) {
    const c = this._options.colorGetter(link.data),
          w = this._options.widthGetter(link.data);
    this._color(c);
    this._width(w);
    let colordomain = this._color.domain(),
        widthdomain = this._width.domain();
    if (typeof colordomain[0] === 'number') {
      this._color.domain(colordomain.sort((a,b) => a - b));
    } else {
      this._color.domain(colordomain.sort());
    }
    if (typeof widthdomain[0] === 'number') {
      this._width.domain(widthdomain.sort((a,b) => a - b));
    } else {
      this._width.domain(widthdomain.sort());
    }
    this._clearAndRender();
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
      offset = this._pn.zoom.truncatedScale() * this._pn._options.nodes.radius;
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
        w: this._pn.zoom.truncatedScale() * this.width(l.id), 
        c: css2pixi(this.color(l.id)), 
        a: this._options.alpha
      });

      if(that._options.arrows) {

      }
    });
  }

  _drawLine(opts) {
    const graphics = this._graphics;
    graphics.lineStyle(opts.w, opts.c, opts.a);
    graphics.moveTo(opts.src[0], opts.src[1]);
    graphics.lineTo(opts.dst[0], opts.dst[1]);
  }
}

setGlobally(LinkClassifier);