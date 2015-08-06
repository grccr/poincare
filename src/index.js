let two = require('two.js/build/two.clean');
let renderer = require('./lib/renderer');

exports.test = window.TEST = () => {
  let two = new Two({
    fullscreen: true,
    autostart: true
  });

  console.log('AHTUNG!!!!');

  two.appendTo(document.body);
  renderer.execute('HI THERE!!!');
}