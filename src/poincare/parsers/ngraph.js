import nGraph from 'ngraph.graph';


export default function graphlib2ngraph(graph) {
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
