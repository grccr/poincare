import { PoincareError } from '../poincare';

export default class Module {

  _destroyMethods() {
    const proto = Object.getPrototypeOf(this);
    const _baseProtoName = Object.getPrototypeOf(proto).constructor.name;
    const baseProtoName = _baseProtoName !== proto.constructor.name
      ? `${_baseProtoName.toLowerCase()} ` : '';

    for (const m of Object.getOwnPropertyNames(proto))
      if ('constructor' !== m && 'function' === typeof proto[m])
        this[m] = () => {
          throw new PoincareCoreError(
            `${proto.constructor.name} ${baseProtoName}` +
            `instance was destroyed thus \`${m}\` method can't be called`
          );
        };
  }
}
