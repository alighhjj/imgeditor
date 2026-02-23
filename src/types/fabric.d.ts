declare module 'fabric' {
  export class Canvas {
    constructor(element: HTMLCanvasElement | string | null, options?: any)
    width: number
    height: number
    backgroundColor: string | fabric.Pattern
    isDrawingMode: boolean
    freeDrawingBrush: fabric.BaseBrush | null
    
    add(...objects: fabric.Object[]): fabric.Canvas
    remove(...objects: fabric.Object[]): fabric.Canvas
    clear(): fabric.Canvas
    renderAll(): fabric.Canvas
    setWidth(value: number): fabric.Canvas
    setHeight(value: number): fabric.Canvas
    setActiveObject(object: fabric.Object): fabric.Canvas
    getActiveObject(): fabric.Object | null
    toDataURL(options?: { format?: string; quality?: number }): string
    dispose(): void
  }
  
  export namespace fabric {
    export class Object {
      left: number
      top: number
      width: number
      height: number
      angle: number
      scaleX: number
      scaleY: number
      flipX: boolean
      flipY: boolean
      originX: string
      originY: string
      filters: any[]
      
      set(key: string | object, value?: any): void
      rotate(angle: number): void
      scale(value: number): void
      applyFilters(): void
    }
    
    export class Image extends Object {
      static fromURL(url: string, callback: (img: Image) => void, options?: any): void
    }
    
    export class Rect extends Object {}
    
    export class BaseBrush {
      width: number
      color: string
    }
    
    export class PencilBrush extends BaseBrush {
      constructor(canvas: Canvas)
    }
    
    export class Pattern {}
    
    export namespace Image {
      export namespace filters {
        export class Grayscale {
          constructor()
        }
        export class Sepia {
          constructor()
        }
        export class Invert {
          constructor()
        }
        export class Blur {
          constructor(options?: { blur: number })
        }
        export class Brightness {
          constructor(options?: { brightness: number })
        }
      }
    }
  }
}
