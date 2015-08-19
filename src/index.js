// 'use strict';

// import 'babel/polyfill';

import graphlib from 'graphlib';
import superagent from 'superagent';
import superagentPromise from 'superagent-promise';
const request = superagentPromise(superagent, Promise);

import Ashberry from './lib/ashberry';
import GraphMLParser from './lib/parsers/graphml';

// Some expositions for testing purposes only
window.graphlib = graphlib;

if (document !== undefined)
  window.addEventListener('load', () => {
    let ash = new Ashberry({
      element: document.body
    });

    request.get('/data/estoniia.graphml')
      .then(({ok, text}) => {
        if (ok) {
          console.log('Doc received', text !== '');
          let graph = GraphMLParser.parse(text);
          ash.load(graph);
          ash.render();
        }
      });

  });