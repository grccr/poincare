// 'use strict';

import graphlib from 'graphlib';
import Options from './options';
// import DagreLayout from './layouts/dagre';

export default class Poincare {
  constructor(opts = {}) {
    this._options = Options.defaults;
    this.options(opts);
  }

  options(opts) {
    if (opts != null) {
      this._options = Options.merge(this._options, opts);
    }
    return this._options;
  }
}
