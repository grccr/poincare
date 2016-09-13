import d3 from 'd3';
// import throttle from 'lodash/throttle';

import Module from './base';

const debug = require('debug')('poincare:zoom');

export default class Zoom extends Module {
  constructor(pn, opts) {
    super();

    this._options = Object.assign({
      min: 0,
      max: Infinity
    }, opts || {});

    this._pn = pn;
    this._zoom = d3.behavior.zoom();
    this._$container = d3.select(pn._container);
    this._timer = null;

    this._pn.on('core:init', this._init, this);
    this._pn.on('core:clear', this._clear, this);
  }

  _init(){
    this._zoom(this._$container);
    this._zoom.scaleExtent([this._options.min, this._options.max]);
    this._zoom.size([200, 200]);

    this._pn.on('view:size', this._onViewResize, this);

    this._zoom.x(this._pn.core.xScale);
    this._zoom.y(this._pn.core.yScale);

    this.alignToCenter();

    this._zoom.on('zoomstart', () => {
      this._cancelViewReset();
    });

    this._zoom.on('zoomend', () => {
      this._viewReset();
    });
  }

  _clear(){
    this._pn.removeListener('view:size', this._onViewResize, this);
    this._zoom
      .on('zoomstart', null)
      .on('zoomend', null);
    this._cancelViewReset();
  }

  destroy() {
    this._pn.removeListener('core:clear', this._clear, this);
    this._pn.removeListener('core:init', this._init, this);
    this._clear();
    this._destroyMethods();
    this._zoom
      .on('zoomstart', null)
      .on('zoomend', null);
    this._$container.on('.zoom', null);
    this._$container =
    this._options =
    this._zoom =
    this._pn =
      null;
  }

  _onViewResize(dims){
    this._zoom.size(dims);
    this._pn.emit('view:reset', this._zoom.translate(), this._zoom.scale());
  }

  _viewReset() {
    this._cancelViewReset();
    this._timer = setTimeout(() => {
      this._pn.emit(
        'view:reset',
        this._zoom.translate(),
        this._zoom.scale()
      );
      this._timer = null;
    }, 40);
  }

  _cancelViewReset() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  scale() {
    return this._zoom.scale();
  }

  bbox() {
    const tr = this._zoom.translate();
    const sc = this._zoom.scale();
    const sz = this._pn.size;
    return {
      x: -tr[0] / sc,
      y: -tr[1] / sc,
      w: sz[0] / sc,
      h: sz[1] / sc
    };
  }

  truncatedScale() {
    return Math.min(this._zoom.scale(), 1);
  }

  alignToCenter(animated = false) {
    debug('to center', this._pn.size);
    this.transform(this._pn.size.map(d => d / 2), null, animated);
  }

  transform(tr, sc, animated = true) {
    if (tr == null && sc == null)
      return;
    
    debug(
      'Transforming to %o / %o',
      tr || this._zoom.translate(),
      sc || this._zoom.scale()
    );

    if (animated) {
      this._pn._core.stop();
      if (tr !== null)
        this._zoom.translate(tr);
      if (sc !== null)
        this._zoom.scale(sc);
      this._zoom.event(d3.transition().duration(1000));
    } else {
      if (tr !== null)
        this._zoom.translate(tr);
      if (sc !== null)
        this._zoom.scale(sc);
      this._zoom.event(d3.transition().duration(0));
    }
  }

  fitBounds(bbox, padding = 100, maxZoom = 3) {
    const dims = this._pn._dims;
    const pDims = dims.map(d => (d - padding * 2));
    const center = dims.map(d => d / 2);
    const { width: w, height: h, x, y } = bbox;
    const calcScale = (pA, pB, a, b) => {
      let sc = pA / a;
      if (b * sc >= pB)
        sc = pB / b * sc * sc;
      return sc;
    };

    let sc = (w > h) ? calcScale(pDims[0], pDims[1], w, h) :
                       calcScale(pDims[1], pDims[0], h, w);
    sc = Math.min(sc, maxZoom);

    const bboxCenter = [(x + w / 2) * sc, (y + h / 2) * sc];
    const tr = center.map((d, i) => (d - bboxCenter[i]));

    this.transform(tr, sc);
  }

  containerToGraphPoint(pos) {
    return [
      this._pn._core.xScale.invert(pos[0]),
      this._pn._core.yScale.invert(pos[1])
    ];
  }

  zoomNodes(ids) {
    const pdd = 8;
    const positions = ids.map(id => this._pn._core.node(id).pos);
    const x = d3.extent(positions, p => p.x);
    const y = d3.extent(positions, p => p.y);
    const bbox = {
      x: x[0] - pdd,
      y: y[0] - pdd,
      width: (x[1] - x[0]) + pdd * 2,
      height: (y[1] - y[0]) + pdd * 2 };
    this.fitBounds(bbox);
  }
}
