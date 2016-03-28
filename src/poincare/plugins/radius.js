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

export function calcLinePoints(link, n = 30) {
  const v1 = [link.from.x, link.from.y];
  const v = [link.to.x - link.from.x,
             link.to.y - link.from.y];
  const d = Math.hypot(v[0], v[1]);
  const k = parseInt(d / n, 10);
  if (k <= 1)
    return [v.map((vi, j) => v1[j] + vi / 2)];
  const m = d % n;
  const points =
    (m === 0 ?
      range(1, k - 1) :
      range(1, k))
        .map(i => v.map((vi, j) => v1[j] + vi * (i / k)));
  return points;
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
      this._createLinkIndex();
      this._calculateRadiusMedian();
    }, this);
    pn.on('viewreset', this._calculateRadiusMedian, this);
  }

  _createLinkIndex() {
    debug('Will create link index');
    const data = this._pn._core.mapLinks(link =>
      calcLinePoints(link)
        .map(pt => ({ id: link.id,
                      type: 'l',
                      x: pt[0],
                      y: pt[1] }))
    , true);
    this._tree.load(data);
    debug('Link index created', data);
  }

  _createIndex() {
    debug('Will create node index');
    const tree = this._tree = rbush(9, ['.x', '.y', '.x', '.y']);
    const data = this._pn._core.mapNodes(node => ({ id: node.id,
                                                 type: 'n',
                                                 ...node.pos }));
    tree.load(data);
    debug('Index created', data);
  }

  _pickNodes(bbox) {
    return this._tree.search([bbox.x,
                              bbox.y,
                              bbox.x + bbox.w,
                              bbox.y + bbox.h])
      .filter(n => n.type === 'n')
      .map(n => n.id);
  }

  _calculateRadiusMedian() {
    if (this._tree == null)
      return;
    const bbox = this._pn.zoom.bbox();
    const scale = this._pn.zoom.scale();
    debug('current viewport is', bbox);
    const nodes = this._pickNodes(bbox);
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

      if (nearest.type == 'n')
        debug('NEAREST POINT', nearest);
      else
        debug('NEAREST LINE', nearest);
      let distance;
      if (nearest.type === 'n') {
        // simple distance
        distance = Math.hypot(nearest.x - pos[0], nearest.y - pos[1]);
      } else {
        // distance from point to vector
        const ln = this._pn._core.link(nearest.id);
        const v = [ln.to.x - ln.from.x, ln.to.y - ln.from.y];
        distance = Math.abs(v[0] / v[1] * pos[0] - pos[1]) / Math.sqrt(1 + Math.pow(v[0] / v[1], 2));
      }
      if (distance <= radius) {
        return nearest;
      }
    }
    return null;
  }

  _radiusFor(ids) {
    let sum = 0;
    ids.forEach(id => {
      const { pos } = this._pn._core.node(id);
      const [neighbor1, neighbor2] = knn(this._tree, [pos.x, pos.y], 2,
        item => item.type === 'n');
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
