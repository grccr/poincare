
import PIXI from 'pixi.js';

export default class Core {
  constructor(opts, container, dims) {
    const stage = new PIXI.Container();
    const group = new PIXI.Container();

    stage.addChild(group);

    const renderer = PIXI.autoDetectRenderer(dims[0], dims[1], {
      antialias: opts.antialias,
      backgroundColor: opts.background,
      transparent: opts.transparent
    });

    container.appendChild(renderer.view);

    const graphics = new PIXI.Graphics();
    group.addChild(graphics);
  }
}
