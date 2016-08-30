import PIXI from 'pixi.js';
import TWEEN from 'tween.js';

import { css2pixi } from 'poincare/helpers';
import { Transitioner } from './tween.js';
import { setGlobally, Plugin } from './base';

// const debug = require('debug')('poincare:lighter');


export default class Lighter extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      color: '#F2EF42',
      linkColor: '#F1D0F5',
      radius: 13
    }, opts || {});
    this._pn = pn;
    this._options.color = css2pixi(this._options.color);
    this._options.linkColor = css2pixi(this._options.linkColor);
    this._gfx = new PIXI.Graphics();
    this._linkGfx = new PIXI.Graphics();
    this._pn._core.groupContainer().addChildAt(this._gfx, 0);
    this._pn._core.groupContainer().addChildAt(this._linkGfx, 0);
    this._initNodeTransitioner();
    this._initLinkTransitioner();
  }

  _initNodeTransitioner() {
    const zm = this._pn.zoom;

    this._nodetrans = new Transitioner(this._pn)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      // .easing(TWEEN.Easing.Exponential.Out)
      .duration(250, 750)
      .from(() => ({ r: 26, opacity: 0 }))
      .to(() => ({ r: this._options.radius, opacity: 1 }))
      .beforeRendering(() => {
        this._gfx.clear();
      })
      .render((id, prop, X, Y) => {
        const node = this._pn._core.node(id);
        this._gfx.beginFill(this._options.color, prop.opacity);
        this._gfx.drawCircle(
          X(node.pos.x), Y(node.pos.y), prop.r * zm.truncatedScale()
        );
      });
  }

  _initLinkTransitioner() {
    const zm = this._pn.zoom;

    this._linktrans = new Transitioner(this._pn)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      // .easing(TWEEN.Easing.Exponential.Out)
      .duration(250, 750)
      .from(() => ({ opacity: 0, width: 21 }))
      .to(() => ({ opacity: 1, width: 11 }))
      .beforeRendering(() => {
        this._linkGfx.clear();
      })
      .render((id, prop, X, Y) => {
        const ln = this._pn._core.link(id);
        this._linkGfx.lineStyle(
          prop.width * zm.truncatedScale(),
          this._options.linkColor,
          prop.opacity
        );
        this._linkGfx.moveTo(X(ln.from.x), Y(ln.from.y));
        this._linkGfx.lineTo(X(ln.to.x), Y(ln.to.y));
      });
  }

  light(nodeIds) {
    const core = this._pn.core();
    const realIds = nodeIds.filter(id => core.hasNode(id));
    this._nodetrans.transition(realIds);
  }

  lightLink(linkIds) {
    const core = this._pn.core();
    const realIds = linkIds.filter(id => core.hasLink(id));
    this._linktrans.transition(realIds);
  }

  off() {
    this._pn._core.groupContainer().removeChild(this._gfx);
    this._pn._core.groupContainer().removeChild(this._linkGfx);
  }
}

// export default class Lighter extends Plugin {
//   constructor(pn, opts) {
//     super();
//     this._options = Object.assign({
//       color: '#F2EF42',
//       radius: 13
//     }, opts || {});
//     this._pn = pn;
//     this._options.color = css2pixi(this._options.color);
//     this._gfx = new PIXI.Graphics();
//     this._pn._core.groupContainer().addChildAt(this._gfx, 0);
//     this._nodeIds = [];
//   }

//   light(nodeIds) {
//     if (nodeIds == null || nodeIds.length < 1)
//       return;

//     this._pn.off('frame', this._renderCircles, this);
//     // const ids = new Set(nodeIds);
//     // const newIds = = new Set([...this._nodeIds].filter(x => !ids.has(x)));
//     this._nodeIds = nodeIds;
//     const radiuses = this._radiuses = nodeIds.map(n => ({ r: 1 }));
//     const defRadius = this._options.radius;
//     nodeIds.forEach((id, i) => {
//       const tween = new TWEEN.Tween(radiuses[i])
//         .to({ r: defRadius }, 250)
//         .easing(TWEEN.Easing.Sinusoidal.InOut)
//         .start();
//     });
//     // console.log(this._radiuses);
//     this._pn.on('frame', this._renderCircles, this);
//   }

//   _renderCircles() {
//     this._gfx.clear();
//     this._gfx.beginFill(this._options.color);
//     const core = this._pn._core;
//     const zm = this._pn.zoom;
//     const radiuses = this._radiuses;
//     // console.log(this._radiuses);
//     this._nodeIds.forEach((id, i) => {
//       const node = core.node(id);
//       const x = core.xScale(node.pos.x);
//       const y = core.yScale(node.pos.y);
//       this._gfx.drawCircle(
//         x, y, radiuses[i].r * zm.truncatedScale()
//       );
//     });
//   }

//   off() {
//     this._nodeIds = [];
//     this._pn.off('frame', this._renderCircles, this);
//     this._pn._core.groupContainer().removeChild(this._gfx);
//   }
// }

setGlobally(Lighter);
