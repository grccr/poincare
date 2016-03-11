// import '../helpers/browser';

import { expect } from 'chai';
import nGraph from 'ngraph.graph';
import Poincare from '../../src/poincare';
import { IconSpriteGenerator } from '../../src/poincare/core';
import PIXI from 'pixi.js';
import sinon from 'sinon';

describe('Poincare options', () => {
  it('convert constants to getters', () => {
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
    const icon = IconSpriteGenerator({
      source: () => require('../../assets/icons/uxpin/uxpin-icon-set_world.png'),
      size: () => 16
    });
    const i = icon();
    expect(i).to.be.an('array');
    expect(i).to.have.length(2);
    const [hash, sprite] = i;
    expect(hash).to.equal('21ba74630df86998038878947906e096');
    // console.log(sprite);
    // console.log(PIXI.Sprite);
    expect(sprite).to.be.an('object');
    expect(sprite).to.contain.all.keys('position');
  });

  it('generates different sprites for different nodes', () => {
    const icon = IconSpriteGenerator({
      source: () => require('../../assets/icons/uxpin/uxpin-icon-set_world.png'),
      size: (n) => n === 'x' ? 16 : 32
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

describe('SpriteManager', () => {
  it('creates sprites', () => {
    const mock = sinon.mock({
      addChild() { }
    });
    // const sm = new SpriteManager(mock, {

    // });
  });
});
