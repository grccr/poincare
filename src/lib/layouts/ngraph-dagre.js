import nGraph from 'ngraph.graph';
import dagre from 'dagre';
import merge from 'lodash/merge';


export default class NGraphDagreLayout {
  constructor(graph, settings={}) {
    this._graph = graph;
    this._layouted = false;
    this._expr = /\w+/g;
  }

  /**
   * Performs one step of iterative layout algorithm
   */
  step() {
    if (this._layouted)
      return;
    this._layouted = this._layout();
  }

  static graphlibToNGraph(graph) {
    let newGraph = nGraph();

    graph.nodes().forEach(id => {
      newGraph.addNode(id, graph.node(id));
    });

    graph.edges().forEach(({v, w}) => {
      newGraph.addLink(v, w, graph.edge(v, w));
    });

    return newGraph;
  }

  _layout() {
    dagre.layout(this._graph);
    return true;
  }

  /**
   * For a given `nodeId` returns position
   */
  getNodePosition(nodeId) {
    let {x, y} = this._graph.node(nodeId);
    return {x, y};
  }

  /**
   * Sets position of a node to a given coordinates
   * @param {string} nodeId node identifier
   * @param {number} x position of a node
   * @param {number} y position of a node
   * @param {number=} z position of node (only if applicable to body)
   */
  setNodePosition(nodeId, x, y, z) {

  }

  /**
   * @returns {Object} Link position by link id
   * @returns {Object.from} {x, y} coordinates of link start
   * @returns {Object.to} {x, y} coordinates of link end
   */
  getLinkPosition(linkId) {
    let [source, target] = linkId.match(this._expr);
    let edge = this._graph.edge(source, target);
    return {
      from: edge.points[0],
      to: edge.points[edge.points.length-1]
    };
  }

  /**
   * @returns {Object} area required to fit in the graph. Object contains
   * `x1`, `y1` - top left coordinates
   * `x2`, `y2` - bottom right coordinates
   */
  getGraphRect() {
    let {width, height} = this._graph.graph();
    return {
      x1: 0,
      y1: 0,
      x2: width,
      y2: height
    };
  }

  /*
   * Requests layout algorithm to pin/unpin node to its current position
   * Pinned nodes should not be affected by layout algorithm and always
   * remain at their position
   */
  pinNode(node, isPinned) {
    // var body = getInitializedBody(node.id);
    // body.isPinned = !!isPinned;
    return;
  }

  /**
   * Checks whether given graph's node is currently pinned
   */
  isNodePinned(node) {
    // return getInitializedBody(node.id).isPinned;
    return false;
  }

  /**
   * Request to release all resources
   */
  dispose() {
    // this.graph.off('changed', onGraphChanged);
  }
}