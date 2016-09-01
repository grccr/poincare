import d3 from 'd3';
import { setGlobally, Plugin } from '../base';
import './version.less';
import { version } from '../../../../package.json';

const classes = 'poincare-control poincare-control-version';

export default class VersionControl extends Plugin {
  constructor(pn, opts) {
    super();
    d3.select(pn.container()).append('div')
      .classed(classes, true)
      .text(version);
  }

  unplug() {
    const selector = classes.split(' ').join('.');
    d3.select(`.${selector}`).remove();
  }
}

setGlobally(VersionControl);
