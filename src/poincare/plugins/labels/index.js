import d3 from 'd3';
import { fieldGetter } from '../../helpers';
import most from 'most';
import { setGlobally, Plugin } from '../base';
import union from 'lodash/union';

import 'mozilla-fira-pack/Fira/fira.css';
import './labels.less';

// const debug = require('debug')('poincare:labels');

export default class Labels extends Plugin {

  constructor(pn, opts) {
    super();

    this._pn = pn;
    this._options = Object.assign({
      template: '<b><%- label %></b>',
      getter: 'label',
      offsets: {
        link: [-50, -10],
        node: [-50, 16]
      }
    }, opts || {});
    if (typeof this._options.getter !== 'function')
      this._options.getter = fieldGetter(this._options.getter);

    this._initLayer(pn.container);

    const offsets = this._options.offsets;
    this._x = xx => this._pn._core.xScale(xx) + offsets.node[0];
    this._y = yy => this._pn._core.yScale(yy) + offsets.node[1];
    this._linkx = xx => this._pn._core.xScale(xx) + offsets.link[0];
    this._linky = yy => this._pn._core.yScale(yy) + offsets.link[1];

    pn.on('view:size', this._resizeLayer, this);
    pn.on('view:elements', this._onNewElements, this);
    pn.on('view:frame', this._render, this);
    pn.on('node:update', this._onNodeUpdate, this);
    pn.on('link:update', this._onLinkUpdate, this);

    const nodeOuts = most.fromEvent('node:out', pn);
    const nodeOvers = most.fromEvent('node:over', pn);
    const linkOuts = most.fromEvent('link:out', pn);
    const linkOvers = most.fromEvent('link:over', pn);
    this._createTooltipEvents(nodeOvers, nodeOuts, 'node:tip');
    this._createTooltipEvents(linkOvers, linkOuts, 'link:tip');
  }

  unplug() {
    this._pn
      .off('view:size', this._resizeLayer)
      .off('view:elements', this._onNewElements)
      .off('view:frame', this._render)
      .off('node:update', this._onNodeUpdate)
      .off('link:update', this._onLinkUpdate, this);
    this._destroyMethods();
    this._layer.remove();

    this._currentIDs =
    this._options =
    this._labels =
    this._layer =
    this._pn =
      null;
  }

  _resolveData(ids) {
    const nodes = this._pn._core.selectNodes(ids.nodes)
      .filter(n => {
        try {
          return this._options.getter(n.data);
        } catch (err) {
          //
        }
        return false;
      });
    const links = this._pn._core.selectLinks(ids.links)
      .filter(l => {
        try {
          return this._options.getter(l.data);
        } catch (err) {
          //
        }
        return false;
      });
    return { nodes, links };
  }

  _createTooltipEvents(overStream, outStream, name) {
    const pn = this._pn;

    const activator = overStream.concatMap(
      id => most.of(id).delay(1000).until(outStream)
    );
    activator.observe(id => {
      pn.emit(`${name}:show`, id);
      pn.emit(`${name}:hover`, id);
    });

    const deactivator = outStream.concatMap(
      id => most.of(id).delay(1000).until(overStream)
    );
    deactivator.observe(id => pn.emit(`${name}:hide`, id));

    const time = activator.constant(deactivator.take(1));
    activator
      .concatMap(id => overStream.during(time))
      .observe(id => pn.emit(`${name}.over`, id));
  }

  _initLayer(container) {
    this._layer = d3.select(container)
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

  _resizeLayer(dims) {
    this._layer.style({
      height: `${dims[1]}px`,
      width: `${dims[0]}px`
    });
  }

  _onNewElements(ids, r) {
    const THRESHOLD = 70;
    if (r < THRESHOLD)
      return this._hide();
    this._currentIDs = ids;
    this._highlightThese(ids);
  }

  _onNodeUpdate(node) {
    this._labels
      .filter(`.label-${CSS.escape(node.id)}`)
      .select('.label-inner')
      .text(d => this._options.getter(d.data));
  }

  _onLinkUpdate(link) {
    this._labels
      .filter(`.label-${CSS.escape(link.id)}`)
      .select('.label-inner')
      .text(d => this._options.getter(d.data));
  }

  _render() {
    // TODO: здесь можно пересчитывать радиус от scale и
    // убрать лейблы во время зума
    this._labels &&
    this._labels
      .style('transform', d => {
        const pos = d.from ? {
          x: Math.round(this._linkx((d.from.x + d.to.x) / 2)),
          y: Math.round(this._linky((d.from.y + d.to.y) / 2))
        } : {
          x: Math.round(this._x(d.pos.x)),
          y: Math.round(this._y(d.pos.y))
        };
        return `translate(${pos.x}px, ${pos.y}px)`;
      });
  }

  _hide() {
    this._labels &&
    this._labels
      .transition()
        .duration(250)
        .style('opacity', 0)
        .remove();
    this._labels = null;

    this._currentIDs = {
      nodes: [],
      links: []
    };
  }

  _highlightThese(ids, locked = []) {
    const x = this._x;
    const y = this._y;
    const linkx = this._linkx;
    const linky = this._linky;

    const lockedIds = new Set(locked);

    const data = this._resolveData(ids);
    const labels = this._labels = this._layer.selectAll('.label').data(
      data.nodes.concat(data.links),
      d => d.id
    );

    labels.enter()
      .append('div')
      .attr('class', (d) => `label-${d.id}`)
      .classed('label', true)
        .append('div')
          .classed('label-inner', true)
          .style('opacity', 0)
          .style('border', d => {
            const color = d.from ? d.data.color : 'black';
            return `1px solid ${color}`;
          })
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
        const pos = d.from ? {
          x: Math.round(linkx((d.from.x + d.to.x) / 2)),
          y: Math.round(linky((d.from.y + d.to.y) / 2))
        } : {
          x: Math.round(x(d.pos.x)),
          y: Math.round(y(d.pos.y))
        };
        return `translate(${pos.x}px, ${pos.y}px)`;
      });
  }

  highlight(ids) {
    this._currentIDs.nodes = union(this._currentIDs.nodes.concat(ids.nodes));
    this._currentIDs.links = union(this._currentIDs.links.concat(ids.links));
    this._highlightThese(this._currentIDs, ids);
  }
}

setGlobally(Labels);
