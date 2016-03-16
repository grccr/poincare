import PIXI from 'pixi.js';

import { css2pixi } from '../helpers';

const debug = require('debug')('poincare:lighter');

export default class Lighter {
  constructor(pn, opts) {
    this._options = Object.assign({
      color: '#F2EF42',
      radius: 13
    }, opts || {});
    this._pn = pn;
    this._options.color = css2pixi(this._options.color);
    this._gfx = new PIXI.Graphics();
    this._nodeIds = [];
  }

  high(nodeIds) {
    if (nodeIds == null || nodeIds.length < 1)
      return;
    this._nodeIds = nodeIds;
    this._pn._core.groupContainer().addChildAt(this._gfx, 0);
    this._pn.on('frame', this._renderCircles, this);
  }

  _renderCircles() {
    this._gfx.clear();
    this._gfx.beginFill(this._options.color);
    const core = this._pn._core;
    this._nodeIds.forEach(id => {
      const node = core.node(id);
      const x = core.xScale(node.pos.x);
      const y = core.yScale(node.pos.y);
      this._gfx.drawCircle(
        x, y, this._options.radius * this._pn.zoom.truncatedScale()
      );
    });
  }

  off() {
    this._nodeIds = [];
    this._pn.off('frame', this._renderCircles, this);
    this._pn._core.groupContainer().removeChild(this._gfx);
  }
}
