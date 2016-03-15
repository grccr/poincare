import d3 from 'd3';

export function css2pixi(color) {
  if (typeof color === 'number')
    return color;
  const clr = d3.rgb(color);
  const hp = x => Math.pow(16, x);
  return clr.r * hp(4) + clr.g * hp(2) + clr.b;
}
