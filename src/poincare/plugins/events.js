import d3 from 'd3';
import throttle from 'lodash/throttle';

const debug = require('debug')('poincare:events');

export default class Events {
  constructor(pn, opts) {
    const container = pn.container();

    let lastNearest = null;

    const getNearest = throttle((pos) => {
      const graphPos = pn.zoom.containerToGraphPoint(pos);
      // debug('MOVE', pos, graphPos);
      const nearest = pn.radius.nearest(graphPos, 30 / pn.zoom.scale());
      if (nearest == null && lastNearest != null) {
        lastNearest = null;
        pn.lighter.off();
      } else if (nearest != lastNearest) {
        lastNearest = nearest;
        pn.lighter.light([nearest]);
      }
      // debug('NEAREST', pn.radius.nearest(graphPos));
    }, 20);

    d3.select(container).on('mousemove', () => {
      const position = d3.mouse(container);
      getNearest(position);
    });
    // d3.select(container).on('mousemove', throttle(function () {
    //   const position = d3.mouse(container);
    //   debug('MOVE', position);
    // }, 250));
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Events = Events;
}
