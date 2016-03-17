import TWEEN from 'tween.js';

export default class Tween {
  constructor(pn, opts) {
    pn.on('frame', TWEEN.update.bind(TWEEN));
  }
}
