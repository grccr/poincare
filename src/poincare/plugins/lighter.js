import PIXI from 'pixi.js';
import TWEEN from 'tween.js';

import { css2pixi } from 'poincare/helpers';
import { Transitioner } from '../modules';
import { setGlobally, Plugin } from './base';

// const debug = require('debug')('poincare:lighter');

export default class Lighter extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      nodeColor: '#F2EF42',
      linkColor: pn.manager._options.color,
      fromWidth: 15,
      fromOpacity: 0,
      toWidth: 5,
      toOpacity: 0.3,
      radius: pn._options.nodes.radius
    }, opts || {});

    for (const opt of ['nodeColor', 'linkColor'])
      this._options[opt] = css2pixi(this._options[opt]);

    this._pn = pn;
    for (const gfx of ['_nodeGfx', '_linkGfx']) {
      this[gfx] = new PIXI.Graphics();
      this._pn.core.stage.addChildAt(this[gfx], 0);
    }

    this._initNodeTransitioner();
    this._initLinkTransitioner();
  }

  update(pn, opts) {
    Object.assign(this._options, opts || {});
    for (const opt of ['nodeColor', 'linkColor'])
      this._options[opt] = css2pixi(this._options[opt]);
  }
  
  unplug() {
    this._destroyMethods();
    this._nodetrans.destroy();
    this._linktrans.destroy();
    for (const gfx of ['_nodeGfx', '_linkGfx']) {
      this._pn.core.stage.removeChild(this[gfx]);
      this[gfx].destroy();
      this[gfx] = null;
    }
    this._nodetrans =
    this._linktrans =
    this._options =
    this._pn =
      null;
  }

  _initNodeTransitioner() {
    this._nodetrans = new Transitioner(this._pn)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .duration(250, 750)
      .from(() => ({ r: 26, opacity: 0 }))
      .to(() => ({ r: this._options.radius, opacity: 1 }))
      .beforeRendering(() => {
        this._nodeGfx.clear();
      })
      .render((id, prop, X, Y) => {
        const node = this._pn.core.node(id);
        this._nodeGfx.beginFill(this._options.nodeColor, prop.opacity);
        this._nodeGfx.drawCircle(
          X(node.pos.x),
          Y(node.pos.y),
          prop.r * this._pn.zoom.truncatedScale()
        );
      });
  }

  _initLinkTransitioner() {
    this._linktrans = new Transitioner(this._pn)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .duration(250, 750)
      .from((id) => ({ 
        opacity: this._options.fromOpacity, 
        width: this._pn.manager.width(id) + this._options.fromWidth
      }))
      .to((id) => ({ 
        opacity: this._options.toOpacity, 
        width: this._pn.manager.width(id) + this._options.toWidth 
      }))
      .beforeRendering(() => {
        this._linkGfx.clear();
      })
      .render((id, prop, X, Y) => {
        const ln = this._pn.core.link(id);
        this._linkGfx.lineStyle(
          prop.width * this._pn.zoom.truncatedScale(),
          css2pixi(this._pn.manager.color(id)),
          prop.opacity
        );
        this._linkGfx.moveTo(X(ln.from.x), Y(ln.from.y));
        this._linkGfx.lineTo(X(ln.to.x), Y(ln.to.y));
      });
  }

  lightNodes(nodeIds) {
    const core = this._pn.core;
    const realIds = nodeIds.filter(id => core.hasNode(id));
    this._nodetrans.transition(realIds);
  }

  lightLinks(linkIds) {
    const core = this._pn.core;
    const realIds = linkIds.filter(id => core.hasLink(id));
    this._linktrans.transition(realIds);
  }
}

setGlobally(Lighter);
