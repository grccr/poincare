'use strict';

import d3 from 'd3';
import { debounce } from 'lodash';
import axios from 'axios';

import Poincare from './poincare';
import * as nGraphParse from './poincare/parsers/ngraph';
import { Lighter, Labels, Events,
          Cursors, Directions } from './poincare/plugins';

const debug = require('debug')('poincare:app');

const stationIcon = require('../assets/icons/electric-icon.png');
const poleIcon = require('../assets/icons/pole-icon.png');
const plantIcon = require('../assets/icons/powerplant-icon.png');
const homeIcon = require('../assets/icons/home-icon.png');

const types = {
  'infrastructure/powersubstation': stationIcon,
  'infrastructure/powerline': poleIcon,
  'infrastructure/powerplant': plantIcon
};

const pn = window.PN = new Poincare({
  container: '.graph',
  zoom: {
    min: 0.1,
    max: 60
  },
  transparent: true,
  links: {
    color: (l) => {
      return l.data.color || '#CCC';
    }
  },
  icons: {
    source: (d) => {
      if (d.data.type === 'infrastructure/powerline' && d.links.length < 2)
        return homeIcon;
      if (d.data.type in types)
        return types[d.data.type];
      return stationIcon;
    },
    size: 16
  },
  physics: {
    // stableThreshold: 0.001
    springLength: 100,
    stableThreshold: 100
  },
  directions: {
    show: true
  },
  plugins: [Events, Lighter, Labels, Cursors, Directions]
});

pn.on('zoomstart', () => debug('zoomstart'));
pn.on('zoomend', () => debug('zoomend'));
pn.on('viewreset', () => debug('viewreset'));
pn.on('run', () => debug('run'));
pn.on('layoutstop', () => debug('layoutstop'));
pn.on('zoom', () => debug('zoom'));
// pn.on('visiblenodes', (nodes, r) => {
//   // if (nodes.length < 32)
//     // pn.plugins.lighter.light(nodes);
//   debug('Median radius is %o [%o]', r, nodes.length);
// });

// const outs = most.fromEvent('nodeout', pn);
// const overs = most.fromEvent('nodeover', pn);

// const activator = overs
//   .concatMap(id => most.of(id).delay(500).until(outs))
// activator.observe(id => pn.plugins.labels.highlight([id]));

// const deactivator = outs
//   .concatMap(id => most.of(id).delay(1000).until(overs));

// const time = activator.constant(deactivator.take(1));

// const delayedOverClicks = activator
//   .concatMap(id => overs.during(time))
//   .observe(id => pn.plugins.labels.highlight([id]));

pn.on('nodetip.over', id => pn.plugins.labels.highlight([id]));
// pn.on('nodetip.activate', id => pn.plugins.labels.highlight([id]));

// delayedOverClicks.observe((id) => {
//   pn.plugins.labels.highlight([id]);
//   debug('Delayed node over', id);
// });

pn.on('nodeover', (id) => {
  pn.plugins.lighter.light([id]);
  // debug('Node over', id);
});

pn.on('nodeout', (id) => {
  pn.plugins.lighter.light([]);
  pn.plugins.labels.highlight([]);
  // debug('Node out', id);
});


pn.on('nodeclick', (id) => {
  const item = pn.graph.getNode(id);
  debug('Node clicked', id, item);
});
pn.on('nodemenu', (id) => {
  const item = pn.graph.getNode(id);
  debug('Node menu clicked', id, item);
});
pn.on('linkclick', (id) => {
  const item = pn.core.link(id);
  debug('Just link clicked', id, item);
});
pn.on('linkmenu', (id) => {
  const item = pn.core.link(id);
  debug('Link menu clicked', id, item);
  return false;
});

pn.on('linktip.over', (id) => {
  const item = pn.core.link(id);
  pn.plugins.labels.highlight([item.fromId, item.toId]);
});

pn.on('linkover', (id) => {
  const item = pn.core.link(id);
  pn.plugins.lighter.lightLink([id]);
  pn.plugins.lighter.light([item.fromId, item.toId]);
  debug('Link over', id);
});
pn.on('linkout', (id) => {
  pn.plugins.lighter.lightLink([]);
  pn.plugins.lighter.light([]);
  pn.plugins.labels.highlight([]);
  debug('Link out', id);
});

pn.zoom.alignToCenter();

// debug('Poincare icons is', pn._options.icons);

let n = 1;
const testData = [
  '/data/estoniia.graphml',
  '/data/estoniia-color.graphml',
  '/data/belgiia-dual.graphml',
  '/data/belgiia-big.graphml',
  '/data/belgiia.graphml',
  null
];
function nextTestGraph() {
  axios.get(testData[n++])
  .then(({ data: doc }) => {
    return nGraphParse.fromGraphML(doc);
  })
  .then(graph => {
    pn.graph = graph;
    pn.run();
    // pn.plugins.lighter.light([
    //   '552f7ccb8a432b148143e681',
    //   '552f7ccb8a432b148143e63e'
    // ]);
  });
}
nextTestGraph();
window.nextGraph = nextTestGraph;


d3.select(window).on('resize', debounce(() => {
  pn.updateDimensions();
}, 100));

