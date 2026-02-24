<template>
  <div class="image-editor" :class="{ 'has-toolbar': hasImage }">
    <header class="editor-header">
      <button class="back-btn" @click="goBack" title="返回">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      <h1 class="title">ImgEditor</h1>
      <div class="header-actions">
        <button class="icon-btn" :class="{ active: headerActionActive }" @click="handleHeaderAction" :title="isCropping ? '确认裁剪' : '撤销'">
          <svg v-if="isCropping" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
          </svg>
        </button>
        <button class="icon-btn" :class="{ active: saveActionActive }" @click="exportImage" title="导出保存到相册">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
          </svg>
        </button>
      </div>
    </header>

    <main class="editor-main">
      <div class="canvas-area">
        <ImageCanvas
          ref="canvasRef"
          :zoom-level="zoomLevel"
          @image-loaded="onImageLoaded"
          @image-changed="onImageChanged"
          @crop-started="onCropStarted"
        />
      </div>
    </main>

    <div class="bottom-tabs" v-if="!hasImage">
      <div class="tab-item">
        <div class="add-btn" @click="selectImage">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
      </div>
    </div>

    <div class="bottom-toolbar" v-if="hasImage">
      <div 
        class="tool-item" 
        v-for="tool in tools" 
        :key="tool.id" 
        :class="{ active: activeTool === tool.id, disabled: tool.id === 'select' && !hasDrawings }"
        @click="tool.id === 'select' && !hasDrawings ? null : selectTool(tool.id)"
      >
        <span class="tool-icon" v-html="tool.icon"></span>
        <span class="tool-label">{{ tool.label }}</span>
      </div>
    </div>

    <div class="filter-panel" v-if="showFilterPanel" @click="showFilterPanel = false">
      <div class="filter-content" @click.stop>
        <div class="filter-options">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="applyFilter(filter.value)"
            :class="{ active: activeFilter === filter.value }"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ImageCanvas from './ImageCanvas.vue'

const canvasRef = ref<InstanceType<typeof ImageCanvas>>()
const hasImage = ref(false)
const activeTool = ref('')
const showFilterPanel = ref(false)
const activeFilter = ref('none')
const hasDrawings = ref(false)
const isCropping = ref(false)
const headerActionActive = ref(false)
const saveActionActive = ref(false)

const filters = [
  { value: 'none', label: '原图' },
  { value: 'grayscale', label: '灰度' },
  { value: 'sepia', label: '复古' },
  { value: 'invert', label: '反色' },
  { value: 'blur', label: '模糊' },
  { value: 'brightness', label: '提亮' },
  { value: 'sharpen', label: '锐化' },
  { value: 'contrast', label: '对比度' },
  { value: 'pixelate', label: '马赛克' }
]
const zoomLevel = ref(1)

const tools = [
  { id: 'crop', label: 'Crop', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/></svg>' },
  { id: 'rotate', label: 'Rotate', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/></svg>' },
  { id: 'filter', label: 'Filter', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/></svg>' },
  { id: 'text', label: 'Text', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5 4v3h5.5v12h3V7H19V4z"/></svg>' },
  { id: 'draw', label: 'Draw', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>' },
  { id: 'marker', label: 'Marker', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>' },
  { id: 'select', label: 'Select', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z"/></svg>' },
  { id: 'delete', label: 'Delete', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>' }
]

const goBack = () => {
  hasImage.value = false
  canvasRef.value?.clearCanvas()
}

const exportImage = async () => {
  if (!hasImage.value) return
  saveActionActive.value = true
  await canvasRef.value?.saveImage()
  setTimeout(() => {
    saveActionActive.value = false
  }, 200)
}

const handleHeaderAction = () => {
  headerActionActive.value = true
  setTimeout(() => {
    headerActionActive.value = false
  }, 200)
  
  if (isCropping.value) {
    canvasRef.value?.confirmCrop()
    isCropping.value = false
    activeTool.value = ''
  } else {
    canvasRef.value?.undo()
  }
}

const onCropStarted = () => {
  isCropping.value = true
}

const selectTool = (tool: string) => {
  const persistentTools = ['select', 'draw', 'text', 'marker']
  
  if (tool === 'crop') {
    activeTool.value = tool
  } else if (persistentTools.includes(tool)) {
    activeTool.value = tool
  } else {
    activeTool.value = ''
  }
  
  if (tool === 'crop') {
    canvasRef.value?.startCrop()
    return
  }
  
  canvasRef.value?.cancelCrop()
  
  if (tool === 'select') {
    canvasRef.value?.setActiveTool('select')
  } else if (tool === 'draw') {
    hasDrawings.value = true
    canvasRef.value?.setActiveTool('draw')
  } else if (tool === 'rotate') {
    canvasRef.value?.rotate(90)
    activeTool.value = ''
  } else if (tool === 'filter') {
    showFilterPanel.value = true
  } else if (tool === 'text') {
    hasDrawings.value = true
    canvasRef.value?.addText()
  } else if (tool === 'blur') {
    canvasRef.value?.applyFilter('blur')
  } else if (tool === 'marker') {
    hasDrawings.value = true
    canvasRef.value?.setActiveTool('draw')
    canvasRef.value?.setBrushColor('#ff0000')
  } else if (tool === 'delete') {
    canvasRef.value?.deleteSelected()
    activeTool.value = ''
  }
}

const applyFilter = (filter: string) => {
  activeFilter.value = filter
  canvasRef.value?.applyFilter(filter)
  showFilterPanel.value = false
  activeTool.value = ''
}

const selectImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        canvasRef.value?.loadImage(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

const onImageLoaded = () => {
  hasImage.value = true
  activeTool.value = ''
}

const onImageChanged = () => {
}
</script>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a1a;
  color: #fff;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1a1a1a;
  border-bottom: 1px solid #404040;
}

.back-btn,
.header-actions .icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #2d2d2d;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.back-btn:active,
.header-actions .icon-btn:active {
  background: #2196f3;
  transform: scale(0.95);
}

.back-btn:hover,
.header-actions .icon-btn:hover {
  background: #404040;
}

.header-actions .icon-btn.active {
  background: #2196f3;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.canvas-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
  padding: 0 0 80px 0;
  box-sizing: border-box;
  min-height: 0;
}

.canvas-area :deep(.canvas-container) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.canvas-area :deep(canvas) {
  max-width: 100%;
  max-height: 100%;
}

.bottom-toolbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 4px;
  background: #252525;
  border-top: 1px solid #404040;
  flex-shrink: 0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 12px;
  transition: background-color 0.2s;
  min-width: 48px;
  border: none;
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
}

.tool-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tool-item:active,
.tool-item:focus,
.tool-item:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.tool-item.active {
  background: #2196f3;
}

.tool-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-item.disabled:hover {
  background: transparent;
}

.tool-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.tool-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.tool-label {
  font-size: 10px;
  color: #a0a0a0;
}

.tool-item.active .tool-label {
  color: #fff;
}

.bottom-tabs {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 8px;
  background: #252525;
  border-top: 1px solid #404040;
  flex-shrink: 0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #a0a0a0;
  font-size: 10px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.2s;
  min-width: 56px;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.add-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2196f3;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.add-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.5);
}

.gallery-btn {
  position: relative;
}

@media (max-width: 480px) {
  .editor-header {
    padding: 10px 12px;
  }

  .title {
    font-size: 16px;
  }

  .bottom-toolbar,
  .bottom-tabs {
    padding: 8px 4px;
  }

  .tool-item {
    padding: 6px 8px;
    min-width: 40px;
  }

  .tool-label {
    font-size: 9px;
  }

  .add-btn {
    width: 48px;
    height: 48px;
  }
}

.filter-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.filter-content {
  width: 100%;
  max-height: 60px;
  background: #252525;
  border-radius: 20px 20px 0 0;
  padding: 12px 16px;
  overflow-y: auto;
}

.filter-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.filter-options button {
  padding: 8px 4px;
  background: #333;
  color: #fff;
  border: 1px solid #404040;
  border-radius: 8px;
  font-size: 11px;
  transition: none;
  outline: none !important;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  box-shadow: none !important;
}

.filter-options button:active,
.filter-options button:focus,
.filter-options button:focus-visible,
.filter-options button.active {
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
  transform: none !important;
  background: #333;
  border: 1px solid #404040;
}
</style>
