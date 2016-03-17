import { fieldGetter } from '../helpers';
import template from 'lodash/template';

export default class Labels {
  constructor(pn, opts) {
    this._options = Object.assign({
      template: '<b><%- label %></b>',
      labelGetter: 'label'
    }, opts || {});
    this._pn = pn;
    if (typeof this._options.labelPath !== 'function')
      this._options.labelGetter = fieldGetter(this._options.labelGetter);
  }
}
