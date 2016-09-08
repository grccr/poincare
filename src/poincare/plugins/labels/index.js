import d3 from 'd3';
import { fieldGetter } from '../../helpers';
import most from 'most';
import { setGlobally, Plugin } from '../base';
import union from 'lodash/union';

import 'mozilla-fira-pack';
import './labels.less';

// const debug = require('debug')('poincare:labels');


export default class Labels extends Plugin {

  constructor(pn, opts) {
    super();

    this._options = Object.assign({
      template: '<b><%- label %></b>',
      getter: 'label',
      offset: [-50, 16]
    }, opts || {});

    this._locked = [];
    this._pn = pn;
    this._parentContainer = pn.container;

    if (typeof this._options.getter !== 'function')
      this._options.getter = fieldGetter(this._options.getter);

    let prevRadius = 0;
    this._initLayer();

    pn.on('dimensions', dims => {
      this._layer
        .style({ width: `${dims[0]}px`, height: `${dims[1]}px` });
    });

    const offset = this._options.offset;
    const x = this._x = xx => this._pn._core.xScale(xx) + offset[0];
    const y = this._y = yy => this._pn._core.yScale(yy) + offset[1];
    const linkx = this._linkx = xx => this._pn._core.xScale(xx);
    const linky = this._linky = yy => this._pn._core.yScale(yy);

    const THRESHOLD = 70;

    const hide = () => {
      this._labels && this._labels
        .transition()
          .duration(250)
          .style('opacity', 0)
          .remove();
      this._labels = null;

      this._current_ids = {
        'nodes': [],
        'links': []
      };
    };

    pn.on('radius:visibleElements', (ids, r) => {
      prevRadius = r;
      if (r < THRESHOLD)
        return hide();
      this._current_ids = ids;
      this._highlightThese(ids);
    });

    pn.on('frame', () => {
      // TODO: здесь можно пересчитывать радиус от scale и
      // убрать лейблы во время зума
      this._labels && this._labels
        .style('transform', (d) => {
          if(d.from){ 
            return `translate(${Math.round(linkx((d.from.x + d.to.x)/2))}px, ${Math.round(linky((d.from.y + d.to.y)/2))}px)`;
          }
          else {
            return `translate(${Math.round(x(d.pos.x))}px, ${Math.round(y(d.pos.y))}px)`;
          }
        });
    });

    const nodeOuts = most.fromEvent('nodeout', pn);
    const nodeOvers = most.fromEvent('nodeover', pn);

    const linkOuts = most.fromEvent('linkout', pn);
    const linkOvers = most.fromEvent('linkover', pn);

    this._createTooltipEvents(nodeOvers, nodeOuts, 'nodetip');
    this._createTooltipEvents(linkOvers, linkOuts, 'linktip');
  }

  _createTooltipEvents(overStream, outStream, name) {
    const pn = this._pn;
    const activator = overStream
      .concatMap(id => most.of(id).delay(1000).until(outStream));

    activator.observe(id => {
      pn.emit(`${name}.activate`, id);
      pn.emit(`${name}.over`, id);
    });

    const deactivator = outStream
      .concatMap(id => most.of(id).delay(1000).until(overStream));

    deactivator.observe(id => pn.emit(`${name}.deactivate`, id));

    const time = activator.constant(deactivator.take(1));

    activator
      .concatMap(id => overStream.during(time))
      .observe(id => pn.emit(`${name}.over`, id));
  }

  _resolveData(ids) {
    const nodes = this._pn._core.selectNodes(ids['nodes'])
      .filter(n => {
        try { return this._options.getter(n.data);} 
        catch (e) {}
        return false;
      });
    const links = this._pn._core.selectLinks(ids['links'])
      .filter(l => {
        try { return this._options.getter(l.data); } 
        catch (e) {}
        return false;
      });
    return { nodes, links };
  }

  _highlightThese(ids, locked = []) {
    const x = this._x;
    const y = this._y;
    const lockedIds = new Set(locked);

    const data = this._resolveData(ids);
    const labels = this._labels = this._layer.selectAll('.label')
      .data(data['nodes'].concat(data['links']), d => d.id);

    labels.enter()
      .append('div')
      .attr('class', (d) => `label-${d.id}`)
      .classed('label', true)
        .append('div')
          .classed('label-inner', true)
          .style('opacity', 0)
          .text(d => this._options.getter(d.data))
          .transition()
            .duration(1000)
            .style('opacity', 100);

    labels.exit()
        .classed('exiting', true)
        .transition()
          .duration(250)
          .style('opacity', 0)
          .remove();

    labels.filter('.exiting')
      .classed('exiting', false)
      .transition()
        .duration(250)
        .style('opacity', 100);

    labels
      .classed('locked-label', d => lockedIds.has(d.id))
      .style('transform', (d) => {
        return d.from ? 
          `translate(${Math.round(x((
            d.from.x + d.to.x)/2))}px,
          ${Math.round(y((d.from.y + d.to.y)/2))}px)`:
          `translate(${Math.round(x(d.pos.x))}px, ${Math.round(y(d.pos.y))}px)`;
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

  highlight(ids) {
    this._current_ids['nodes'] = union(this._current_ids['nodes'].concat(ids['nodes']));
    this._current_ids['links'] = union(this._current_ids['links'].concat(ids['links']));
    this._highlightThese(this._current_ids, ids);
  }
}

setGlobally(Labels);
