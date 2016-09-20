import d3 from 'd3';
import debounce from 'lodash/debounce';
import { setGlobally, Plugin } from './base';

export default class AutoResize extends Plugin {
  constructor(pn, opts) {
    super();
    d3.select(window).on('resize.view', debounce(() => {
      pn.updateDimensions();
    }, 100));
  }

  unplug() {
    d3.select(window).on('resize.view', null);
  }
}

setGlobally(AutoResize);
