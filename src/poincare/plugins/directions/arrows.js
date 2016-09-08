
const ARROW_TYPES = {
  ACUTE:      'acute',
  EXPANDED:   'expanded',
  HORIZONTAL: 'horizontal',  // default
  TAPERED:    'tapered'
};

export default function arrowPolygonGenerator(t, w, h) {
  let coords = [];
  const a = w / 2;
  let b = 0;
  let c = 0;
  let d = 0;
  switch (t) {

    case ARROW_TYPES.ACUTE:
      b = h / 3 * 2;
      coords = [
        a, 0,
        w, h,
        a, b,
        0, h,
        a, 0
      ];
      break;

    case ARROW_TYPES.EXPANDED:
      b = h * 3 / 4;
      c = a * 3 / 2;
      d = c - a;
      coords = [
        a, 0,
        w, b,
        c, b,
        c, h,
        d, h,
        d, b,
        0, b,
        a, 0
      ];
      break;

    case ARROW_TYPES.TAPERED:
      b = h / 3 * 2;
      c = a * 3 / 2;
      d = c - a;
      coords = [
        a, 0,
        w, b,
        c, h,
        d, h,
        0, b,
        a, 0
      ];
      break;

    case ARROW_TYPES.HORIZONTAL:
    default:
      coords = [
        a, 0,
        w, h,
        0, h,
        a, 0
      ];
  }

  return coords;
}
