import './cursors.less';
import Plugin from '../base';
import d3 from 'd3';

export default class Cursors extends Plugin {
  constructor(pn, opts) {
    super();

    const container = d3.select(pn.container());
    pn.on('itemfocus', () => {
      container.classed('item-focused', true);
    });
    pn.on('itemblur', () => {
      container.classed('item-focused', false);
    });
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Cursors = Cursors;
}
