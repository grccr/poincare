import d3 from 'd3';
import merge from 'lodash/merge';
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

    nodeView: 'icon',

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
    }
  },

  check(v) {
    return typeof v !== 'function' ? constant(v) : v;
  },

  css2pixi(color) {
    if (typeof color === 'number')
      return color;
    const clr = d3.rgb(color);
    const hp = x => Math.pow(16, x);
    return clr.r * hp(4) + clr.g * hp(2) + clr.b;
  },

  merge(current, newOpts) {
    const options = merge(current, newOpts);
    return Options._convertConstants(options);
  },

  _convertConstants(opts) {
    const check = Options.check;
    const css2pixi = Options.css2pixi;
    const convertable = {
      icons: {
        background: css2pixi(opts.background),
        source: check(opts.icons.source),
        size: check(opts.icons.size)
      },
      nodeView: check(opts.nodeView)
    };
    return merge(opts, convertable);
  }
};

export default Options;
