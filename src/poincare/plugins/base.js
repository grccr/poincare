import { PoincareCoreError } from '../core';

export class Plugin {

  _destroyMethods() {
    const proto = Object.getPrototypeOf(this);
    for (const m of Object.getOwnPropertyNames(proto))
      if ('constructor' !== m && 'function' === typeof proto[m])
        this[m] = () => {
          throw new PoincareCoreError(
            `${proto.constructor.name} plugin instance was destroyed ` +
            `thus \`${m}\` method can't be called`
          );
        };
  }
}

Plugin.priority = Infinity;

export function setGlobally(plugin, name) {
  if (typeof window !== 'undefined') {
    if (window.poincare == null)
      window.poincare = {};
    if (window.poincare.plugins == null)
      window.poincare.plugins = {};
    window.poincare.plugins[name || plugin.name] = plugin;
  }
}

setGlobally(Plugin);
