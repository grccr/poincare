import './cursors.less';
import Plugin from '../base';

export default class Cursors extends Plugin {
  constructor(pn, opts) {
    super();

    const container = d3.select(pn.container());
    pn.on('nodeover', () => {
      container.classed('nodeover', true);
    });
    pn.on('nodeout', () => {
      container.classed('nodeover', false);
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
