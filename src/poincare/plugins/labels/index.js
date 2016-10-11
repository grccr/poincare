import d3 from 'd3';
import { fieldGetter } from '../../helpers';
import most from 'most';
import { setGlobally, Plugin } from '../base';
import union from 'lodash/union';

import 'mozilla-fira-pack/Fira/fira.css';
import './labels.less';

// const debug = require('debug')('poincare:labels');

const BASE_WIDTH = 200;
const EM_SIZE = 20;

export default class Labels extends Plugin {

  constructor(pn, opts) {
    super();

    this._pn = pn;
    this._options = Object.assign({
      template: '<b><%- label %></b>',
      getter: 'label'
    }, opts || {});
    if (typeof this._options.getter !== 'function')
      this._options.getter = fieldGetter(this._options.getter);

    this._initLayer(pn.container);

    this._nodeXScale = (x, offset = -BASE_WIDTH / 2) =>
      Math.round(this._pn._core.xScale(x) + offset);
    this._nodeYScale = (y, offset = EM_SIZE * .75) =>
      Math.round(this._pn._core.yScale(y) + offset);
    this._linkXScale = (x, offset = 0) =>
      Math.round(this._pn._core.xScale(x) + offset);
    this._linkYScale = (y, offset = -EM_SIZE * 1.15 / 2) =>
      Math.round(this._pn._core.yScale(y) + offset);

    this._getLabelWidth = this._getLabelWidth.bind(this);
    this._getLabelTransform = this._getLabelTransform.bind(this);

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
    this._labels && this._labels
      .filter(`.label-${CSS.escape(node.id)}`)
      .select('.inner.label')
      .text(d => this._options.getter(d.data));
  }

  _onLinkUpdate(link) {
    this._labels && this._labels
      .filter(`.label-${CSS.escape(link.id)}`)
      .select('.inner.label')
      .style('color', d => {
        const c = d3.rgb(d.from ? d.data.color : 'black').darker(.7);
        return `rgb(${c.r},${c.g},${c.b})`;
      })
      .text(d => this._options.getter(d.data));
  }

  _getLabelWidth(d) {
    if (!d.from)
      return `${BASE_WIDTH}px`;
    const xScale = this._pn.core.xScale;
    const yScale = this._pn.core.yScale;
    const r = this._pn._options.nodes.radius;
    const width = Math.round(Math.hypot(
      xScale(d.from.x) - xScale(d.to.x),
      yScale(d.from.y) - yScale(d.to.y)
    )) - 4 * r;
    d.width = width;
    return `${width}px`;
  }

  _getLabelTransform(d) {
    if (!d.from) {
      // node
      const pos = {
        x: this._nodeXScale(d.pos.x),
        y: this._nodeYScale(d.pos.y)
      };
      return `translate(${pos.x}px, ${pos.y}px)`;
    }
    // link
    const pos = {
      x: this._linkXScale((d.from.x + d.to.x) / 2, -d.width / 2),
      y: this._linkYScale((d.from.y + d.to.y) / 2)
    };
    delete d.width;
    const sprite = this._pn.core.linkSprite(d.id);
    let rot = sprite.rotation;
    if (rot < -Math.PI / 2) {
      rot += Math.PI;
    } else if (rot > Math.PI / 2) {
      rot -= Math.PI;
    }
    return `translate(${pos.x}px, ${pos.y}px) rotate(${rot}rad)`;
  }

  _render() {
    // TODO: здесь можно пересчитывать радиус от scale и
    // убрать лейблы во время зума
    this._labels &&
    this._labels
      .style('width', this._getLabelWidth)
      .style('transform', this._getLabelTransform);
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
    const lockedIds = new Set(locked);

    const data = this._resolveData(ids);
    const labels = this._labels = this._layer.selectAll(
      '.node.label, .link.label'
    ).data(data.nodes.concat(data.links), d => d.id);

    labels.enter()
      .append('div')
        .attr('class', d => {
          const type = d.from ? 'link' : 'node';
          return `label-${d.id} ${type} label`;
        })
        .append('div')
          .classed('inner label', true)
          .style('opacity', 0)
          .style('color', d => {
            const c = d3.rgb(d.from ? d.data.color : 'black').darker(.7);
            return `rgb(${c.r},${c.g},${c.b})`;
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
      .classed('locked', d => lockedIds.has(d.id))
      .style('width', this._getLabelWidth)
      .style('transform', this._getLabelTransform);
  }

  highlight(ids) {
    this._currentIDs.nodes = union(this._currentIDs.nodes.concat(ids.nodes));
    this._currentIDs.links = union(this._currentIDs.links.concat(ids.links));
    this._highlightThese(this._currentIDs, ids);
  }
}

setGlobally(Labels);
