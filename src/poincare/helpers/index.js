import d3 from 'd3';

export function css2pixi(color) {
  if (typeof color === 'number')
    return color;
  const clr = d3.rgb(color);
  const hp = x => Math.pow(16, x);
  return clr.r * hp(4) + clr.g * hp(2) + clr.b;
}

export function pol2dec(alpha, dist) {
  return [
    dist * Math.cos(alpha),
    dist * Math.sin(alpha)
  ];
}

export function venn(_old, _new) {
  const a = new Set(_old);
  const b = new Set(_new);
  const added = _new.filter(x => !a.has(x));
  // const total = [...(new Set([..._old, ..._new]))];
  // const common = _old.filter(x => b.has(x));
  const removed = _old.filter(x => !b.has(x));
  return { added, removed };
}

export function fieldGetter(path) {
  const compiled = path.split('.')
    .reduce((pv, cur) => {
      const x = pv.length - 1;
      if (!cur)
        pv[x] = `${pv[x]}.`;
      else if (x >= 0 && pv[x].slice(-1) === '.')
        pv[x] = pv[x] + cur;
      else
        pv.push(cur);
      return pv;
    }, [])
    .filter(Boolean)
    .map(p => `['${p}']`)
    .join('');
  // return new Function(
  //   'obj',
  //   'try { return obj' + compiled +
  //   '; } catch(e) { return null; }'
  // );
  return new Function('obj', `return obj${compiled};`);
}
