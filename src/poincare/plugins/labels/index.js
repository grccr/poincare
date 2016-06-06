import d3 from 'd3';
import { fieldGetter } from '../../helpers';
import Plugin from '../base';
import template from 'lodash/template';
import './labels.less';

const debug = require('debug')('poincare:labels');


export default class Labels extends Plugin {
  constructor(pn, opts) {
    super();
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

    const x = this._x = xx => this._pn._core.xScale(xx) + this._options.offset[0];
    const y = this._y = yy => this._pn._core.yScale(yy) + this._options.offset[1];

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

    pn.on('visiblenodes', (ids, r) => {
      prevRadius = r;
      if (r < THRESHOLD)
        return hide();
      // this._hidden = false;
      this._highlightThese(ids);
    });

    pn.on('frame', () => {
      // TODO: здесь можно пересчитывать радиус от scale и
      // убрать лейблы во время зума
      this._labels && this._labels
        .style('transform', (d) => `translate(${Math.round(x(d.pos.x))}px, ${Math.round(y(d.pos.y))}px)`);
    });
  }

  _resolveData(ids) {
    return this._pn._core.selectNodes(ids)
      .filter(d => {
        try {
          return this._options.getter(d.data);
        } catch (e) {}
        return false;
      });
  }

  _highlightThese(ids) {
    const x = this._x;
    const y = this._y;
    const data = this._resolveData(ids);
    const labels = this._labels = this._layer.selectAll('.label')
      .data(data, d => d.id);

    labels.enter()
      .append('div')
      .attr('class', (d) => `node-label-${d.id}`)
      .classed('label auto-label', true)
        .append('div')
          .classed('label-inner', true)
          .style('opacity', 0)
          .text(d => this._options.getter(d.data))
          .transition()
            .duration(1000)
            .style('opacity', 100);

    labels.exit().filter('.auto-label')
        .classed('exiting', true)
        .transition()
          .duration(1000)
          .style('opacity', 0)
          .remove();

    labels.filter('.auto-label').filter('.exiting')
      .classed('exiting', false)
      .transition()
        .duration(1000)
        .style('opacity', 100);

    labels.filter('.auto-label')
      .style('transform', (d) => `translate(${Math.round(x(d.pos.x))}px, ${Math.round(y(d.pos.y))}px)`);
  }

  _locklight(ids) {
    const x = this._x;
    const y = this._y;
    const data = this._resolveData(ids);
    const labels = this._labels = this._layer.selectAll('.label')
      .data(data, d => d.id);

    labels.enter()
      .append('div')
      .attr('class', (d) => `node-label-${d.id}`)
      .classed('label locked-label', true)
        .append('div')
          .classed('label-inner', true)
          .style('opacity', 0)
          .text(d => this._options.getter(d.data))
          .transition()
            .duration(1000)
            .style('opacity', 100);

    labels.exit().filter('.locked-label')
      .classed('exiting', true)
      .transition()
        .duration(1000)
        .style('opacity', 0)
        .remove();

    labels.filter('.locked-label').filter('.exiting')
      .classed('exiting', false)
      .transition()
        .duration(250)
        .style('opacity', 100);

    labels
      .style('transform', (d) => `translate(${Math.round(x(d.pos.x))}px, ${Math.round(y(d.pos.y))}px)`);
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

  highlight(ids) {
    this._locklight(ids);
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Labels = Labels;
}
