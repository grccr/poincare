'use strict';

import d3 from 'd3';
import axios from 'axios';

import Poincare from './poincare';
import * as nGraphParse from './poincare/parsers/ngraph';
import {
  AutoResize, Cursors, Directions, Events, Labels, Lighter, LinkClassifier
} from './poincare/plugins';

const debug = require('debug')('poincare:app');

const stationIcon = require('../assets/icons/electric-icon.png');
const poleIcon = require('../assets/icons/pole-icon.png');
const plantIcon = require('../assets/icons/powerplant-icon.png');
const homeIcon = require('../assets/icons/home-icon.png');
const userIcon = require('../assets/icons/user-icon.png');

const types = {
  'infrastructure/powersubstation': stationIcon,
  'infrastructure/powerline': poleIcon,
  'infrastructure/powerplant': plantIcon
};


//const scale = d3.scale.category20();

const pn = window.PN = new Poincare({
  container: '.graph',
  zoom: {
    min: 0.1,
    max: 60
  },
  transparent: true,
  nodes: {
    radius: 16
  },
  links: {
    color: (l) => {
      return '#CCC';
    },
    width: (l) => {
      return (l.data && l.data.width) || 0.5;
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
  // labels: {
  //   getter: (d) => { return d.label; }
  // },
  physics: {
    // stableThreshold: 0.001
    springLength: 100,
    stableThreshold: 100
  },
  directions: {
    show: true
  },
  // linkRanger: {
  //   show: true,
  //   colors: ['#232332', '#555', '#111'],
  //   // width: [1, 20]
  //   width: 1
  // },
  linkclassifier: {
    show: true,
    colors: 'category10',
    colorGetter: 'voltage',
    width: [1, 15],
    widthGetter: 'voltage'
  },
  plugins: [AutoResize, Events, Lighter, Labels, Cursors, Directions, LinkClassifier]
});

pn.on('zoom:start', () => debug('zoomstart'));
pn.on('zoom:stop', () => debug('zoomend'));
pn.on('view:reset', () => debug('viewreset'));
pn.on('core:run', () => debug('run'));
pn.on('layout:ready', () => debug('layoutstop'));
pn.on('zoom:change', () => debug('zoom'));
// pn.on('view:elements', (nodes, r) => {
//   if (nodes.length < 32) {
//     const lighter = pn.plugins.lighter;
//     lighter && lighter.lightNodes(nodes);
//   }
//   debug('Median radius is %o [%o]', r, nodes.length);
// });

// const outs = most.fromEvent('node:out', pn);
// const overs = most.fromEvent('node:over', pn);

// const activator = overs
//   .concatMap(id => most.of(id).delay(500).until(outs))
// activator.observe(id => {
//   const labels = pn.plugins.labels;
//   labels && labels.highlight([id]);
// });

// const deactivator = outs
//   .concatMap(id => most.of(id).delay(1000).until(overs));

// const time = activator.constant(deactivator.take(1));

// const delayedOverClicks = activator
//   .concatMap(id => overs.during(time))
//   .observe(id => {
//     const labels = pn.plugins.labels;
//     labels && labels.highlight([id]);
//   });

pn.on('node:tip:hover', id => {
  const labels = pn.plugins.labels;
  labels && labels.highlight([id]);
});
// pn.on('node:tip:show', id => {
//   const labels = pn.plugins.labels;
//   labels && labels.highlight([id]);
// });

// delayedOverClicks.observe((id) => {
//   const labels = pn.plugins.labels;
//   labels && labels.highlight([id]);
//   debug('Delayed node over', id);
// });

pn.on('node:over', (id) => {
  const lighter = pn.plugins.lighter;
  lighter && lighter.lightNodes([id]);
  debug('Node over', id);
});

pn.on('node:out', (id) => {
  const lighter = pn.plugins.lighter;
  const labels = pn.plugins.labels;
  lighter && lighter.lightNodes([]);
  labels && labels.highlight([]);
  debug('Node out', id);
});


pn.on('node:click', (id, event) => {
  const item = pn.graph.getNode(id);
  debug('Node clicked', id, item, event);
});
pn.on('node:menu', (id, event) => {
  const item = pn.graph.getNode(id);
  debug('Node menu clicked', id, item, event);
});
pn.on('link:click', (id, event) => {
  const item = pn.core.link(id);
  debug('Just link clicked', id, item, event);
});
pn.on('link:menu', (id, event) => {
  const item = pn.core.link(id);
  debug('Link menu clicked', id, item, event);
  return false;
});

pn.on('link:tip:hover', (id) => {
  const item = pn.core.link(id);
  const labels = pn.plugins.labels;
  labels && labels.highlight([item.fromId, item.toId]);
});

pn.on('link:over', (id) => {
  const item = pn.core.link(id);
  const lighter = pn.plugins.lighter;
  lighter && lighter.lightLinks([id]);
  lighter && lighter.lightNodes([item.fromId, item.toId]);
  debug('Link over', id);
});
pn.on('link:out', (id) => {
  const lighter = pn.plugins.lighter;
  const labels = pn.plugins.labels;
  lighter && lighter.lightLinks([]);
  lighter && lighter.lightNodes([]);
  labels && labels.highlight([]);
  debug('Link out', id);
});

// debug('Poincare icons is', pn._options.icons);

let n = 3;
const testData = [
  '/data/estoniia.graphml',
  '/data/estoniia-color.graphml',
  '/data/belgiia-dual.graphml',
  '/data/belgiia-big.graphml',
  '/data/belgiia.graphml'
];
function nextTestGraph(reload = false) {
  axios
    .get(testData[reload ? n : ++n % testData.length])
    .then(({ data: doc }) => {
      return nGraphParse.fromGraphML(doc);
    })
    .then(graph => {
      pn.graph = graph;
      // const lighter = pn.plugins.lighter;
      // lighter && lighter.lightNodes([
      //   '552f7ccb8a432b148143e681',
      //   '552f7ccb8a432b148143e63e'
      // ]);
    });
}
nextTestGraph();
window.nextGraph = nextTestGraph;
