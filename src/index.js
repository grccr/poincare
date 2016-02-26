// 'use strict';

// import 'babel/polyfill';

// import graphlib from 'graphlib';
import merge from 'lodash/merge';
// import sigma from 'sigma';
// import dagre from 'dagre';
import axios from 'axios';

import nGraph from 'ngraph.graph';
import pixiRenderer from 'ngraph.pixi';
import {balancedBinTree} from 'ngraph.generators';

// import Ashberry from './lib/ashberry';
// import NGraphDagreLayout from './lib/layouts/ngraph-dagre';
// import ZUI from './lib/behaviors/zoom';
import GraphMLParser from './lib/parsers/graphml';

let debug = require('debug')('poincare:app');


// Some expositions for testing purposes only
// window.graphlib = graphlib;

function getGraph() {
  return axios.get('/data/belgiia.graphml')
    .then(({ data }) => {
      return GraphMLParser.parse(data);
    });
}

function useNgraph() {

  function adaptGraph(graph) {
    let newGraph = nGraph();

    graph.nodes().forEach(id => {
      let data = merge(graph.node(id), {
        id: id,
        // size: 0.1,
        // color: '#000',
      });
      newGraph.addNode(id, data);
    });

    graph.edges().forEach(({v, w}) => {
      let data = merge(graph.edge(v, w), {
        id: `${v}-${w}`,
        // color: 'black',
        // source: v,
        // target: w,
        // type: 'curve'
      });

      newGraph.addLink(v, w, data);
    });

    return newGraph;
  }

  getGraph().then(loadedGraph => {
    // let graph = adaptGraph(loadedGraph);
    // let graph = balancedBinTree(11.3);
    let graph = balancedBinTree(4);

    debug('Graph nodes is %o %o', graph.getNodesCount(), graph.getLinksCount());

    let pixiGraphics = window.PIXI = pixiRenderer(graph, {
      container: document.getElementById('ashberry'),
      background: 0xFFFFFF,
      // physics: {
      //   stableThreshold: 100
      // }
      // layout: new NGraphDagreLayout(loadedGraph)
    });

    // let layout = pixiGraphics.layout;

    // just make sure first node does not move:
    // layout.pinNode(graph.getNode(1), true);

    // begin animation loop:
    pixiGraphics.run();
  });
}

window.addEventListener('load', () => {
  console.log('window loaded');
  useNgraph();
});