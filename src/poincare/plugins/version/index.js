import d3 from 'd3';
import debounce from 'lodash/debounce';
import Plugin from '../base';
import './version.less';
import { version } from '../../../../package.json';


export default class VersionControl extends Plugin {
  constructor(pn, opts) {
    super();
    d3.select(pn.container()).append('div')
      .classed('poincare-control poincare-control-version', true)
      .text(version);
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.VersionControl = VersionControl;
}
