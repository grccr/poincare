// 'use strict';

// import 'babel/polyfill';

// import graphlib from 'graphlib';
import merge from 'lodash/merge';
import sigma from 'sigma';
import dagre from 'dagre';
import axios from 'axios';

import nGraph from 'ngraph.graph';
import pixiRenderer from 'ngraph.pixi';
import {balancedBinTree} from 'ngraph.generators';

import Ashberry from './lib/ashberry';
import NGraphDagreLayout from './lib/layouts/ngraph-dagre';
import ZUI from './lib/behaviors/zoom';
import GraphMLParser from './lib/parsers/graphml';


// Some expositions for testing purposes only
// window.graphlib = graphlib;

function getGraph() {
  return axios.get('/data/belgiia.graphml')
    .then(({ data }) => {
      return GraphMLParser.parse(data);
    });
}

function useAshberry() {
  let ash = new Ashberry({
    element: document.body
  });

  let zui = new ZUI(ash._two);
  zui.addLimits(0.06, 8);

  let stage = ash._two.renderer.domElement;
  function wheelHandler(event) {
    let e = event;
    e.stopPropagation();
    e.preventDefault();
    let dy = (e.wheelDeltaY || - e.deltaY) / 1000;
    zui.zoomBy(dy, e.clientX, e.clientY);
    ash.refresh();
  }
  stage.addEventListener('wheel', wheelHandler);
  stage.addEventListener('mousewheel', wheelHandler);

  getGraph().then(graph => {
    ash.load(graph);
    ash.render();
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
    let graph = adaptGraph(loadedGraph);
    // let graph = balancedBinTree(8);

    let pixiGraphics = window.PIXI = pixiRenderer(graph, {
      container: document.getElementById('ashberry'),
      background: 0xFFFFFF,
      physics: {
        stableThreshold: 100
      }
      // layout: new NGraphDagreLayout(loadedGraph)
    });

    // let layout = pixiGraphics.layout;

    // just make sure first node does not move:
    // layout.pinNode(graph.getNode(1), true);

    // begin animation loop:
    pixiGraphics.run();
  });
}

function useSigma() {
  let s = new sigma({
    settings: {
      drawLabels: false,
      minNodeSize: 0.1,
      maxNodeSize: 2,
      defaultEdgeColor: '#CCC',
      edgeColor: 'default'
    },
    renderers: [{
      container: document.getElementById('ashberry'),
      type: 'webgl'
    }]
  });

  // s.addRenderer({
  //   type: 'canvas',
  //   drawLabels: false
  // });

  getGraph().then(graph => {
    graph.nodes().forEach(id => {
      let data = graph.node(id);
      data.width = data.height = 9;
    });

    dagre.layout(graph);

    console.log('Layout done');

    graph.nodes().forEach(id => {
      let data = merge(graph.node(id), {
        id: id,
        size: 0.1,
        color: '#000',
        // borderSize: 1,
        // defaultNodeBorderColor: '#000'
      });
      s.graph.addNode(data);
    });

    graph.edges().forEach(({v, w}) => {
      let data = merge(graph.edge(v, w), {
        id: `${v}-${w}`,
        // color: 'black',
        source: v,
        target: w,
        type: 'curve'
      });

      s.graph.addEdge(data);
    });

    s.refresh();
  });
}

window.addEventListener('load', () => {
  console.log('window loaded');
  useSigma();
});