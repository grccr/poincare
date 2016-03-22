import Poincare from './poincare.js';
import { PoincareError } from './poincare.js';


if (typeof window !== 'undefined') {
  if (window.poincare == null)
    window.poincare = {};
  window.poincare.Poincare = Poincare;
  window.poincare.PoincareError = PoincareError;
}

export default Poincare;
export { PoincareError };
