import rbush from 'rbush';
import knn from 'rbush-knn';
import Module from './base';

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

function idCompare(a, b) {
  return a.id === b.id;
}

export default class Radius extends Module {
  constructor(pn, opts) {
    super();

    this._pn = pn;
    this._options = Object.assign({
      linkIndexFrequency: 30
    }, opts || {});

    pn.on('core:init'  , this._init, this);
    pn.on('core:clear' , this._clear, this);
    pn.on('node:create', this._onNodeCreate, this);
    pn.on('node:update', this._calculateRadiusMedian, this);
    pn.on('node:movestart', this._onNodeStartMove, this);
    pn.on('node:movestop', this._onNodeStopMove, this);
    pn.on('node:remove', this._onNodeRemove, this);
    pn.on('link:create', this._onLinkCreate, this);
    pn.on('link:update', this._calculateRadiusMedian, this);
    pn.on('link:remove', this._onLinkRemove, this);
  }

  _init() {
    this._lastRadius = 0;
    this._tree = {
      nodes: null,
      links: null
    };

    this._pn.on('layout:ready', this._onLayoutReady, this);
    this._pn.on('view:reset', this._calculateRadiusMedian, this);
  }

  _clear() {
    this._pn
      .off('view:reset', this._calculateRadiusMedian)
      .off('layout:ready', this._onLayoutReady);

    const t = this._tree;
    if (t.nodes) {
      t.nodes.clear();
      t.node = null;
    }
    if (t.links) {
      t.links.clear();
      t.node = null;
    }

    this._tree =
    this._lastRadius =
      null;
  }

  destroy() {
    this._pn
      .off('core:clear', this._clear)
      .off('core:init', this._init)
      .off('node:create', this._onNodeCreate)
      .off('node:remove', this._onNodeRemove)
      .off('node:movestop'  , this._onNodeMove)
      .off('node:update', this._calculateRadiusMedian)
      .off('link:remove', this._onLinkRemove)
      .off('link:create', this._onLinkCreate)
      .off('link:update', this._calculateRadiusMedian);
    this._clear();
    this._destroyMethods();
    this._options =
    this._pn =
      null;
  }

  _onLayoutReady() {
    this._createIndex();
    this._calculateRadiusMedian();
  }

  _onNodeCreate(node) {
    this._tree.nodes.insert({ id: node.id, ...node.pos });
    this._calculateRadiusMedian();
  }

  _onNodeStartMove(node) {
    let item = this._tree.nodes.all().find((n) => { return n.id === node.id; });
    this._tree.nodes.remove(item, idCompare);
    for (const link of node.links) {
      item = this._tree.links.all().find((l) => { return l.id === link.id; });
      this._tree.links.remove(item, idCompare);
    }
  }

  _onNodeStopMove(node) {
    let item = { id: node.id, ...node.pos };
    this._tree.nodes.insert(item);
    for (const link of node.links) {
      item = { id: link.id, ...mid(link.to, link.from) };
      this._tree.links.insert(item);
    }
  }

  _onNodeRemove(id) {
    const item = this._tree.nodes.all().find((n) => { return n.id === id; });
    this._tree.nodes.remove(item, idCompare);
    this._calculateRadiusMedian();
  }

  _onLinkCreate(link) {
    this._tree.links.insert({ id: link.id, ...mid(link.to, link.from) });
    this._calculateRadiusMedian();
  }

  _onLinkRemove(link) {
    const item = this._tree.links.all().find((l) => { return l.id === link.id; });
    this._tree.links.remove(item, idCompare);
    this._calculateRadiusMedian();
  }

  _createIndex() {
    debug('Gonna create nodes\' index');
    const nodesTree = this._tree.nodes = rbush(9, ['.x', '.y', '.x', '.y']);
    const nodesData = this._pn.core.mapNodes(node => ({
      id: node.id, ...node.pos
    }));
    nodesTree.load(nodesData);
    debug('Nodes index is created', nodesData.length, nodesData);

    debug('Gonna create link\'s mid index');
    const linksTree = this._tree.links = rbush(9, ['.x', '.y', '.x', '.y']);
    const linksData = this._pn.core.mapLinks(link => ({
      id: link.id, ...mid(link.to, link.from)
    }));
    linksTree.load(linksData);
    debug('Links index is created', linksData.length, linksData);
  }

  _calculateRadiusMedian() {
    if (null === this._tree.nodes || null === this._tree.links) return;
    const bbox = this._pn.zoom.bbox();
    const scale = this._pn.zoom.scale();
    debug('current viewport is', bbox);

    const nodes = this.getElementsByBbox(bbox);
    debug('Nodes found in viewport', nodes);
    const links = this.getElementsByBbox(bbox, 'links');
    debug('Links found in viewport', links);

    const r = this._radiusFor(nodes);
    const r2 = this._radiusFor(links, 'link');
    this._lastRadius = Math.max(r, r2);
    this._pn.emit(
      'view:elements',
      { nodes, links },
      this._lastRadius * scale
    );
  }

  _radiusFor(ids, t = 'node') {
    let sum = 0;
    ids.forEach(id => {
      const element = this._pn.core[t](id);
      const pos = t === 'node' ? element.pos : mid(element.to, element.from);
      const [neighbor1, neighbor2] = knn(this._tree[`${t}s`], pos.x, pos.y, 2);
      sum += dist(pos, neighbor2 || neighbor1);
    });
    return sum / ids.length;
  }

  getElementsByBbox(bbox, t = 'nodes') {
    const result = this._tree[t]
      .search({
        minX: bbox.x,
        minY: bbox.y,
        maxX: bbox.x + bbox.w,
        maxY: bbox.y + bbox.h
      })
      .map(e => e.id);
    return result;
  }

  nearest(pos, radius = 30) {
    if (null === this._tree.nodes || null === this._tree.links)
      return null;
    const [nearest] = knn(this._tree.nodes, pos[0], pos[1], 1);
    if (nearest) {
      const distance = Math.hypot(nearest.x - pos[0], nearest.y - pos[1]);
      if (distance <= radius) {
        // debug('nearest', nearest.id);
        return nearest.id;
      }
    }
    return null;
  }
}
