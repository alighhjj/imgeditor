<template>
  <div class="canvas-wrapper" ref="wrapperEl">
    <div class="canvas-container" :class="{ 'show-grid': showGrid }">
      <canvas ref="canvasEl"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { fabric } from 'fabric'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'


const props = defineProps<{
  showGrid?: boolean
  zoomLevel?: number
}>()

const canvasEl = ref<HTMLCanvasElement>()
const wrapperEl = ref<HTMLDivElement>()
let canvas: any = null
let activeImage: any = null
let cropRect: any = null
const history = ref<string[]>([])
const maxHistorySize = 20
let historyIndex = -1
let isRestoring = false

const canUndo = () => {
  return history.value.length > 0
}
const emit = defineEmits<{
  'image-loaded': []
  'image-changed': []
  'crop-started': []
}>()

onMounted(() => {
  initCanvas()
  nextTick(() => {
    resizeCanvas()
  })
})

onBeforeUnmount(() => {
  canvas?.dispose()
})

watch(() => props.zoomLevel, (newZoom) => {
  if (canvas && newZoom) {
    canvas.setZoom(newZoom)
    canvas.renderAll()
  }
})

watch(() => props.showGrid, (show) => {
  if (canvas) {
    canvas.backgroundColor = show ? 'transparent' : '#ffffff'
    if (show) {
      drawGrid()
    } else {
      canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas))
    }
  }
})

const initCanvas = () => {
  if (!canvasEl.value) {
    return
  }
  
  canvas = new fabric.Canvas(canvasEl.value, {
    backgroundColor: '#ffffff',
    selection: true,
    preserveObjectStacking: true
  })

  canvas.on('object:moving', (e: any) => {
    const obj = e.target
    if (!obj) return
    
    const canvasWidth = canvas.width!
    const canvasHeight = canvas.height!
    const objWidth = obj.width! * obj.scaleX
    const objHeight = obj.height! * obj.scaleY

    if (obj.left! < objWidth / 2) {
      obj.set('left', objWidth / 2)
    }
    if (obj.top! < objHeight / 2) {
      obj.set('top', objHeight / 2)
    }
    if (obj.left! > canvasWidth - objWidth / 2) {
      obj.set('left', canvasWidth - objWidth / 2)
    }
    if (obj.top! > canvasHeight - objHeight / 2) {
      obj.set('top', canvasHeight - objHeight / 2)
    }
  })
  
  canvas.on('path:created', () => {
    saveHistory()
    emit('image-changed')
  })
  
  canvas.on('object:modified', () => {
    saveHistory()
    emit('image-changed')
  })
  
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
}

const resizeCanvas = () => {
  if (!canvas || !wrapperEl.value) return
  
  const wrapper = wrapperEl.value
  let width = wrapper.clientWidth
  let height = wrapper.clientHeight
  
  if (width === 0 || height === 0) {
    width = window.innerWidth
    height = window.innerHeight - 200
  }
  
  canvas.setWidth(width)
  canvas.setHeight(height)
  canvas.renderAll()
}

const saveHistory = () => {
  if (!canvas || isRestoring) return
  
  const json = JSON.stringify(canvas.toJSON())
  
  if (historyIndex < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex + 1)
  }
  
  if (history.value.length >= maxHistorySize) {
    history.value.shift()
    historyIndex--
  }
  
  history.value.push(json)
  historyIndex++
  
  console.log(`[History] Save: index=${historyIndex}, length=${history.value.length}`)
}

const undo = () => {
  if (!canvas) {
    console.log('[Undo] Canvas not ready')
    return
  }
  if (historyIndex <= 0) {
    console.log('[Undo] No history to undo, index=', historyIndex)
    return
  }
  
  historyIndex--
  console.log(`[Undo] Restore to index=${historyIndex}`)
  const json = history.value[historyIndex]
  
  cancelCrop()
  isRestoring = true
  
  canvas.loadFromJSON(json, () => {
    isRestoring = false
    const objs = canvas.getObjects()
    if (objs.length > 0) {
      for (const obj of objs) {
        if (obj instanceof fabric.Image) {
          activeImage = obj
          break
        }
      }
    }
    canvas.renderAll()
    emit('image-changed')
  })
}

const drawGrid = () => {
  if (!canvas) return
  
  const gridSize = 20
  const width = canvas.width || 800
  const height = canvas.height || 600
  
  for (let i = 0; i < Math.ceil(width / gridSize); i++) {
    const line = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
      stroke: '#e0e0e0',
      strokeWidth: 1,
      selectable: false,
      evented: false
    })
    canvas.add(line)
    canvas.sendToBack(line)
  }
  
  for (let i = 0; i < Math.ceil(height / gridSize); i++) {
    const line = new fabric.Line([0, i * gridSize, width, i * gridSize], {
      stroke: '#e0e0e0',
      strokeWidth: 1,
      selectable: false,
      evented: false
    })
    canvas.add(line)
    canvas.sendToBack(line)
  }
}

const loadImage = (imageUrl: string) => {
  if (!canvas || !wrapperEl.value) return
  
  const wrapper = wrapperEl.value
  const canvasWidth = wrapper.clientWidth
  const canvasHeight = wrapper.clientHeight
  
  canvas.setWidth(canvasWidth)
  canvas.setHeight(canvasHeight)
  
  if (canvasWidth === 0 || canvasHeight === 0) {
    setTimeout(() => loadImage(imageUrl), 100)
    return
  }
  
  canvas.clear()
  canvas.backgroundColor = '#ffffff'
  history.value = []
  historyIndex = -1
  
  fabric.Image.fromURL(imageUrl, (img) => {
    if (!canvas) return
    
    const imgWidth = img.width || 1
    const imgHeight = img.height || 1
    
    const canvasRatio = canvasWidth / canvasHeight
    const imgRatio = imgWidth / imgHeight
    
    let scale: number
    let left: number
    let top: number
    
    if (imgRatio > canvasRatio) {
      scale = canvasWidth / imgWidth
      left = canvasWidth / 2
      top = canvasHeight / 2
    } else {
      scale = canvasHeight / imgHeight
      left = canvasWidth / 2
      top = canvasHeight / 2
    }
    
    img.scale(scale)
    img.set({
      left: left,
      top: top,
      originX: 'center',
      originY: 'center'
    })
    
    canvas.add(img)
    activeImage = img
    
    if (props.showGrid) {
      drawGrid()
    }
    
    canvas.renderAll()
    saveHistory()
    emit('image-loaded')
  }, { crossOrigin: 'anonymous' })
}

const clearCanvas = () => {
  if (!canvas) return
  canvas.clear()
  canvas.backgroundColor = '#ffffff'
  activeImage = null
  cropRect = null
  canvas.renderAll()
}

const setActiveTool = (tool: string) => {
  if (!canvas) return
  
  cancelCrop()
  
  isRestoring = true
  
  canvas.isDrawingMode = tool === 'draw'
  
  if (tool === 'draw') {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
    canvas.freeDrawingBrush.width = 5
    canvas.freeDrawingBrush.color = '#000000'
  } else if (tool === 'select') {
    canvas.selection = true
  }
  
  setTimeout(() => {
    isRestoring = false
  }, 100)
}

const setBrushColor = (color: string) => {
  if (!canvas) return
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = color
  }
}

const deleteSelected = () => {
  if (!canvas) return
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length) {
    activeObjects.forEach((obj: any) => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.renderAll()
    saveHistory()
    emit('image-changed')
  }
}

const addText = () => {
  if (!canvas) return
  
  const text = new fabric.IText('双击编辑文字', {
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: 'center',
    originY: 'center',
    fontSize: 24,
    fill: '#000000'
  })
  
  canvas.add(text)
  canvas.setActiveObject(text)
  canvas.renderAll()
  saveHistory()
  emit('image-changed')
}

const applyFilter = (filterType: string) => {
  if (!activeImage) {
    alert('请先加载图片')
    return
  }
  
  activeImage.filters = []
  
  switch (filterType) {
    case 'grayscale':
      activeImage.filters.push(new fabric.Image.filters.Grayscale())
      break
    case 'sepia':
      activeImage.filters.push(new fabric.Image.filters.Sepia())
      break
    case 'invert':
      activeImage.filters.push(new fabric.Image.filters.Invert())
      break
    case 'blur':
      activeImage.filters.push(new fabric.Image.filters.Blur({ blur: 0.5 }))
      break
    case 'brightness':
      activeImage.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.2 }))
      break
    case 'sharpen':
      activeImage.filters.push(new fabric.Image.filters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
      }))
      break
    case 'contrast':
      activeImage.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.2 }))
      break
    case 'pixelate':
      activeImage.filters.push(new fabric.Image.filters.Pixelate({ blocksize: 20 }))
      break
    case 'none':
    default:
      break
  }
  
  activeImage.applyFilters()
  canvas?.renderAll()
  saveHistory()
  emit('image-changed')
}

const rotate = (angle: number) => {
  if (!activeImage) return
  
  activeImage.rotate((activeImage.angle || 0) + angle)
  canvas?.renderAll()
  saveHistory()
  emit('image-changed')
}

const flip = (direction: 'horizontal' | 'vertical') => {
  if (!activeImage) return
  
  if (direction === 'horizontal') {
    activeImage.set('flipX', !activeImage.flipX)
  } else {
    activeImage.set('flipY', !activeImage.flipY)
  }
  
  canvas?.renderAll()
  saveHistory()
  emit('image-changed')
}

const startCrop = () => {
  if (!canvas || !activeImage) return
  
  cancelCrop()
  
  canvas.isDrawingMode = false
  canvas.discardActiveObject()
  canvas.renderAll()
  
  const rect = new fabric.Rect({
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    width: activeImage.width! * activeImage.scaleX! * 0.8,
    height: activeImage.height! * activeImage.scaleY! * 0.8,
    fill: 'rgba(0,0,0,0.3)',
    stroke: '#fff',
    strokeWidth: 2,
    cornerColor: '#1976d2',
    cornerStyle: 'circle',
    transparentCorners: false,
    hasRotatingPoint: true,
    lockRotation: true,
    centeredScaling: true,
    originX: 'center',
    originY: 'center'
  })
  
  cropRect = rect
  canvas.add(rect)
  canvas.setActiveObject(rect)
  canvas.renderAll()
  
  emit('crop-started')
}

const cancelCrop = () => {
  if (!canvas) return
  if (cropRect) {
    canvas.remove(cropRect)
    cropRect = null
    canvas.renderAll()
  }
}

const confirmCrop = () => {
  if (!canvas || !activeImage) return
  
  const cropObj = canvas.getActiveObject()
  if (!cropObj || cropObj.type !== 'rect') {
    canvas.remove(cropObj)
    canvas.renderAll()
    return
  }
  
  const cropWidth = cropObj.width! * cropObj.scaleX!
  const cropHeight = cropObj.height! * cropObj.scaleY!
  const cropLeft = cropObj.left! - cropWidth / 2
  const cropTop = cropObj.top! - cropHeight / 2
  
  cropObj.visible = false
  canvas.renderAll()
  
  const croppedDataUrl = canvas.toDataURL({
    format: 'png',
    left: cropLeft,
    top: cropTop,
    width: cropWidth,
    height: cropHeight,
    multiplier: 1
  })
  
  cropObj.visible = true
  canvas.remove(cropObj)
  cropRect = null
  canvas.remove(activeImage)
  
  fabric.Image.fromURL(croppedDataUrl, (img) => {
    if (!canvas) return
    
    const scale = Math.min(
      canvas.width! / (img.width || 1),
      canvas.height! / (img.height || 1)
    ) * 0.9
    
    img.scale(scale)
    img.set({
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center'
    })
    
    canvas.add(img)
    activeImage = img
    canvas.renderAll()
    saveHistory()
    emit('image-changed')
  })
}

const saveImage = async () => {
  if (!canvas) return
  
  const objs = canvas.getObjects()
  if (objs.length === 0) return
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  
  for (const obj of objs) {
    const bound = obj.getBoundingRect()
    minX = Math.min(minX, bound.left)
    minY = Math.min(minY, bound.top)
    maxX = Math.max(maxX, bound.left + bound.width)
    maxY = Math.max(maxY, bound.top + bound.height)
  }
  
  const cropWidth = maxX - minX
  const cropHeight = maxY - minY
  
    const dataURL = canvas.toDataURL({
      format: 'png',
      left: minX,
      top: minY,
      width: Math.max(1, cropWidth),
      height: Math.max(1, cropHeight),
      multiplier: 2
    })
  
  try {
    const timestamp = Date.now()
    const filename = `imgeditor-${timestamp}.png`
    
    await Filesystem.writeFile({
      path: filename,
      data: dataURL,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    })
    
    console.log('File saved:', filename)
    
    alert('图片已保存到相册')
  } catch (error) {
    console.error('Save failed:', error)
    alert('保存失败: ' + (error as Error).message)
  }
}

const getDataURL = () => {
  if (!canvas) return ''
  return canvas.toDataURL({ format: 'png', quality: 1 })
}

const restoreFromDataURL = (dataUrl: string) => {
  if (!canvas) return
  
  fabric.Image.fromURL(dataUrl, (img) => {
    if (!canvas) return
    
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    
    const scale = Math.min(
      canvas.width! / (img.width || 1),
      canvas.height! / (img.height || 1)
    ) * 0.9
    
    img.scale(scale)
    img.set({
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center'
    })
    
    canvas.add(img)
    activeImage = img
    canvas.renderAll()
  })
}

defineExpose({
  loadImage,
  clearCanvas,
  undo,
  canUndo,
  setActiveTool,
  setBrushColor,
  addText,
  applyFilter,
  rotate,
  flip,
  startCrop,
  confirmCrop,
  cancelCrop,
  saveImage,
  getDataURL,
  restoreFromDataURL,
  deleteSelected
})
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1a1a;
  overflow: hidden;
  transition: background 0.3s ease;
}

.canvas-container.show-grid {
  background-image: 
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

canvas {
  max-width: 100%;
  max-height: 100%;
  background: white;
}

@media (max-width: 768px) {
  .canvas-container {
    background: #d0d0d0;
  }
}
</style>
