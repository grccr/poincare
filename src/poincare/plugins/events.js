import d3 from 'd3';
import throttle from 'lodash/throttle';
import { setGlobally, Plugin } from './base';

const debug = require('debug')('poincare:events');

export default class Events extends Plugin {
  constructor(pn, opts) {
    super();
    this._options = Object.assign({
      mouseRadius: 20
    }, opts || {});
    this._pn = pn;

    this._throttledFind = throttle(this._findNearestObjects.bind(this), 20);
    this._focusedItem = null;

    this._installMouseHandlers();
  }

  unplug() {
    d3.select(this._pn.container)
      .on('mousemove.events', null)
      .on('click.events', null)
      .on('contextmenu.events', null)
      .on('mousedown.events', null)
      .on('mouseup.events', null);

    this._throttledFind = null;
    this._pn = null;
  }

  _installMouseHandlers() {
    const container = this._pn.container;

    d3.select(container)
      .on('mousemove.events', () => {
        const position = d3.mouse(container);
        this._throttledFind(position);
        this._pn.emit(
          'mousemove',
          d3.event
        );
      })
      .on('click.events', () => {
        debug('CLICK');
        if (d3.event.defaultPrevented)
          return;
        if (this._focusedItem != null) {
          d3.event.stopImmediatePropagation();
          this._pn.emit(
            `${this._focusedItem.type}:click`,
            this._focusedItem.id,
            d3.event
          );
          return false;
        }
      })
      .on('contextmenu.events', () => {
        debug('CONTEXTMENU');
        if (d3.event.defaultPrevented)
          return;
        if (this._focusedItem != null) {
          // d3.event.stopImmediatePropagation();
          d3.event.preventDefault();
          this._pn.emit(
            `${this._focusedItem.type}:menu`,
            this._focusedItem.id,
            d3.event
          );
          return false;
        }
      })
      .on('mousedown.events', () => {
        debug('MOUSEDOWN');
        if (this._focusedItem != null) {
          d3.event.stopImmediatePropagation();
          this._pn.emit(
            `${this._focusedItem.type}:mousedown`,
            this._focusedItem.id,
            d3.event
          );
          return false;
        }
      })
      .on('mouseup.events', () => {
        debug('MOUSEUP');
        this._pn.emit(
          'mouseup',
          d3.event
        );
      });
  }

  _findNearestObjects(pos) {
    const pn = this._pn;
    const graphPos = pn.zoom.containerToGraphPoint(pos);
    // debug('MOVE', pos, graphPos);
    const s = pn.zoom.scale();
    const mouseRadius = this._options.mouseRadius;
    const r = s > 1 ? mouseRadius / s : mouseRadius * s;

    const nearestNode = pn.radius.nearest(graphPos, r);
    const nearestLine = pn.lineindex.nearest(graphPos, r);
    let nearest = null;

    if (nearestNode)
      nearest = { id: nearestNode, type: 'node' };
    else if (nearestLine)
      nearest = { id: nearestLine, type: 'link' };

    // if (nearest)
      // debug('nearest', nearest);

    const focused = this._focusedItem;


    if (nearest == null && focused == null)
      return;

    if (nearest == null && focused != null) {
      pn.emit(`${focused.type}:out`, focused.id);
      pn.emit('item:blur');
    } else if (nearest != null && focused == null) {
      pn.emit(`${nearest.type}:over`, nearest.id);
      pn.emit('item:focus');
    } else if (nearest.id !== focused.id ||
               nearest.type !== focused.type) {
      pn.emit(`${focused.type}:out`, focused.id);
      pn.emit(`${nearest.type}:over`, nearest.id);
    }

    // debug(focused && focused.id, nearest && nearest.id);

    this._focusedItem = nearest;

    // const blured = (nearest == null &&
    //                 this._focusedItem != null);
    // const switched = (nearest != null &&
    //                   this._focusedItem != null &&
    //                   nearest.id != this._focusedItem.id &&
    //                   nearest.type != this._focusedItem.type);
    // const found = !blured && !switched;
    // const f = this._focusedItem && this._focusedItem.id;
    // const n = nearest && nearest.id;

    // if (n == f && n != null && nearest.type != this._focusedItem.type) {
    //   pn.emit(`${this._focusedItem.type}:out`, this._focusedItem.id);
    //   this._focusedItem = nearest;
    //   pn.emit(`${this._focusedItem.type}:in`, this._focusedItem.id);
    // } else if (n == null && f != null) {
    //   // we're out of any node / link
    //   pn.emit(`${this._focusedItem.type}:out`, this._focusedItem.id);
    //   this._focusedItem = null;
    // } else if (n !== f) {
    //   // we're on node
    //   if (f != null) // but moved from other node / link
    //     pn.emit(`${this._focusedItem.type}:out`, this._focusedItem.id);
    //   this._focusedItem = nearest;
    //   pn.emit(`${this._focusedItem.type}:in`, this._focusedItem.id);
    // }
  }
}

Events.priority = 0;

setGlobally(Events);
