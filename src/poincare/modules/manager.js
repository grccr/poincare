import Module from './base';

const debug = require('debug')('poincare:manager');

export default class Manager extends Module {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      color: '#F1D0F5',
      width: 0
    }, opts || {});

    this._pn = pn;
    this._core = pn.core;
    pn.on('core:init', this._init, this);
    //pn.on('core:update', this._clear, this);
  }

  _init() {
    
  }

  color(id) {
    const isLink = this._core.hasLink(id),
      isNode = this._core.hasNode(id);
    if(isLink) {
      const isLinkClassifier = this._pn.plugins.linkclassifier.options.show;
      if(isLinkClassifier) {
        return this._pn.plugins.linkclassifier.color(id);
      }
      const getter = this._pn._options.links.color; 
      if(getter) {
        return getter(this._core.link(id).data);
      }
      return this._options.color;
    }
    return null;
  }

  width(id) {
    const isLink = this._core.hasLink(id);
    if(isLink) {
      const isLinkClassifier = this._pn.plugins.linkclassifier.options.show;
      if(isLinkClassifier) {
        return this._pn.plugins.linkclassifier.width(id);
      }
      const getter = this._pn._options.links.width; 
      if(getter) {
        return getter(this._core.link(id).data);
      }
      return this._options.width;
    }
    return null;
  }


}