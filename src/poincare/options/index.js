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

  merge(current, newOpts) {
    const options = merge(current, newOpts);
    return Options._convertConstants(options);
  },

  _convertConstants(opts) {
    const check = Options.check;
    const convertable = {
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
