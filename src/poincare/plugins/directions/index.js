// import d3 from 'd3';
import PIXI from 'pixi.js';
import { setGlobally, Plugin } from '../base';
import { css2pixi, pol2dec, fieldGetter } from '../../helpers';
import arrowPolygonGenerator from './arrows';

const PI_OVER_2 = Math.PI / 2;

export default class Directions extends Plugin {
  constructor(pn, opts) {
    super();

    this._options = Object.assign({
      show: false,
      getter: 'dual',
      style: 'horizontal',
      size: [6, 8]
    }, opts || {});

    if (typeof this._options.getter !== 'function')
      this._options.getter = fieldGetter(this._options.getter);

    this._pn = pn;
    if (this._options.show) {
      this._pn.on('core:init', this._init, this);
      this._pn.on('frame', this._render, this);
    }

    this.OFFSET_FACTOR = 12;
  }

  _init() {
    const makeArrowSprite = this._arrowGenerator();
    const mgr = this._pn.core.spriteManager();
    const container = mgr.createSpriteContainer(3, 'links', 2);
    const core = this._pn.core;
    this._arrows = {};
    core.eachLink((id) => {
      this._arrows[id] = {};
      let arrow = this._arrows[id].normal = makeArrowSprite();
      arrow.anchor.x = 0.5;
      arrow.anchor.y = 0.5;
      container.addChild(arrow);
      if (this._options.getter(core.link(id).data)) {
        arrow = this._arrows[id].reverse = makeArrowSprite();
        arrow.anchor.x = 0.5;
        arrow.anchor.y = 0.5;
        container.addChild(arrow);
      }
    });
  }

  _render() {
    const core = this._pn.core;
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

      if (arrow.reverse) {
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
    gfx.drawPolygon(arrowPolygonGenerator(
      this._options.style,
      this._options.size[0],
      this._options.size[1]
    ));
    gfx.endFill();
    const texture = gfx.generateTexture(1, PIXI.SCALE_MODES.DEFAULT);

    return () => {
      return new PIXI.Sprite(texture);
    };
  }
}

setGlobally(Directions);
