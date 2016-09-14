import TWEEN from 'tween.js';
import Module from './base';
import { venn } from '../helpers';

const debug = require('debug')('poincare:transitioner');

export default class Tween extends Module {
  constructor(pn, opts) {
    super();
    this._pn = pn;
    pn.on('core:init', this._init, this);
    pn.on('core:clear', this._clear, this);
  }

  _init() {
    this._pn.on('view:frame', this._update, this);
  }

  _clear() {
    this._pn.removeListener('view:frame', this._update, this);
  }

  destroy() {
    this._pn.removeListener('core:clear', this._clear, this);
    this._pn.removeListener('core:init', this._init, this);
    this._clear();
    this._destroyMethods();
    this._pn = null;
  }

  _update(){
    TWEEN.update();
  }
}

export class Transitioner {
  constructor(pn) {
    this._pn = pn;
    this._current = [];
    this._props = {};
    this._tweens = {};

    this._duration = 250;
    this._easing = TWEEN.Easing.Linear.None;
    this._backEasing = this._easing;
    this._backDuration = this._duration;

    this._subscribed = false;
    this._bindedRender = this._render.bind(this);

    this._createTweenBinded = this._createTween.bind(this);
    this._rollbackTweenBinded = this._rollbackTween.bind(this);
  }

  render(renderCallback) {
    this._renderItem = renderCallback;
    return this;
  }

  from(prop) {
    this._initProp = prop;
    return this;
  }

  to(prop) {
    this._destProp = prop;
    return this;
  }

  easing(easing, back = null) {
    this._easing = easing;
    this._backEasing = back != null ? back : easing;
    return this;
  }

  duration(time, back = null) {
    this._duration = time;
    this._backDuration = back != null ? back : time;
    return this;
  }

  _removeTween(id) {
    debug('remove tween', id);
    this._tweens[id].stop();
    TWEEN.remove(this._tweens[id]);
  }

  _createTween(id) {
    if (id in this._tweens)
      this._removeTween(id);
    else
      this._props[id] = this._initProp();
    this._tweens[id] = new TWEEN.Tween(this._props[id])
      .to(this._destProp(), this._duration)
      .easing(this._easing)
      .start();
  }

  _removeProp(id) {
    delete this._props[id];
    delete this._tweens[id];
    if (Object.keys(this._props).length === 0)
      this._unsubscribe();
  }

  _rollbackTween(id) {
    this._removeTween(id);
    const tween = this._tweens[id] = new TWEEN.Tween(this._props[id])
      .easing(this._backEasing)
      .to(this._initProp(), this._backDuration)
      .onComplete(() => {
        if (tween !== this._tweens[id])
          return;
        this._removeProp(id);
      })
      .start();
  }

  _createNewTweens(ids) {
    if (ids.length > 0)
      ids.forEach(this._createTweenBinded);
  }

  _rollbackRemovedTweens(ids) {
    if (ids.length > 0)
      ids.forEach(this._rollbackTweenBinded);
  }

  _subscribe() {
    if (this._subscribed)
      return;
    this._pn.on('view:frame', this._bindedRender, this);
    this._subscribed = true;
    debug('Subscribed to rendering');
  }

  _unsubscribe() {
    if (!this._subscribed)
      return;
    this._subscribed = false;
    this._pn.off('view:frame', this._bindedRender, this);
    debug('Unsubscribed from rendering');
  }

  beforeRendering(clb) {
    this._beforeRendering = clb;
    return this;
  }

  _render() {
    const core = this._pn._core;
    const X = core.xScale;
    const Y = core.yScale;
    this._beforeRendering();
    Object.keys(this._props).forEach(key => {
      const prop = this._props[key];
      this._renderItem(key, prop, X, Y);
    });
  }

  transition(ids) {
    const subsets = venn(this._current, ids);
    this._current = ids;
    this._createNewTweens(subsets.added);
    this._rollbackRemovedTweens(subsets.removed);
    this._subscribe();
  }
}
