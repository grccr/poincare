import { setGlobally, Plugin } from '../base';
import d3 from 'd3';

import './cursors.less';

export default class Cursors extends Plugin {
  constructor(pn, opts) {
    super();

    const container = d3.select(pn.container);
    this._pn = pn;

    pn.on('item:focus', this._toggle, {
      container, state: true
    });
    pn.on('item:blur', this._toggle, {
      container, state: false
    });
  }

  unplug() {
    this._pn
      .removeListener('item:focus', this._toggle)
      .removeListener('item:blur', this._toggle);
    this._pn = null;
  }

  _toggle() {
    this.container.classed('item-focused', this.state);
  }
}

setGlobally(Cursors);
