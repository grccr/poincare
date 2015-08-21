// 'use strict';

// import 'babel/polyfill';

// import graphlib from 'graphlib';
import superagent from 'superagent';
import superagentPromise from 'superagent-promise';
const request = superagentPromise(superagent, Promise);
import merge from 'lodash/object/merge';
import sigma from 'sigma';
import dagre from 'dagre';


// import Ashberry from './lib/ashberry';
// import ZUI from './lib/behaviors/zoom';
import GraphMLParser from './lib/parsers/graphml';


// Some expositions for testing purposes only
// window.graphlib = graphlib;

function getGraph() {
  return request.get('/data/belgiia.graphml')
    .then(({ok, text}) => {
      if (ok)
        return GraphMLParser.parse(text);
    });
}

// function useAshberry() {
//   let ash = new Ashberry({
//     element: document.body
//   });

//   let zui = new ZUI(ash._two);
//   zui.addLimits(0.06, 8);

//   let stage = ash._two.renderer.domElement;
//   function wheelHandler(event) {
//     let e = event;
//     e.stopPropagation();
//     e.preventDefault();
//     let dy = (e.wheelDeltaY || - e.deltaY) / 1000;
//     zui.zoomBy(dy, e.clientX, e.clientY);
//     ash.refresh();
//     // ash.refresh();
//   }
//   stage.addEventListener('wheel', wheelHandler);
//   stage.addEventListener('mousewheel', wheelHandler);

//   getGraph.then(graph => {
//     ash.load(graph);
//     ash.render();
//   });
// }

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
      type: 'canvas'
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