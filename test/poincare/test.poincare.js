// import '../helpers/browser';

import { expect } from 'chai';
import nGraph from 'ngraph.graph';
import Poincare from '../../src/poincare';
import { IconSpriteGenerator, SpriteManager } from '../../src/poincare/core';
import { venn, fieldGetter } from '../../src/poincare/helpers';
import { calcLinePoints } from '../../src/poincare/plugins/radius';
// import PIXI from 'pixi.js';
import sinon from 'sinon';

const ICON = require('../../assets/icons/uxpin/uxpin-icon-set_world.png');
const ICON_TWO = require('../../assets/icons/uxpin/uxpin-icon-set_star.png');

describe('Poincare options', () => {
  it('converts constants to getters', () => {
    const pn = new Poincare({
      nodeView: 'cucumber',
      icons: {
        source: 'cocoo.png',
        size: 32
      }
    });
    const options = pn.options();
    expect(options.nodeView).to.be.a('function');
    expect(options.nodeView()).to.equal('cucumber');
    expect(options.icons.size).to.be.a('function');
    expect(options.icons.size()).to.equal(32);
    expect(options.icons.source()).to.equal('cocoo.png');
  });

  it('converts colors from html to number', () => {
    const pn = new Poincare({ background: 'black' });
    expect(pn.options().background).to.equal(0x000000);
    pn.options({ background: 'red' });
    expect(pn.options().background).to.equal(0xFF0000);
  });

  it('supports passing functions as getters', () => {
    const pn = new Poincare({ nodeView: node => node * 2 });
    const nodeView = pn.options().nodeView;
    expect(nodeView).to.be.a('function');
    expect(nodeView(2)).to.equal(4);
  });

  it('supports runtime options update', () => {
    const pn = new Poincare({ nodeView: 'hello' });
    expect(pn.options().nodeView()).to.equal('hello');
    pn.options({ nodeView: 'bye' });
    expect(pn.options().nodeView()).to.equal('bye');
  });
});

describe('Poincare graph interface', () => {
  it('sets new empty graph', () => {
    const pn = new Poincare();
    const g = pn.graph();
    expect(g).to.be.a('object');
    expect(g).to.contain.all.keys('addNode', 'addLink');
  });

  it('supports graph change', () => {
    const pn = new Poincare();
    const g = pn.graph();
    const ng = new nGraph();
    pn.graph(ng);
    expect(pn.graph()).to.not.equal(g);
    expect(pn.graph()).to.equal(ng);
  });
});

describe('Poincare container deployment', () => {
  it('pickups container', () => {
    const pn = new Poincare({ container: 'body' });
    expect(pn.size()).to.be.an('array');
  });
});

describe('Poincare layouts', () => {
  it('creates layout', () => {
    const pn = new Poincare({ layout: 'force' });
    expect(pn.layout()).not.to.be.empty;
    expect(pn.layout()).to.contain.all.keys('fire');
  });

  it('does not create unknown layout', () => {
    const pn = () => new Poincare({ layout: 'boo' });
    expect(pn).to.throw(Error);
  });
});

describe('Icon sprite generator', () => {
  it('can generate sprites and hashes', () => {
    const icon = IconSpriteGenerator(null, {
      source: () => ICON,
      size: () => 16
    });
    const i = icon();
    expect(i).to.be.an('array');
    expect(i).to.have.length(2);
    const [hash, sprite] = i;
    expect(hash).to.equal('8f92d76767ef1e930a455d66a54377aa');
    // console.log(sprite);
    // console.log(PIXI.Sprite);
    expect(sprite).to.be.an('object');
    expect(sprite).to.contain.all.keys('position');
  });

  it('generates different sprites for different nodes', () => {
    const icon = IconSpriteGenerator(null, {
      source: (n) => n === 'x' ? ICON : ICON_TWO,
      size: () => 16
    });

    const y = icon();
    const x = icon('x');

    expect(x).to.have.length(2);
    expect(y).to.have.length(2);
    expect(x[0]).not.to.be.empty;
    expect(y[0]).not.to.be.empty;
    expect(y[0]).to.not.equal(x[0]);
  });
});

describe('Sprite manager', () => {
  it('creates sprites', () => {
    const parent = { addChild: sinon.spy() };
    const sm = new SpriteManager(parent, null, {
      nodeView: () => 'icons',
      icons: {
        source: () => ICON,
        size: () => 16
      }
    });
    const sprite = sm.create('data');
    expect(sprite).to.be.an('object');
    expect(parent.addChild.called).to.be.true;
  });

  it('throws error if view is not supported', () => {
    const parent = { addChild: sinon.spy() };
    const sm = new SpriteManager(parent, null, {
      nodeView: () => 'heh'
    });
    const pn = () => sm.create('data');
    expect(pn).to.throw(Error);
  });

  it('creates identical containers for identical icons', () => {
    const parent = { addChild: sinon.spy() };
    const sm = new SpriteManager(parent, null, {
      nodeView: () => 'icons',
      icons: {
        source: () => ICON,
        size: () => 16
      }
    });
    const spriteA = sm.create();
    const spriteB = sm.create();
    expect(spriteA).not.to.be.empty;
    expect(spriteB).not.to.be.empty;
    expect(spriteA).to.not.equal(spriteB);
    expect(spriteA.parent).to.equal(spriteB.parent);
    expect(spriteA._texture).to.equal(spriteB._texture);
  });

  it('creates different containers for different icons', () => {
    const parent = { addChild: sinon.spy() };
    const sm = new SpriteManager(parent, null, {
      nodeView: () => 'icons',
      icons: {
        source: (d) => d === 'x' ? ICON_TWO : ICON,
        size: () => 16
      }
    });
    const spriteA = sm.create('x');
    const spriteB = sm.create();
    const spriteC = sm.create();
    expect(spriteA).not.to.be.empty;
    expect(spriteB).not.to.be.empty;
    expect(spriteA).to.not.equal(spriteB);
    expect(spriteA.parent).to.not.equal(spriteB.parent);
    expect(spriteA._texture).to.not.equal(spriteB._texture);
    expect(spriteB._texture).to.equal(spriteC._texture);
  });
});

describe('Poincare real usage', () => {
  it('works with nodes', () => {
    const pn = new Poincare({
      container: 'body',
      background: 'black',
      transparent: true,
      nodeView: 'icons',
      icons: {
        source: ICON,
        size: 16
      }
    });

    const ng = new nGraph();
    ng.addNode('a', { x: 'A' });
    ng.addNode('b', { x: 'B' });

    pn.graph(ng);
  });
});

describe('Helpers', () => {
  it('Venn works', () => {
    const info = venn([1, 2, 3], [4, 5, 6, 3]);

    expect(info).to.contain.all.keys('added', 'removed');
    expect(info.added).to.deep.equal([4, 5, 6]);
    expect(info.removed).to.deep.equal([1, 2]);
  });

  it('fieldGetter just works', () => {
    const data = { x: 10 };
    const getter = fieldGetter('x');
    expect(getter(data)).to.equal(10);
  });

  it('fieldGetter works with depth > 1', () => {
    const data = { f: { z: 100, a: { b: 'x' } } };
    expect(fieldGetter('f.z')(data)).to.equal(100);
    expect(fieldGetter('f.a.b')(data)).to.equal('x');
  });

  it('fieldGetter throws errors', () => {
    const data = { f: { z: 100, a: { b: 'x' } } };
    expect(fieldGetter('f.a.x')(data)).to.be.undefined;
    expect(() => fieldGetter('f.n.l')(data)).to.throw(TypeError);
  });
});

// describe('Radius plugin', () => {
//   it('calcLinePoints works as expected', () => {
//     const line = {
//       from: { x: 0,  y: 0 },
//       to:   { x: 90, y: 90 }
//     };
//     const points = calcLinePoints(line);
//     expect(points).to.be.an('array');
//     expect(points).not.to.be.empty;
//     expect(points).to.deep.equal([[22.5, 22.5], [45, 45], [67.5, 67.5]]);
//   });

//   it('calcLinePoints returns middle point if too small', () => {
//     const line = {
//       from: { x: 0,  y: 0 },
//       to:   { x: 10, y: 10 }
//     };
//     const points = calcLinePoints(line, 20);
//     expect(points).to.be.an('array');
//     expect(points).not.to.be.empty;
//     expect(points).to.deep.equal([[5, 5]]);
//   });
// });
