import d3 from 'd3';
import debounce from 'lodash/debounce';
import Plugin from './base';

export default class AutoResize extends Plugin {
  constructor(pn, opts) {
    super();
    d3.select(window).on('resize', debounce(() => {
      pn.updateDimensions();
    }, 100));
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.AutoResize = AutoResize;
}
