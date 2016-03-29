import PIXI from 'pixi.js';
import TWEEN from 'tween.js';

import { css2pixi } from '../helpers';
import Plugin from './base';

const debug = require('debug')('poincare:lighter');

export default class Lighter extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      color: '#F2EF42',
      radius: 13
    }, opts || {});
    this._pn = pn;
    this._options.color = css2pixi(this._options.color);
    this._gfx = new PIXI.Graphics();
    this._pn._core.groupContainer().addChildAt(this._gfx, 0);
    this._nodeIds = [];
  }

  light(nodeIds) {
    if (nodeIds == null || nodeIds.length < 1)
      return;

    this._pn.off('frame', this._renderCircles, this);
    // const ids = new Set(nodeIds);
    // const newIds = = new Set([...this._nodeIds].filter(x => !ids.has(x)));
    this._nodeIds = nodeIds;
    const radiuses = this._radiuses = nodeIds.map(n => ({ r: 1 }));
    const defRadius = this._options.radius;
    nodeIds.forEach((id, i) => {
      const tween = new TWEEN.Tween(radiuses[i])
        .to({ r: defRadius }, 250)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start();
    });
    // console.log(this._radiuses);
    this._pn.on('frame', this._renderCircles, this);
  }

  _renderCircles() {
    this._gfx.clear();
    this._gfx.beginFill(this._options.color);
    const core = this._pn._core;
    const zm = this._pn.zoom;
    const radiuses = this._radiuses;
    // console.log(this._radiuses);
    this._nodeIds.forEach((id, i) => {
      const node = core.node(id);
      const x = core.xScale(node.pos.x);
      const y = core.yScale(node.pos.y);
      this._gfx.drawCircle(
        x, y, radiuses[i].r * zm.truncatedScale()
      );
    });
  }

  off() {
    this._nodeIds = [];
    this._pn.off('frame', this._renderCircles, this);
    this._pn._core.groupContainer().removeChild(this._gfx);
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Lighter = Lighter;
}
