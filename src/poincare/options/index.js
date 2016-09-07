
import { LineIndex, Radius, Tween, VersionControl, Zoom } from '../modules';
import { Events } from '../plugins';
import { isFunction, merge } from 'lodash';
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

    plugins: [Events],

    _modules: [VersionControl, Zoom, Radius, LineIndex, Tween]
  },

  check(v) {
    return !isFunction(v) ? constant(v) : v;
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
    const check = this.check.bind(this);
    const convertable = {
      background: css2pixi(opts.background),
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
