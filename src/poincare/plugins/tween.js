import TWEEN from 'tween.js';
import Plugin from './base';

export default class Tween extends Plugin {
  constructor(pn, opts) {
    super();
    pn.on('frame', TWEEN.update.bind(TWEEN));
  }
}

if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  if (window.poincare.plugins == null)
    window.poincare.plugins = {};
  window.poincare.plugins.Tween = Tween;
}
