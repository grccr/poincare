import { Module } from '../modules';

export class Plugin extends Module {
	update() {}
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
