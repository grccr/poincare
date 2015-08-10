'use strict';

let Ashberry = require('./lib/ashberry').Ashberry;
let request = require('superagent-promise')(require('superagent'), Promise);
let GraphMLParser = require('./lib/parsers/graphml');

// Some expositions for testing purposes only
window.graphlib = require('graphlib');

if (document !== undefined)
  window.addEventListener('load', () => {
    let ash = new Ashberry({
      element: document.body
    });

    request.get('/data/test.graphml')
      .then(res => {
        if (res.ok) {
          console.log('Doc received', res.text !== '');
          let graph = GraphMLParser.parse(res.text);
          ash.load(graph);
          ash.render();
        }
      });

  });