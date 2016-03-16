'use strict';

import axios from 'axios';
import { balancedBinTree } from 'ngraph.generators';

import Poincare from './poincare';
import GraphMLParser from './poincare/parsers/graphml';
import graphlib2ngraph from './poincare/parsers/ngraph';
import Lighter from './poincare/plugins/lighter';
import Radius from './poincare/plugins/radius';

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

const sizes = {
  'infrastructure/powersubstation': stationIcon,
  'infrastructure/powerline': poleIcon,
  'infrastructure/powerplant': plantIcon
};

const pn = window.PN = new Poincare({
  container: '.graph',
  background: 'red',
  zoom: {
    min: 0.1,
    max: 10
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
    stableThreshold: 100
  },
  plugins: [Lighter, Radius]
});

pn.on('zoomstart', () => debug('zoomstart'));
pn.on('zoomend', () => debug('zoomend'));
pn.on('viewreset', () => debug('viewreset'));
pn.on('run', () => debug('run'));
pn.on('layoutstop', () => debug('layoutstop'));
pn.on('visiblenodes', (nodes, r) => {
  if (nodes.length < 128)
    pn.lighter.high(nodes);
  debug('Median radius is %o [%o]', r, nodes.length);
});
pn.on('nodeclick', (e) => debug('Node clicked', e));

pn.zoom.alignToCenter();

debug('Poincare icons is', pn.options().icons);


axios.get('/data/belgiia.graphml')
  .then(({ data }) => {
    return graphlib2ngraph(GraphMLParser.parse(data));
  })
  .then(graph => {
    pn.graph(graph);
    pn.run();
    pn.lighter.high(['552f7ccb8a432b148143e681', '552f7ccb8a432b148143e63e']);
  });
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
