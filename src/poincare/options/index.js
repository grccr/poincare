import d3 from 'd3';
import merge from 'lodash/merge';

import Events from '../plugins/zoom';
import Zoom from '../plugins/events';
import VersionControl from '../plugins/version';

import { css2pixi } from '../helpers';

const worldIcon = 'icon.png';

function constant(val) {
  return () => val;
}

const Options = {
  defaults: {
    container: 'body',
    layout: 'force',

    antialias: true,
    background: 'white',
    transparent: false,

    nodeView: 'icons',

    links: {
      color: '#CCC'
    },

    icons: {
      source: worldIcon,
      size: 16
    },

    physics: {
      springLength: 30,
      springCoeff: 0.0008,
      dragCoeff: 0.01,
      gravity: -1.2,
      theta: 1
    },

    plugins: [Events, Zoom, VersionControl]
  },

  check(v) {
    return typeof v !== 'function' ? constant(v) : v;
  },

  merge(current, newOpts) {
    const options = merge({}, current, newOpts);
    options.plugins = Options._mergePlugins(current.plugins,
                                            newOpts.plugins || []);
    return Options._convert(options);
  },

  _mergePlugins(current, newPlugins) {
    return new Set([...current, ...newPlugins]);
  },

  _convert(opts) {
    const check = Options.check;
    const convertable = {
      background: css2pixi(opts.background),
      links: {
        color: check(opts.links.color),
      },
      icons: {
        source: check(opts.icons.source),
        size: check(opts.icons.size)
      },
      nodeView: check(opts.nodeView)
    };
    return merge(opts, convertable);
  }
};

export default Options;
