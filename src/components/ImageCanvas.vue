<template>
  <div class="canvas-container">
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { fabric } from 'fabric'
import { Camera, CameraResultType } from '@capacitor/camera'
import { Filesystem, Directory } from '@capacitor/filesystem'

const canvasEl = ref<HTMLCanvasElement>()
let canvas: fabric.Canvas | null = null
let activeImage: fabric.Image | null = null
const emit = defineEmits<{
  'image-loaded': []
  'image-changed': []
}>()

onMounted(() => {
  initCanvas()
})

onBeforeUnmount(() => {
  canvas?.dispose()
})

const initCanvas = () => {
  if (!canvasEl.value) return
  
  canvas = new fabric.Canvas(canvasEl.value, {
    backgroundColor: '#ffffff',
    selection: true,
    preserveObjectStacking: true
  })
  
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
}

const resizeCanvas = () => {
  if (!canvas || !canvasEl.value) return
  
  const container = canvasEl.value.parentElement
  if (!container) return
  
  canvas.setWidth(container.clientWidth)
  canvas.setHeight(container.clientHeight)
  canvas.renderAll()
}

const loadImage = (imageUrl: string) => {
  if (!canvas) return
  
  fabric.Image.fromURL(imageUrl, (img) => {
    if (!canvas) return
    
    canvas.clear()
    
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
    emit('image-loaded')
  }, { crossOrigin: 'anonymous' })
}

const setActiveTool = (tool: string) => {
  if (!canvas) return
  
  canvas.isDrawingMode = tool === 'draw'
  
  if (tool === 'draw') {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
    canvas.freeDrawingBrush.width = 5
    canvas.freeDrawingBrush.color = '#000000'
  }
}

const applyFilter = (filterType: string) => {
  if (!activeImage) return
  
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
    case 'none':
    default:
      break
  }
  
  activeImage.applyFilters()
  canvas?.renderAll()
  emit('image-changed')
}

const rotate = (angle: number) => {
  if (!activeImage) return
  
  activeImage.rotate((activeImage.angle || 0) + angle)
  canvas?.renderAll()
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
  emit('image-changed')
}

const startCrop = () => {
  if (!canvas || !activeImage) return
  
  const rect = new fabric.Rect({
    left: activeImage.left,
    top: activeImage.top,
    width: activeImage.width! * activeImage.scaleX! / 2,
    height: activeImage.height! * activeImage.scaleY! / 2,
    fill: 'rgba(0,0,0,0.3)',
    stroke: '#000',
    strokeWidth: 2,
    cornerColor: '#1976d2',
    cornerStyle: 'circle',
    transparentCorners: false,
    hasRotatingPoint: false
  })
  
  canvas.add(rect)
  canvas.setActiveObject(rect)
  canvas.renderAll()
  
  alert('调整裁剪框大小和位置，然后点击"确认裁剪"按钮')
}

const saveImage = async () => {
  if (!canvas) return
  
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1
  })
  
  try {
    await Filesystem.writeFile({
      path: `image-editor-${Date.now()}.png`,
      data: dataURL.split(',')[1],
      directory: Directory.Documents
    })
    alert('图片已保存到文档目录')
  } catch (error) {
    const link = document.createElement('a')
    link.download = `image-editor-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }
}

defineExpose({
  loadImage,
  setActiveTool,
  applyFilter,
  rotate,
  flip,
  startCrop,
  saveImage
})
</script>

<style scoped>
.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e0e0e0;
  overflow: hidden;
}

canvas {
  border: 1px solid #ccc;
  background: white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>
