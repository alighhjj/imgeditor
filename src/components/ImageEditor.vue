<template>
  <div class="image-editor">
    <header class="editor-header">
      <h1>图片编辑器</h1>
      <div class="actions">
        <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" />
        <button @click="selectImage" class="btn-primary">选择图片</button>
        <button v-if="hasImage" @click="saveImage" class="btn-success">保存图片</button>
      </div>
    </header>

    <div class="editor-main">
      <ImageCanvas
        ref="canvasRef"
        @image-loaded="onImageLoaded"
        @image-changed="onImageChanged"
      />
      
      <Toolbar
        v-if="hasImage"
        :active-tool="activeTool"
        @tool-selected="handleToolSelected"
        @filter-applied="handleFilterApplied"
        @rotate="handleRotate"
        @flip="handleFlip"
        @crop="handleCrop"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ImageCanvas from './ImageCanvas.vue'
import Toolbar from './Toolbar.vue'

const fileInput = ref<HTMLInputElement>()
const canvasRef = ref<InstanceType<typeof ImageCanvas>>()
const hasImage = ref(false)
const activeTool = ref('select')

const selectImage = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
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

const onImageLoaded = () => {
  hasImage.value = true
}

const onImageChanged = () => {
}

const handleToolSelected = (tool: string) => {
  activeTool.value = tool
  canvasRef.value?.setActiveTool(tool)
}

const handleFilterApplied = (filter: string) => {
  canvasRef.value?.applyFilter(filter)
}

const handleRotate = (angle: number) => {
  canvasRef.value?.rotate(angle)
}

const handleFlip = (direction: 'horizontal' | 'vertical') => {
  canvasRef.value?.flip(direction)
}

const handleCrop = () => {
  canvasRef.value?.startCrop()
}

const saveImage = async () => {
  await canvasRef.value?.saveImage()
}
</script>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.editor-header h1 {
  font-size: 20px;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-success {
  background: #388e3c;
  color: white;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
