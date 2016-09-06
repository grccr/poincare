import rbush from 'rbush';
// import knn from 'rbush-knn';
// import PIXI from 'pixi.js';
import minBy from 'lodash/minBy';

import Module from './base';

const debug = require('debug')('poincare:lineindex');
const sqr = (n) => Math.pow(n, 2);
const dist = (x0, y0, x1, y1, x, y) =>
    Math.abs((y0 - y1) * x + (x1 - x0) * y + (x0 * y1 - x1 * y0)) /
    Math.sqrt(sqr(x1 - x0) + sqr(y1 - y0));

function makeNormalBBox(x0, y0, x1, y1) {
  return [
    Math.min(x0, x1),
    Math.min(y0, y1),
    Math.max(x0, x1),
    Math.max(y0, y1)
  ];
}

function makeNormalLineBBox(ln) {
  return makeNormalBBox(ln.from.x, ln.from.y, ln.to.x, ln.to.y);
}


// export function calcLinePoints(link, n = 30) {
//   const v1 = [link.from.x, link.from.y];
//   const v = [link.to.x - link.from.x,
//              link.to.y - link.from.y];
//   const d = Math.hypot(v[0], v[1]);
//   const k = parseInt(d / n, 10);
//   if (k <= 1)
//     return [v.map((vi, j) => v1[j] + vi / 2)];
//   const m = d % n;
//   const points =
//     (m === 0 ?
//       range(1, k - 1) :
//       range(1, k))
//         .map(i => v.map((vi, j) => v1[j] + vi * (i / k)));
//   return points;
// }

export default class LineIndex extends Module {
  constructor(pn, opts) {
    super();
    this._pn = pn;
    pn.on('layoutstop', this._createLinkIndex, this);

    this._bbox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  }

  _createLinkIndex() {
    // this._gfx = new PIXI.Graphics();
    // this._pn._core.groupContainer().addChildAt(this._gfx, 0);
    // this._pn.on('frame', this._renderSquares, this);


    const tree = this._tree = rbush(9, ['.x0', '.y0', '.x1', '.y1']);
    debug('Will create link index');
    // const data = this._pn._core.mapLinks(link =>
    //   calcLinePoints(link)
    //     .map(pt => ({ id: link.id,
    //                   type: 'l',
    //                   x: pt[0],
    //                   y: pt[1] }))
    // , true);
    const data = this._pn._core.mapLinks(ln => {
      const bbox = makeNormalLineBBox(ln);
      return {
        id: ln.id,
        x0: bbox[0],
        y0: bbox[1],
        x1: bbox[2],
        y1: bbox[3]
      };
    });
    tree.load(data);
    this._rects = tree.all();
    this._rects.push(this._bbox);
    debug('Link index created', tree.all());
  }

  _renderSquares() {
    this._gfx.clear();
    this._gfx.lineStyle(1, 0x000000);

    const core = this._pn._core;
    const mr = Math.round;
    // const zm = this._pn.zoom;
    // const _rects = ;
    // console.log(this._radiuses);
    this._rects.forEach(r => {
      const x0 = mr(core.xScale(r.x0));
      const y0 = mr(core.yScale(r.y0));
      const x1 = mr(core.xScale(r.x1));
      const y1 = mr(core.yScale(r.y1));

      this._gfx.drawRoundedRect(x0, y0, x1 - x0, y1 - y0, 5);
    });
  }

  _pickNearest(lines, pt) {
    return minBy(
      lines.map(ln => ({
        d: dist(ln.from.x, ln.from.y,
                ln.to.x, ln.to.y,
                pt[0], pt[1]),
        ...ln
      })),
      ln => ln.d
    );
  }

  nearest(pos, radius = 30) {
    if (this._tree == null)
      return null;
    const bbox = [
      pos[0] - radius, pos[1] - radius,
      pos[0] + radius, pos[1] + radius
    ];
    this._bbox.x0 = bbox[0];
    this._bbox.y0 = bbox[1];
    this._bbox.x1 = bbox[2];
    this._bbox.y1 = bbox[3];
    // const [nearest] = knn(this._tree, pos, 1);
    // debug('bbox', bbox);
    const found = this._tree.search(bbox);
    if (found.length < 1)
      return null;
    const links = this._pn._core.selectLinks(found.map(f => f.id));
    const nearest = this._pickNearest(links, pos);
    if (nearest.d <= radius) {
      return nearest.id;
    }
    // debug('nearest is', `${nearest.fromId}-${nearest.toId} [${nearest.d}]`);
    // if (nearest) {
    //   const ln = this._pn._core.link(nearest.id);
    //   const distance = dist(ln.from.x, ln.from.y,
    //                         ln.to.x, ln.to.y,
    //                         pos[0], pos[1]);
    //   debug('line distance', distance, ln);
    //   // }
    //   if (distance <= radius) {
    //     return nearest.id;
    //   }
    // }
    return null;
  }
}
