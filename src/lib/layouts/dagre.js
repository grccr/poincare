import dagre from 'dagre';
import merge from 'lodash/merge';


export default class DagreLayout {
  constructor(ash, options={}) {
    this._ash = ash;
  }

  layout() {
    let g = this._ash.graph;
    dagre.layout(g);
  }
}