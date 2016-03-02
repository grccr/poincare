import { expect } from 'chai';
import Poincare from '../../src/poincare';

describe('Poincare instantiation', () => {
  it('all default options are created', () => {
    const pn = new Poincare();
    const options = pn.options();
    expect(options.nodeView).to.be.a.function();
  });
});
