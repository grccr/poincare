// import PIXI from 'pixi.js';
import rbush from 'rbush';
import knn from 'rbush-knn';
import range from 'lodash/range';
// import { css2pixi } from '../helpers';
import Plugin from './base';

const debug = require('debug')('poincare:radius');

function dist(pos1, pos2) {
  return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y);
}

export default class Radius extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      linkIndexFrequency: 30
    }, opts || {});
    this._pn = pn;
    this._tree = null;
    this._lastRadius = 0;

    pn.on('layoutstop', () => {
      this._createIndex();
      this._calculateRadiusMedian();
    }, this);
    pn.on('viewreset', this._calculateRadiusMedian, this);
  }

  _createIndex() {
    debug('Will create node index');
    const tree = this._tree = rbush(9, ['.x', '.y', '.x', '.y']);
    const data = this._pn._core.mapNodes(node => ({ id: node.id, ...node.pos }));
    tree.load(data);
    debug('Index created', data);
  }

  getNodesByBbox(bbox) {
    return this._tree.search([bbox.x,
                              bbox.y,
                              bbox.x + bbox.w,
                              bbox.y + bbox.h])
      // .filter(n => n.type === 'n')
      .map(n => n.id);
  }

  _calculateRadiusMedian() {
    if (this._tree == null)
      return;
    const bbox = this._pn.zoom.bbox();
    const scale = this._pn.zoom.scale();
    debug('current viewport is', bbox);
    const nodes = this.getNodesByBbox(bbox);
    debug('found these nodes in current viewport', nodes);
    const r = this._radiusFor(nodes);
    this._lastRadius = r;
    this._pn.emit('visiblenodes', nodes, r * scale);
    // if (nodes.length < 30)
    //   this._pn.lighter.high(nodes);
  }

  lastRadiusForScale(sc) {
    return this._lastRadius * sc;
  }

  nearest(pos, radius = 30) {
    if (this._tree == null)
      return null;
    const [nearest] = knn(this._tree, pos, 1);
    if (nearest) {
      // if (nearest.type == 'n')
      //   debug('NEAREST POINT', nearest.id, this._pn._core.node(nearest.id));
      // else
      //   debug('NEAREST LINE', nearest.id);
      // let distance;
      // if (nearest.type === 'n') {
        // simple distance
        const distance = Math.hypot(nearest.x - pos[0], nearest.y - pos[1]);
      // } else {
      //   // distance from point to vector
      //   const ln = this._pn._core.link(nearest.id);
      //   // const v = [ln.to.x - ln.from.x, ln.to.y - ln.from.y];
      //   // const k = v[0] / v[1];
      //   // distance = Math.abs(k * pos[0] - pos[1]) / Math.sqrt(1 + Math.pow(k, 2));
      //   //
      //   const sqr = (n) => Math.pow(n, 2);
      //   const d = (x0, y0, x1, y1, x, y) =>
      //     Math.abs((y0 - y1) * x + (x1 - x0) * y + (x0 * y1 - x1 * y0)) /
      //     Math.sqrt(sqr(x1 - x0) + sqr(y1 - y0));
      //   distance = d(ln.from.x, ln.from.y,
      //                ln.to.x, ln.to.y,
      //                pos[0], pos[1]);
      //   debug('line distance', distance, ln);
      // }
      if (distance <= radius) {
        // debug('nearest', nearest.id);
        return nearest.id;
      }
    }
    return null;
  }

  _radiusFor(ids) {
    let sum = 0;
    ids.forEach(id => {
      const { pos } = this._pn._core.node(id);
      const [neighbor1, neighbor2] = knn(this._tree, [pos.x, pos.y], 2);
      // debug('neighbor for %o', node.id, neighbor2);
      // debug('radius for %o', node.id, dist(pos, neighbor2));
      sum += dist(pos, neighbor2);
    });
    return sum / ids.length;
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Radius = Radius;
}
