import d3 from 'd3';
import { fieldGetter } from '../../helpers';
import template from 'lodash/template';
import './labels.less';

const debug = require('debug')('poincare:labels');


export default class Labels {
  constructor(pn, opts) {
    this._options = Object.assign({
      template: '<b><%- label %></b>',
      getter: 'label',
      offset: [-50, 16]
    }, opts || {});
    this._pn = pn;
    this._parentContainer = pn.container();
    if (typeof this._options.getter !== 'function')
      this._options.getter = fieldGetter(this._options.getter);
    this._initLayer();

    pn.on('dimensions', dims => {
      this._layer
        .style({ width: `${dims[0]}px`, height: `${dims[1]}px`});
    });

    const x = xx => this._pn._core.xScale(xx) + this._options.offset[0];
    const y = yy => this._pn._core.yScale(yy) + this._options.offset[1];

    const THRESHOLD = 70;

    const hide = () => {
      this._labels && this._labels
        .transition()
          .duration(1000)
          .style('opacity', 0)
          .remove();
      this._labels = null;
      // this._hidden = true;
    };
    let prevRadius = 0;

    // pn.on('zoom', (tr, sc) => {
    //   if (this._hidden)
    //     return;
    //   const r = pn.radius.lastRadiusForScale(sc);
    //   debug('Last median radius', r);
    //   if (r < THRESHOLD)
    //     return hide();
    // });

    pn.on('visiblenodes', (ids, r) => {
      prevRadius = r;
      if (r < THRESHOLD)
        return hide();
      // this._hidden = false;
      const data = this._pn._core.selectNodes(ids);
      const labels = this._labels = this._layer.selectAll('.label')
        .data(data, d => d.id);

      labels.enter()
        .append('div')
        .classed('label', true)
          .append('div')
            .classed('label-inner', true)
            .style('opacity', 0)
            .text(d => this._options.getter(d.data))
            .transition()
              .duration(1000)
              .style('opacity', 100);

      labels.exit()
          .transition()
            .duration(1000)
            .style('opacity', 0)
            .remove();

      labels
        .style('transform', (d) => `translate(${Math.round(x(d.pos.x))}px, ${Math.round(y(d.pos.y))}px)`);
    });

    pn.on('frame', () => {
      // TODO: здесь можно пересчитывать радиус от scale и
      // убрать лейблы во время зума
      this._labels && this._labels
        .style('transform', (d) => `translate(${Math.round(x(d.pos.x))}px, ${Math.round(y(d.pos.y))}px)`);
    });
  }

  _initLayer() {
    this._layer = d3.select(this._parentContainer)
      .append('div')
      .style({
        width: '200px',
        height: '200px',
        overflow: 'hidden',
        position: 'absolute',
        left: 0,
        top: 0
      })
      .classed('poincare-labels', true);
  }
}
