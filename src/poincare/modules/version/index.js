import d3 from 'd3';
import Module from '../base';
import { version } from '../../../../package.json';

import './version.less';

const classes = 'poincare-control poincare-control-version';

export default class VersionControl extends Module {
  constructor(pn, opts) {
    super();
    d3.select(pn.container).append('div')
      .classed(classes, true)
      .text(version);
  }

  destroy() {
    const selector = classes.split(' ').join('.');
    d3.select(`.${selector}`).remove();
  }
}
