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
    const zoom = this._zoom = d3.behavior.zoom();
    const $container = this._$container = d3.select(pn._container);

    this._pn = pn;

    zoom($container);
    zoom.scaleExtent([this._options.min, this._options.max]);
    zoom.size([200, 200]);

    pn.on('view:size', (dims) => {
      zoom.size(dims);
      pn.emit('view:reset', zoom.translate(), zoom.scale());
    });

    zoom.x(pn._core.xScale);
    zoom.y(pn._core.yScale);

    // this._scaleFactor = 1;

    let timer;

    const cancelViewReset = () => {
      if (timer == null)
        return;
      clearTimeout(timer);
      timer = null;
    };

    const viewReset = () => {
      cancelViewReset();
      timer = setTimeout(() => {
        pn.emit('view:reset', zoom.translate(), zoom.scale());
        timer = null;
      }, 40);
    };

    // const zoomStart = () => {
      // pn.emit('zoom:start', zoom.translate(), zoom.scale());
    // });

    zoom.on('zoomstart', () => {
      cancelViewReset();
      // zoomStart();
    });

    zoom.on('zoomend', () => {
      // pn.emit('zoom:stop', zoom.translate(), zoom.scale());
      viewReset();
    });

    // zoom.on('zoom', throttle(() => {
    //   pn.emit('zoom:change', zoom.translate(), zoom.scale());
    // }, 100));

    this._wasSwitch = false;
  }

  destroy() {
    this._destroyMethods();
    this._zoom
      .on('zoom', null)
      .on('zoomstart', null)
      .on('zoomend', null);
    this._$container.on('.zoom', null);
    this._zoom = null;
    this._$container = null;
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
      if (tr != null)
        this._zoom.translate(tr);
      if (sc != null)
        this._zoom.scale(sc);
      this._zoom.event(d3.transition().duration(1000));
      this._pn._core.run();
    } else {
      if (tr != null)
        this._zoom.translate(tr);
      if (sc != null)
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
