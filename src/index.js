'use strict';

import axios from 'axios';

import Poincare from './poincare';
import GraphMLParser from './poincare/parsers/graphml';
import graphlib2ngraph from './poincare/parsers/ngraph';

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
    min: 0.2,
    max: 2
  },
  transparent: true,
  icons: {
    source: (d) => {
      if (d.data.type in types)
        return types[d.data.type];
      return homeIcon;
    },
    size: 16
  }
});

debug('Poincare icons is', pn.options().icons);


axios.get('/data/belgiia.graphml')
  .then(({ data }) => {
    return graphlib2ngraph(GraphMLParser.parse(data));
  })
  .then(graph => {
    debug('Graph is loaded & converted', graph);
    pn.graph(graph);
    pn.run();
  });


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
