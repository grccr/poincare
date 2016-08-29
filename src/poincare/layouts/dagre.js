import dagre from 'dagre';


export default class DagreLayout {
  constructor(ash, options = {}) {
    this._ash = ash;
  }

  layout() {
    const g = this._ash.graph;
    dagre.layout(g);
  }
}
