import { PoincareError } from '../poincare';

export default class Module {

  _destroyMethods() {
    const proto = Object.getPrototypeOf(this);
    const _baseProtoName = Object.getPrototypeOf(proto).constructor.name;
    const baseProtoName = _baseProtoName !== proto.constructor.name ?
      `${_baseProtoName.toLowerCase()} ` : '';

    function throwError(methodName) {
      throw new PoincareError(
        `${proto.constructor.name} ${baseProtoName}` +
        `instance was destroyed thus \`${methodName}\` method can't be called`
      );
    }

    for (const m of Object.getOwnPropertyNames(proto))
      if ('constructor' !== m && 'function' === typeof proto[m])
        this[m] = throwError.bind(null, m);
  }
}
