<template>
  <div class="toolbar">
    <div class="toolbar-section">
      <button @click="$emit('tool-selected', 'select')" :class="{ active: activeTool === 'select' }">
        选择
      </button>
      <button @click="$emit('tool-selected', 'draw')" :class="{ active: activeTool === 'draw' }">
        涂鸦
      </button>
      <button @click="$emit('tool-selected', 'text')" :class="{ active: activeTool === 'text' }">
        文字
      </button>
      <button @click="$emit('crop')">
        裁剪
      </button>
    </div>

    <div class="toolbar-section">
      <button @click="$emit('rotate', 90)">旋转90°</button>
      <button @click="$emit('flip', 'horizontal')">水平翻转</button>
      <button @click="$emit('flip', 'vertical')">垂直翻转</button>
    </div>

    <div class="toolbar-section filters">
      <button @click="$emit('filter-applied', 'none')">原图</button>
      <button @click="$emit('filter-applied', 'grayscale')">灰度</button>
      <button @click="$emit('filter-applied', 'sepia')">复古</button>
      <button @click="$emit('filter-applied', 'invert')">反色</button>
      <button @click="$emit('filter-applied', 'blur')">模糊</button>
      <button @click="$emit('filter-applied', 'brightness')">提亮</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTool: string
}>()

defineEmits<{
  'tool-selected': [tool: string]
  'filter-applied': [filter: string]
  'rotate': [angle: number]
  'flip': [direction: 'horizontal' | 'vertical']
  'crop': []
}>()
</script>

<style scoped>
.toolbar {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}

.toolbar-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-section button {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}

.toolbar-section button:hover {
  background: #e0e0e0;
}

.toolbar-section button.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.filters button {
  font-size: 13px;
  padding: 6px 12px;
}
</style>
