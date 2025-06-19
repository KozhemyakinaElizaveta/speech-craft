import { ShapeType } from "../types/shapes";
import type { Shape } from "../types/shapes";
import { IStorage } from "../types/storage";
import { Renderer } from "./renderer";

export class FiguresController {
  private canvas: HTMLCanvasElement;
  private storage: IStorage;

  constructor(canvasId: string, storage: IStorage) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }
    this.storage = storage;
  }

  public addShape(type: ShapeType, color: string): Shape {
    const getRandomSize = () => Math.floor(Math.random() * (150 - 20 + 1)) + 20;
    const getRandomPosition = (max: number) => Math.floor(Math.random() * max);

    const baseShape = {
      id: crypto.randomUUID(),
      type,
      x: getRandomPosition(this.canvas.width),
      y: getRandomPosition(this.canvas.height),
      color,
      selected: false,
    };

    let newShape: Shape;

    switch (type) {
      case ShapeType.CIRCLE:
        newShape = {
          ...baseShape,
          type: ShapeType.CIRCLE,
          radius: getRandomSize(),
        };
        break;
      case ShapeType.SQUARE:
        newShape = {
          ...baseShape,
          type: ShapeType.SQUARE,
          size: getRandomSize(),
        };
        break;
      case ShapeType.RECTANGLE:
        newShape = {
          ...baseShape,
          type: ShapeType.RECTANGLE,
          width: getRandomSize(),
          height: getRandomSize(),
        };
        break;
      case ShapeType.TRIANGLE:
        newShape = {
          ...baseShape,
          type: ShapeType.TRIANGLE,
          base: getRandomSize(),
          height: getRandomSize(),
        };
        break;
    }

    const shapes = this.storage.read("shapes") || [];
    this.storage.write("shapes", [...shapes, newShape]);

    const renderer = new Renderer("canvas", this.storage);
    renderer.render(this.storage.read("shapes"));

    return newShape;
  }

  public deleteLastShape(): void {
    const shapes = this.storage.read("shapes") || [];
    if (shapes.length > 0) {
      shapes.pop();
      this.storage.write("shapes", shapes);

      const renderer = new Renderer("canvas", this.storage);
      renderer.render(this.storage.read("shapes"));
    }
  }
}