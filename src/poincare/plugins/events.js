import d3 from 'd3';
import throttle from 'lodash/throttle';
import Plugin from './base';

const debug = require('debug')('poincare:events');

export default class Events extends Plugin {
  constructor(pn, opts) {
    super();
    const container = pn.container();
    const RADIUS = 20;

    let lastNearest = null;

    const getNearest = throttle((pos) => {
      const graphPos = pn.zoom.containerToGraphPoint(pos);
      // debug('MOVE', pos, graphPos);
      const s = pn.zoom.scale();
      const r = s > 1 ? RADIUS / s : RADIUS * s;
      const nearest = pn.radius.nearest(graphPos, r);
      if (nearest == null && lastNearest != null) {
        // we're out of any node
        pn.emit('nodeout', lastNearest);
        lastNearest = null;
      } else if (nearest !== lastNearest) {
        // we're on node
        if (lastNearest != null) // but moved from other node
          pn.emit('nodeout', lastNearest);
        pn.emit('nodeover', nearest);
        lastNearest = nearest;
      }
      // debug('NEAREST', pn.radius.nearest(graphPos));
    }, 20);

    d3.select(container)
      .on('mousemove', () => {
        const position = d3.mouse(container);
        getNearest(position);
      })
      // .on('touchstart', () => {
      //   if (lastNearest != null) {
      //     d3.event.stopImmediatePropagation();
      //   }
      // })
      .on('click', () => {
        debug('CLICK');
        if (d3.event.defaultPrevented)
          return;
        if (lastNearest != null) {
          // d3.event.defaultPrevented = true;
          d3.event.stopImmediatePropagation();
          // d3.event.stopPropagation();
          // d3.event.preventDefault();
          pn.emit('nodeclick', lastNearest);
          return false;
        }
      })
      .on('mousedown', () => {
        debug('MOUSEDOWN');
        if (lastNearest != null) {
          d3.event.stopImmediatePropagation();
        }
      });
    // d3.select(container).on('mousemove', throttle(function () {
    //   const position = d3.mouse(container);
    //   debug('MOVE', position);
    // }, 250));
  }
}

Events.priority = 0;

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Events = Events;
}
