import nGraph from 'ngraph.graph';
import GraphMLParser from './graphml';
import { read } from 'graphlib/lib/json';

export function fromGraphlib(graph) {
  const newGraph = nGraph();

  graph.nodes().forEach(id => {
    const data = Object.assign({}, graph.node(id), {
      id
      // size: 0.1,
      // color: '#000',
    });
    newGraph.addNode(id, data);
  });

  graph.edges().forEach(({ v, w }) => {
    const data = Object.assign({}, graph.edge(v, w), {
      id: `${v}-${w}`
      // color: 'black',
      // source: v,
      // target: w,
      // type: 'curve'
    });

    newGraph.addLink(v, w, data);
  });

  return newGraph;
}

export function fromGraphML(doc) {
  return fromGraphlib(GraphMLParser.parse(doc));
}

export function fromJSON(doc) {
  const d = typeof doc === 'string' ? JSON.parse(doc) : doc;
  return fromGraphlib(read(d));
}

const NGraph = {
  fromGraphlib,
  fromGraphML,
  fromJSON
};

export default NGraph;

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.parsers == null)
    window.poincare.parsers = {};
  window.poincare.parsers.NGraph = NGraph;
}

