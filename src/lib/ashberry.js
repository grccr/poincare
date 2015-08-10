'use strict';

let Two = require('two.js/build/two.clean');
let graphlib = require('graphlib');
let merge = require('lodash/object/merge');

exports.Ashberry = class Ashberry {
  constructor(options) {
    this._options = merge({
      element: document.body,
    }, options);

    let two = this.two = new Two({
      type: Two.Types.canvas,
      fullscreen: true,
      autostart: false
    });

    two.appendTo(this._options.element);

    this._graph = new graphlib.Graph({
      directed: true
    });
  }

  stylize(circle, rect) {
    circle.fill = '#FF8000';
    circle.stroke = 'orangered'; // Accepts all valid css color
    circle.linewidth = 5;

    rect.fill = 'rgba(0, 200, 255, 0.5)';
    rect.opacity = 0.75;
    rect.noStroke();
  }

  load(graph) {
    if (graph !== undefined) {
      this._graph = graph;
      console.log('Graph loaded', graph);
    }
    return this._graph;
  }

  render() {
    let two = this.two;
    let circle = two.makeCircle(160, 100, 50);
    let rect = two.makeRectangle(213, 100, 100, 100);
    this.stylize(circle, rect);
    two.update();
  }
}