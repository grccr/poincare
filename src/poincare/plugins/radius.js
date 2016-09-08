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

function mid(pos1, pos2) {
  return {
    x: (pos1.x + pos2.x) / 2,
    y: (pos1.y + pos2.y) / 2
  };
}
export default class Radius extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      linkIndexFrequency: 30
    }, opts || {});
    this._pn = pn;
    this._tree = {
      'nodes': null,
      'links': null
    };
    this._lastRadius = 0;

    pn.on('layoutstop', () => {
      this._createIndex();
      this._calculateRadiusMedian();
    }, this);
    pn.on('viewreset', this._calculateRadiusMedian, this);
  }

  _createIndex() {
    debug('Will create node index');
    const nodesTree = this._tree['nodes'] = rbush(9, ['.x', '.y', '.x', '.y']);
    const nodesData = this._pn._core.mapNodes(node => ({ id: node.id, ...node.pos }));
    nodesTree.load(nodesData);
    debug('Nodes index created', nodesData);
    debug('Will create link\'s mid index');
    const linksTree = this._tree['links'] = rbush(9, ['.x', '.y', '.x', '.y']);
    const linksData = this._pn._core.mapLinks(link => ({ id: link.id, ...mid(link.to, link.from) }));
    linksTree.load(linksData);
    debug('Links index created', linksData);
  }

  getElementsByBbox(bbox, t = 'nodes') {
    const result = this._tree[t]
        .search([ 
          bbox.x,
          bbox.y,
          bbox.x + bbox.w,
          bbox.y + bbox.h
        ])
        .map(e => e.id);
    return result;
  }

  _calculateRadiusMedian() {
    if (this._tree['nodes'] == null || this._tree['links'] == null) return;
    const bbox = this._pn.zoom.bbox();
    const scale = this._pn.zoom.scale();
    debug('current viewport is', bbox);
    const nodes = this.getElementsByBbox(bbox);
    debug('found these nodes in current viewport', nodes);
    const links = this.getElementsByBbox(bbox, 'links');
    debug('found these links in current viewport', links);
    const r = this._radiusFor(nodes);
    const r2 = this._radiusFor(links, 'link');
    this._lastRadius = Math.max(r, r2);
    this._pn.emit('radius:visibleElements', { nodes, links }, this._lastRadius * scale);
  }

  lastRadiusForScale(sc) {
    return this._lastRadius * sc;
  }

  nearest(pos, radius = 30) {
    if (this._tree['nodes'] == null || this._tree['links'] == null) return null;
    const [nearest] = knn(this._tree['nodes'], pos, 1);
    if (nearest) {
      const distance = Math.hypot(nearest.x - pos[0], nearest.y - pos[1]);
      if (distance <= radius) {
        // debug('nearest', nearest.id);
        return nearest.id;
      }
    }
    return null;
  }

  _radiusFor(ids, t = 'node') {
    let sum = 0;
    ids.forEach(id => {
      const element = this._pn._core[t](id);
      const pos = t == 'node'? element.pos : mid(element.to, element.from);
      const [neighbor, neighbor2] = knn(this._tree[t + 's'], [pos.x, pos.y], 2);
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
