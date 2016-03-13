import d3 from 'd3';

class Zoom {
  constructor(pn, opts) {
    this._options = Object.assign({
      min: 0,
      max: Infinity
    }, opts || {});
    const zoom = this._zoom = d3.behavior.zoom();
    const $container = this._$container = d3.select(pn._container);
    const group = pn._core._group;

    this._pn = pn;

    zoom($container);
    zoom.scaleExtent([this._options.min, this._options.max]);
    zoom.size(pn._dims);

    zoom.x(pn._core._xScale);
    zoom.y(pn._core._yScale);

    // zoom.on('zoom', () => {
    //   group.scale.x = d3.event.scale;
    //   group.scale.y = d3.event.scale;

    //   group.position.x = d3.event.translate[0];
    //   group.position.y = d3.event.translate[1];
    // });

    // zoom.on('zoom', this._zoomHandler.bind(this, group));
    this._wasSwitch = false;
  }

  _toggleScale(toggle) {
    if (toggle === this._toggle)
      return;
    if (toggle) {
      this._zoom.x(this._pn._core._xScale);
      this._zoom.y(this._pn._core._yScale);
    } else {
      this._pn._core._xScale
        .range([0, 1])
        .domain([0, 1]);
      this._pn._core._yScale
        .range([0, 1])
        .domain([0, 1]);
      this._zoom.x(this._pn._core._xScale);
      this._zoom.y(this._pn._core._yScale);
    }
    this._toggle = toggle;
  }

  _zoomHandler(group) {
    if (d3.event.scale > 1) {
      return this._toggleScale(true);
    } else {
      this._toggleScale(false);
    }
    group.scale.x = d3.event.scale;
    group.scale.y = d3.event.scale;

    group.position.x = d3.event.translate[0];
    group.position.y = d3.event.translate[1];
  }

  unplug() {
    this._zoom.on('zoom', null);
    this._$container.on('.zoom', null);
  }
}

export default Zoom;
