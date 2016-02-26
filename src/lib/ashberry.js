// 'use strict';

import Two from 'two.js/build/two.clean';
import graphlib from 'graphlib';
import merge from 'lodash/merge';

import DagreLayout from './layouts/dagre';

export default class Ashberry {
  constructor(options) {
    this._options = merge({
      element: document.getElementById('ashberry'),
    }, options);

    let two = this._two = new Two({
      type: Two.Types.canvas,
      fullscreen: true,
      autostart: false
    });

    two.appendTo(this._options.element);

    this._graph = new graphlib.Graph({
      directed: true
    });

    window.addEventListener('resize', () => {
      this._two.update();
    });

    this._layout = new DagreLayout(this);
  }

  stylize(circle, rect) {
    circle.fill = '#FF8000';
    circle.stroke = 'orangered'; // Accepts all valid css color
    circle.linewidth = 5;

    rect.fill = 'rgba(0, 200, 255, 0.5)';
    rect.opacity = 0.75;
    rect.noStroke();
  }

  get graph() {
    return this._graph;
  }

  load(graph) {
    if (graph !== undefined) {
      this._graph = graph;
      console.log('Graph loaded', graph);
    }
    return this._graph;
  }

  _init() {
    let two = this._two;
    let nodes = this._nodes = new Map();
    let edges = this._edges = new Map();
    this._graph.nodes().forEach(id => {
      let data = this._graph.node(id);
      let [x, y, r, o] = [two.width, two.height, 10, 1].map(v => Math.random() * v);
      let c = two.makeCircle(x, y, 5);
      data.width = data.height = 5 * 2 - 1;
      // c.opacity = r / 10;
      c.fill = 'white';
      nodes.set(id, c);
    });
  }

  *edgeSelection() {
    let edges = this._graph.edges();
    for (var i = 0; i < edges.length; i++) {
      let {v, w} = edges[i];
      let data = this._graph.edge(v, w);
      let elem = this._edges.get(edges[i]);
      yield [v, w, data, elem];
    }
  }

  *nodeSelection() {
    let nodes = this._graph.nodes();
    for (var i = 0; i < nodes.length; i++) {
      let data = this._graph.node(nodes[i]);
      let elem = this._nodes.get(nodes[i]);
      yield [nodes[i], data, elem];
    }
    // this._graph.nodes().forEach(id => {
    // });
  }

  _render() {
    for (var [src, trg, data, elem] of this.edgeSelection()) {
      let points = data.points
        .map(({x, y}) => [x, y])
        .reduce((a, b) => a.concat(b));
      let elem = this._two.makePolygon(...points, true);
      elem.noFill();
      elem.linewidth = 0.1;
    }
    for (var [id, data, elem] of this.nodeSelection()) {
      elem.translation.set(data.x, data.y);
      // elem.linewidth = 2;
    }
  }


  render() {
    let two = this._two;
    // let circle = two.makeCircle(160, 100, 50);
    // let rect = two.makeRectangle(213, 100, 100, 100);
    // this.stylize(circle, rect);
    this._init();
    this._layout.layout();
    this._render();
    two.update();
  }

  refresh() {
    this._two.update();
  }
}