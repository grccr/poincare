// import d3 from 'd3';
import PIXI from 'pixi.js';
import Plugin from './base';
import { css2pixi } from 'poincare/helpers';
import { fieldGetter } from '../helpers';

const PI_OVER_2 = Math.PI / 2;
const ARROW_TYPES = {
  ACUTE:      0, 
  EXPANDED:   1,
  HORIZONTAL: 2,  // default
  TAPERED:    3
};

const pol2dec = (alpha, dist) => {
  return [
    dist * Math.cos(alpha),
    dist * Math.sin(alpha)
  ];
};

const arrowPolygonGenerator = (t, w, h) => {
  let coords = [];
  let a = w / 2, b = 0, c = 0, d = 0;
  switch(t){
    case ARROW_TYPES.ACUTE:
      b = h / 3 * 2;
      coords = [
        a, 0,
        w, h,
        a, b,
        0, h,
        a, 0
      ];
      break;
    case ARROW_TYPES.EXPANDED:
      b = h * 3 / 4, c = a * 3 / 2, d = c - a;
      coords = [
        a, 0,
        w, b,
        c, b,
        c, h,
        d, h,
        d, b,
        0, b,
        a, 0
      ];
      break;
    case ARROW_TYPES.HORIZONTAL:
      coords = [
        a, 0,
        w, h,
        0, h,
        a, 0
      ];
      break;
    case ARROW_TYPES.TAPERED:
      b = h / 3 * 2, c = a * 3 / 2, d = c - a;
      coords = [
        a, 0,
        w, b,
        c, h,
        d, h,
        0, b,
        a, 0
      ];
      break;
    default:
      coords = [
        a, 0,
        w, h,
        0, h,
        a, 0
      ];
      break;
  }
  return coords;
}

export default class Directions extends Plugin {
  constructor(pn, opts) {
    super();

    this._options = Object.assign({
      show: false,
      getter: 'dual',
      arrow: {
        type: ARROW_TYPES.HORIZONTAL,
        size: { w: 6, h: 8}
      }
    }, opts || {});

    if (typeof this._options.getter !== 'function')
      this._options.getter = fieldGetter(this._options.getter);

    this._pn = pn;
    if (this._options.show) {
      this._pn.on('initcore', this._init, this);
      this._pn.on('frame', this._render, this);
    }

    this.OFFSET_FACTOR = 12; 
  }

  _init() {
    const makeArrowSprite = this._arrowGenerator();
    const mgr = this._pn.core().spriteManager();
    const container = mgr.createSpriteContainer(3, 'links', 2);
    const core = this._pn.core();
    this._arrows = {};
    core.eachLink((id) => {
      this._arrows[id] = {};
      let arrow = this._arrows[id].normal = makeArrowSprite();
      arrow.anchor.x = 0.5;
      arrow.anchor.y = 0.5;
      container.addChild(arrow);
      if(this._options.getter(core.link(id).data)){
        arrow = this._arrows[id].reverse = makeArrowSprite();
        arrow.anchor.x = 0.5;
        arrow.anchor.y = 0.5;
        container.addChild(arrow);
      } 
    });
  }

  _render() {
    const core = this._pn.core();
    const scale = this._pn.zoom.truncatedScale();
    const offset = this.OFFSET_FACTOR * scale;
    core.eachLink((id) => {
      const link = core.link(id);

      const arrow = this._arrows[id];
      const normal = arrow.normal;
      
      const src = [core.xScale(link.from.x), core.yScale(link.from.y)];
      const dst = [core.xScale(link.to.x), core.yScale(link.to.y)];

      const dy = dst[1] - src[1];
      const dx = dst[0] - src[0];

      const d = Math.hypot(dx, dy);
      let beta = Math.atan2(dy, dx);
      let trg = pol2dec(beta, d - offset);
      normal.rotation = beta + PI_OVER_2;
      normal.position.x = trg[0] + src[0];
      normal.position.y = trg[1] + src[1];
      normal.scale.x = scale;
      normal.scale.y = scale;

      if(arrow.reverse){
        const reverse = this._arrows[id].reverse;
        beta = Math.atan2(-dy, -dx);
        trg = pol2dec(beta, d - offset);
        reverse.rotation = beta + PI_OVER_2;
        reverse.position.x = trg[0] + dst[0];
        reverse.position.y = trg[1] + dst[1];
        reverse.scale.x = scale;
        reverse.scale.y = scale;
      } 
    });
  }

  _arrowGenerator() {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(css2pixi('#7F7F7F'));
    const a = this._options.arrow;
    gfx.drawPolygon(arrowPolygonGenerator(a.type, a.size.w, a.size.h));
    gfx.endFill();
    const texture = gfx.generateTexture(1, PIXI.SCALE_MODES.DEFAULT);

    return () => {
      return new PIXI.Sprite(texture);
    };
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Directions = Directions;
}
