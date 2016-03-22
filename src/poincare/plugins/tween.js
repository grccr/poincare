import TWEEN from 'tween.js';

export default class Tween {
  constructor(pn, opts) {
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
