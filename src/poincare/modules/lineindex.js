import rbush from 'rbush';
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

export default class LineIndex extends Module {
  constructor(pn, opts) {
    super();
    this._pn = pn;

    pn.on('core:init', this._init, this);
    pn.on('core:clear', this._clear, this);
    pn.on('link:create', this._onLinkCreate, this);
    pn.on('link:remove', this._onLinkRemove, this);
  }

  _init() {
    this._tree = null;
    this._bbox = { x0: 0, y0: 0, x1: 0, y1: 0 };
    this._pn.on('layout:ready', this._createLinkIndex, this);
  }

  _clear() {
    this._pn.off('layout:ready', this._createLinkIndex);
    if (this._tree)
      this._tree.clear();
    this._tree =
    this._bbox =
      null;
  }

  destroy() {
    this._pn
      .off('core:clear', this._clear)
      .off('core:init', this._init)
      .off('link:create', this._onLinkCreate)
      .off('link:remove', this._onLinkRemove);
    this._clear();
    this._destroyMethods();
    this._tree =
    this._pn =
      null;
  }

  _onLinkCreate(link) {
    const bbox = makeNormalLineBBox(link);
    this._tree.insert({ 
      id: link.id, 
      x0: bbox[0], 
      y0: bbox[1], 
      x1: bbox[2],
      y1: bbox[3]
    });
  }

  _onLinkRemove(link) {
    const bbox = makeNormalLineBBox(link);
    this._tree.remove({ 
      id: link.id, 
      x0: bbox[0], 
      y0: bbox[1], 
      x1: bbox[2],
      y1: bbox[3]
    }, function (a, b) {return a.id === b.id;});
  }

  _createLinkIndex() {
    const tree = this._tree = rbush(9, ['.x0', '.y0', '.x1', '.y1']);
    debug('Will create link index');
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

  nearest(pos, radius = 20) {
    if (this._tree == null)
      return null;
    const bbox = {
      minX: pos[0] - radius, 
      minY: pos[1] - radius,
      maxX: pos[0] + radius, 
      maxY: pos[1] + radius
    };
    this._bbox.x0 = bbox.minX;
    this._bbox.y0 = bbox.minY;
    this._bbox.x1 = bbox.maxX;
    this._bbox.y1 = bbox.maxY;
    const found = this._tree.search(bbox);
    if (found.length < 1)
      return null;
    const links = this._pn._core.selectLinks(found.map(f => f.id));
    const nearest = this._pickNearest(links, pos);
    if (nearest.d <= radius) {
      return nearest.id;
    }
    return null;
  }
}
