// import d3 from 'd3';
import PIXI from 'pixi.js';
import { css2pixi } from 'poincare/helpers';
import Plugin from './base';

const pol2dec = (alpha, dist) => {
  return [
    dist * Math.cos(alpha),
    dist * Math.sin(alpha)
  ];
};

export default class Directions extends Plugin {
  constructor(pn, opts) {
    super();

    this._options = Object.assign({
      show: false
    }, opts || {});

    this._pn = pn;
    if (this._options.show) {
      this._pn.on('initcore', this._init, this);
      this._pn.on('frame', this._render, this);
    }
  }

  _init() {
    const makeArrowSprite = this._arrowGenerator();
    const mgr = this._pn.core().spriteManager();
    const container = mgr.createSpriteContainer(3, 'links');
    const core = this._pn.core();
    this._arrows = {};
    core.eachLink((id) => {
      const arrow = this._arrows[id] = makeArrowSprite();
      arrow.anchor.x = 0.5;
      arrow.anchor.y = 0.5;
      container.addChild(arrow);
    });
  }

  _render() {
    const core = this._pn.core();
    const scale = this._pn.zoom.truncatedScale();
    core.eachLink((id) => {
      const link = core.link(id);

      const dy = core.yScale(link.to.y) - core.yScale(link.from.y);
      const dx = core.xScale(link.to.x) - core.xScale(link.from.x);

      const src = [core.xScale(link.from.x), core.yScale(link.from.y)];
      const dst = [core.xScale(link.to.x), core.yScale(link.to.y)];
      const ß = Math.atan2(dy, dx);
      const d = Math.hypot(dx, dy);
      const trg = pol2dec(ß, d - 16 * scale);
      this._arrows[id].rotation = ß + Math.PI / 2;
      this._arrows[id].position.x = trg[0] + src[0];
      this._arrows[id].position.y = trg[1] + src[1];
      this._arrows[id].scale.x = scale;
      this._arrows[id].scale.y = scale;
    });
  }

  // _moveLine(id) {
  //   const link = this._data.links[id];
  //   const dy = this.yScale(link.to.y) - this.yScale(link.from.y);
  //   const dx = this.xScale(link.to.x) - this.xScale(link.from.x);
  //   const angle = Math.atan2(dy, dx);
  //   // const dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  //   const dist = Math.hypot(dx, dy);
  //   const s = this._sprites.links[id];
  //   s.scale.x = dist / DEFAULT_LINE_LENGTH;
  //   s.scale.y = 1.0;
  //   s.rotation = angle;
  //   s.position.x = this.xScale(link.from.x);
  //   s.position.y = this.yScale(link.from.y);
  //   this._pn.emit('moveline', link);
  // }

  _arrowGenerator() {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(css2pixi('#7F7F7F'));
    gfx.drawPolygon([
      3, 0,
      6, 8,
      0, 8,
      3, 0
    ]);
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
