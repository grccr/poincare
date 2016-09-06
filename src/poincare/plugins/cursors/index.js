import { setGlobally, Plugin } from '../base';
import d3 from 'd3';

import './cursors.less';

export default class Cursors extends Plugin {
  constructor(pn, opts) {
    super();

    const container = d3.select(pn.container);
    this._pn = pn;

    pn.on('itemfocus', this._toggle, {
      container, state: true
    });
    pn.on('itemblur', this._toggle, {
      container, state: false
    });
  }

  unplug() {
    this._pn
      .removeListener('itemfocus', this._toggle)
      .removeListener('itemblur', this._toggle);
    this._pn = null;
  }

  _toggle() {
    this.container.classed('item-focused', this.state);
  }
}

setGlobally(Cursors);
