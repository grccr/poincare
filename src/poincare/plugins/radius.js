// import PIXI from 'pixi.js';
import rbush from 'rbush';
import knn from 'rbush-knn';
// import { css2pixi } from '../helpers';

const debug = require('debug')('poincare:radius');

export default class Radius {
  constructor(pn, opts) {
    this._options = Object.assign({
    }, opts || {});
    this._pn = pn;
    this._tree = null;

    pn.on('layoutstop', () => {
      this._createIndex();
      this._calculateRadiusMedian();
    }, this);
    pn.on('viewreset', this._calculateRadiusMedian, this);
  }

  _createIndex() {
    debug('Will create node index');
    const tree = this._tree = rbush(9, ['.x', '.y', '.x', '.y']);
    tree.load(this._pn._core.mapNodes(node => ({ id: node.id, ...node.pos })));
    debug('Index created');
  }

  _pickNodes(bbox) {
    return this._tree.search([bbox.x,
                                     bbox.y,
                                     bbox.x + bbox.w,
                                     bbox.y + bbox.h]).map(n => n.id);
  }

  _calculateRadiusMedian() {
    if (this._tree == null)
      return;
    const bbox = this._pn.zoom.bbox();
    const scale = this._pn.zoom.scale();
    debug('current viewport is', bbox);
    const nodes = this._pickNodes(bbox);
    // debug('found these nodes in current viewport', nodes);
    const r = this._radiusFor(nodes) * scale;
    this._pn.emit('visiblenodes', nodes, r);
    // if (nodes.length < 30)
    //   this._pn.lighter.high(nodes);
  }

  _radiusFor(ids) {
    let sum = 0;
    const dist = (pos1, pos2) => {
      return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y);
    };
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