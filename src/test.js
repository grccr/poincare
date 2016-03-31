'use strict';

import axios from 'axios';
import { balancedBinTree } from 'ngraph.generators';

import d3 from 'd3';
import debounce from 'lodash/debounce';

import Poincare from './poincare';
import * as nGraphParse from './poincare/parsers/ngraph';

import { Tween, Lighter, Radius, Labels, Events,
         Zoom, Cursors, LineIndex } from './poincare/plugins';

const debug = require('debug')('poincare:app');

const stationIcon = require('../assets/icons/electric-icon.png');
const poleIcon = require('../assets/icons/pole-icon.png');
const plantIcon = require('../assets/icons/powerplant-icon.png');
const homeIcon = require('../assets/icons/home-icon.png');


const myGraph = {
  nodes: [
    { v: '1', value: { label: '1' } },
    { v: '2', value: { label: '2' } },
    { v: '3', value: { label: '3' } }
  ],

  edges: [
    { v: '1', w: '2', value: { label: 3 } },
    { v: '1', w: '3', value: { label: 3 } }
  ],

  options: { directed: true }
};

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
  plugins: [Tween, Events, Zoom, Lighter, Radius, Labels, Cursors, LineIndex]
  // plugins: [Tween, Radius]
});

pn.on('zoomstart', () => debug('zoomstart'));
pn.on('zoomend', () => debug('zoomend'));
pn.on('viewreset', () => debug('viewreset'));
pn.on('run', () => debug('run'));
pn.on('layoutstop', () => debug('layoutstop'));
pn.on('zoom', () => debug('zoom'));
// pn.on('visiblenodes', (nodes, r) => {
//   // if (nodes.length < 32)
//     // pn.lighter.light(nodes);
//   debug('Median radius is %o [%o]', r, nodes.length);
// });
pn.on('nodeclick', (id) => {
  const item = pn.graph().getNode(id);
  debug('Node clicked', id, item);
});
pn.on('linkclick', (id) => {
  const item = pn.graph().getLink(id);
  debug('Link clicked', id, item);
});
pn.on('nodeover', (id) => {
  pn.lighter.light([id]);
  debug('Node over', id);
});
pn.on('nodeout', (id) => {
  pn.lighter.light([]);
  debug('Node out', id);
});

pn.on('linkover', (id) => {
  pn.lighter.lightLink([id]);
  debug('Link over', id);
});
pn.on('linkout', (id) => {
  pn.lighter.lightLink([]);
  debug('Link out', id);
});

pn.zoom.alignToCenter();

debug('Poincare icons is', pn.options().icons);


axios.get('/data/belgiia-big.graphml')
  .then(({ data: doc }) => {
    return nGraphParse.fromGraphML(doc);
    // return balancedBinTree(4);
    // return nGraphParse.fromJSON(myGraph);
  })
  .then(graph => {
    pn.graph(graph);
    pn.run();
    // pn.lighter.light(['552f7ccb8a432b148143e681', '552f7ccb8a432b148143e63e']);
  });

d3.select(window).on('resize', debounce(() => {
  pn.updateDimensions();
}, 100));
//
// let graph = balancedBinTree(11.3);
// let graph = balancedBinTree(14);
// let graph = balancedBinTree(4);
// pn.graph(graph);
// pn.run()


// // import graphlib from 'graphlib';
// import merge from 'lodash/merge';
// // import sigma from 'sigma';
// // import dagre from 'dagre';
// import axios from 'axios';

// import nGraph from 'ngraph.graph';
// import pixiRenderer from 'ngraph.pixi';
// import { balancedBinTree } from 'ngraph.generators';

// // import Ashberry from './lib/ashberry';
// // import NGraphDagreLayout from './lib/layouts/ngraph-dagre';
// // import ZUI from './lib/behaviors/zoom';
// import GraphMLParser from './lib/parsers/graphml';

// // Some expositions for testing purposes only
// // window.graphlib = graphlib;

// function getGraph() {
//   return axios.get('/data/belgiia.graphml')
//     .then(({ data }) => {
//       return GraphMLParser.parse(data);
//     });
// }

// function useNgraph() {



//   getGraph().then(loadedGraph => {
//     // let graph = adaptGraph(loadedGraph);
//     // let graph = balancedBinTree(11.3);
//     // let graph = balancedBinTree(13);
//     let graph = balancedBinTree(4);

//     debug('Graph nodes is %o %o', graph.getNodesCount(), graph.getLinksCount());

//     let pixiGraphics = window.PIXI = pixiRenderer(graph, {
//       container: document.getElementById('ashberry'),
//       background: 0xFFFFFF,
//       physics: {
//         stableThreshold: 100
//       }
//       // layout: new NGraphDagreLayout(loadedGraph)
//     });

//     // let layout = pixiGraphics.layout;

//     // just make sure first node does not move:
//     // layout.pinNode(graph.getNode(1), true);

//     // begin animation loop:
//     pixiGraphics.run();
//   });
// }

// window.addEventListener('load', () => {
//   console.log('window loaded');
//   useNgraph();
// });
