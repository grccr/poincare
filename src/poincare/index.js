import Poincare from './poincare.js';
import { PoincareError } from './poincare.js';
import { version } from '../../package.json';


if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  window.poincare.Poincare = Poincare;
  window.poincare.PoincareError = PoincareError;

  window.poincare.env = process.env.NODE_ENV;
  window.poincare.version = version;
}

export default Poincare;
export { PoincareError };
