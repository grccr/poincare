'use strict';

import graphlib from 'graphlib';
import merge from 'lodash/merge';
import d3 from 'd3';

export default class GraphMLParser {
  constructor(doc, options = {}) {
    // Prepare type converters
    // According to http://graphml.graphdrawing.org/xmlns/1.1/graphml.xsd
    // datatypes is int, long, float, double, string, boolean

    this._options = merge({
      idLabel: 'v',
      sourceLabel: 'v',
      targetLabel: 'w'
    }, options);

    const tc = this._typeConverters = {
      float: parseFloat,
      int: x => parseInt(x, 10),
      string: x => x,
      boolean(x) {
        if (typeof x === 'string')
          return x.toLowerCase() !== 'false';
        return Boolean(x);
      }
    };
    tc.long = tc.double = tc.float;

    // Choose XML parser
    if (window.DOMParser !== undefined)
      this._parseXml = (xmlStr) => {
        return (new window.DOMParser()).parseFromString(xmlStr, 'text/xml');
      };
    else if (window.ActiveXObject !== undefined &&
               new window.ActiveXObject('Microsoft.XMLDOM'))
      this._parseXml = (xmlStr) => {
        var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
        xmlDoc.async = 'false';
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
      };
    else
      throw new Error('No XML parser found');

    this.doc = typeof doc === 'string' ? this._parseXml(doc) : doc;
  }

  _parseDataFields($elem, type, scope = false) {
    const data = {};
    const nm = this._nameMap[type];
    const selector = scope ? ':scope > data' : 'data';

    $elem.selectAll(selector).each(function iterate(d, i) {
      const $this = d3.select(this);
      const k = $this.attr('key');
      const nameField = nm[k];
      // Parse according to key name and type declaration
      if (nameField)
        data[nameField[0]] = nameField[1]($this.text());
      else
        data[k] = $this.text();
    });
    return data;
  }

  _makeNode(elem) {
    const $elem = d3.select(elem);
    const data = this._parseDataFields($elem, 'node');
    return {
      [this._options.idLabel]: $elem.attr('id'),
      value: data
    };
  }

  _makeEdge(elem) {
    const $elem = d3.select(elem);
    const data = this._parseDataFields($elem, 'edge');

    return {
      [this._options.idLabel]: $elem.attr('id'),
      [this._options.sourceLabel]: $elem.attr('source'),
      [this._options.targetLabel]: $elem.attr('target'),
      value: data
    };
  }

  _getNameMap(root) {
    const map = { node: {}, edge: {}, graph: {} };
    const tc = this._typeConverters;
    root.selectAll('key').each(function iterate() {
      const $key = d3.select(this);
      const val = [
        $key.attr('attr.name'),
        tc[$key.attr('attr.type')] || tc.string, $key.attr('attr.type')
      ];
      map[$key.attr('for')][$key.attr('id')] = val;
    });
    return map;
  }

  getKeys() {
    const keys = this._getNameMap(d3.select(this.doc));
    keys.node = d3.values(keys.node).map(item => {
      return { name: item[0], type: item[2] };
    });
    keys.edge = d3.values(keys.edge).map((item) => {
      return { name: item[0], type: item[2] };
    });
    return keys;
  }

  _makeGraph(elem) {
    const $elem = d3.select(elem);
    return this._parseDataFields($elem, 'graph', true);
  }

  toJson() {
    const root = d3.select(this.doc);
    const graph = {};
    this._nameMap = this._getNameMap(root);
    graph.nodes = root.selectAll('node')[0].map(elem => this._makeNode(elem));
    graph.edges = root.selectAll('edge')[0].map(elem => this._makeEdge(elem));
    graph.value = this._makeGraph(root.select('graph').node());
    graph.options = {
      directed: root.select('graph').attr('edgedefault') === 'directed'
    };

    return graph;
  }

  toGraph() {
    const json = this.toJson();
    return graphlib.json.read(json);
  }

  static parse(doc, opts = {}) {
    return new GraphMLParser(doc, opts).toGraph();
  }
}
