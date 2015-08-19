'use strict';

import graphlib from 'graphlib';
import merge from 'lodash/object/merge';
import d3 from 'd3';

export default class GraphMLParser {
  constructor(doc, options={}) {
    // Prepare type converters
    // According to http://graphml.graphdrawing.org/xmlns/1.1/graphml.xsd
    // datatypes is int, long, float, double, string, boolean

    this._options = merge({
      idLabel: 'v',
      sourceLabel: 'v',
      targetLabel: 'w'
    }, options);

    let tc = this._typeConverters = {
      float: parseFloat,
      int: function (x) { return parseInt(x, 10); },
      string: function (x) { return x; },
      boolean: function (x) {
        if (typeof x === 'string')
          return x.toLowerCase() === 'false' ? false : true;
        return Boolean(x);
      }
    };
    tc.long = tc.double = tc.float;

    // Choose XML parser
    if (window.DOMParser !== undefined)
      this._parseXml = function(xmlStr) {
        return (new window.DOMParser()).parseFromString(xmlStr, 'text/xml');
      };
    else if (window.ActiveXObject !== undefined &&
               new window.ActiveXObject('Microsoft.XMLDOM'))
      this._parseXml = function(xmlStr) {
        var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
        xmlDoc.async = 'false';
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
      };
    else
      throw new Error('No XML parser found');

    this.doc = typeof doc === 'string' ? this._parseXml(doc) : doc;
  }

  _parseDataFields($elem, type, scope=false) {
    let data = {};
    let nm = this._nameMap[type];
    let selector = scope ? ':scope > data' : 'data';

    $elem.selectAll(selector).each(function (d, i) {
      let $this = d3.select(this);
      let k = $this.attr('key');
      let nameField = nm[k];
      // Parse according to key name and type declaration
      if (nameField)
        data[nameField[0]] = nameField[1]($this.text());
      else
        data[k] = $this.text();
    });
    return data;
  }

  _makeNode(elem) {
    let $elem = d3.select(elem);
    let data = this._parseDataFields($elem, 'node');
    return {
      [this._options.idLabel]: $elem.attr('id'),
      value: data
    };
  }

  _makeEdge(elem) {
    let $elem = d3.select(elem);
    let data = this._parseDataFields($elem, 'edge');

    return {
      [this._options.idLabel]: $elem.attr('id'),
      [this._options.sourceLabel]: $elem.attr('source'),
      [this._options.targetLabel]: $elem.attr('target'),
      value: data
    };
  }

  _getNameMap(root) {
    let map = { node: {}, edge: {}, graph: {} };
    let tc = this._typeConverters;
    root.selectAll('key').each(function () {
      let $key = d3.select(this);
      let val = [$key.attr('attr.name'), tc[$key.attr('attr.type')] || tc.string, $key.attr('attr.type')];
      map[$key.attr('for')][$key.attr('id')] = val;
    });
    return map;
  }

  getKeys() {
    let keys = this._getNameMap(d3.select(this.doc));
    keys.node = d3.values(keys.node).map(function (item) {
      return { name: item[0], type: item[2] };
    });
    keys.edge = d3.values(keys.edge).map(function (item) {
      return { name: item[0], type: item[2] };
    });
    return keys;
  }

  _makeGraph(elem) {
    let $elem = d3.select(elem);
    return this._parseDataFields($elem, 'graph', true);
  }

  toJson() {
    let root = d3.select(this.doc);
    let graph = {};
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
    let json = this.toJson();
    console.log('JSON IS', json);
    return graphlib.json.read(json);
  }

  static parse(doc, opts={}) {
    return new GraphMLParser(doc, opts).toGraph();
  }
}

// GraphML parser helper
export let parseGraphML = function (doc) {
  var graph = exports.GraphMLParser(doc);
  return graph.toGraph();
};