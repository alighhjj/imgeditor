<template>
  <div class="toolbar" :class="{ collapsed: isCollapsed }">
    <div class="toolbar-content">
      <div class="toolbar-section" v-if="!isCollapsed">
        <div class="section-title">工具</div>
        <button 
          @click="$emit('tool-selected', 'select')" 
          :class="{ active: activeTool === 'select' }"
          title="选择工具 - 用于选择和移动对象"
        >
          <span class="icon">⬚</span>
          <span class="label">选择</span>
        </button>
        <button 
          @click="$emit('tool-selected', 'draw')" 
          :class="{ active: activeTool === 'draw' }"
          title="涂鸦工具 - 自由绘制"
        >
          <span class="icon">✏️</span>
          <span class="label">涂鸦</span>
        </button>
        <button 
          @click="$emit('tool-selected', 'text')" 
          :class="{ active: activeTool === 'text' }"
          title="文字工具 - 添加文字"
        >
          <span class="icon">T</span>
          <span class="label">文字</span>
        </button>
        <button 
          @click="$emit('crop')"
          title="裁剪工具 - 裁剪图片"
        >
          <span class="icon">⬔</span>
          <span class="label">裁剪</span>
        </button>
      </div>

      <div class="toolbar-divider" v-if="!isCollapsed"></div>

      <div class="toolbar-section" v-if="!isCollapsed">
        <div class="section-title">变换</div>
        <button @click="$emit('rotate', 90)" title="顺时针旋转90度">
          <span class="icon">↻</span>
          <span class="label">旋转90°</span>
        </button>
        <button @click="$emit('rotate', -90)" title="逆时针旋转90度">
          <span class="icon">↺</span>
          <span class="label">旋转-90°</span>
        </button>
        <button @click="$emit('flip', 'horizontal')" title="水平翻转">
          <span class="icon">⇆</span>
          <span class="label">水平翻转</span>
        </button>
        <button @click="$emit('flip', 'vertical')" title="垂直翻转">
          <span class="icon">⇅</span>
          <span class="label">垂直翻转</span>
        </button>
      </div>

      <div class="toolbar-divider" v-if="!isCollapsed"></div>

      <div class="toolbar-section filters" :class="{ expanded: filterExpanded }">
        <div class="section-header" @click="filterExpanded = !filterExpanded" v-if="!isCollapsed">
          <div class="section-title">滤镜</div>
          <span class="expand-icon">{{ filterExpanded ? '▼' : '▶' }}</span>
        </div>
        <div class="filter-buttons" v-if="!isCollapsed">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="$emit('filter-applied', filter.value)"
            :title="filter.title"
            class="filter-btn"
          >
            <span class="label">{{ filter.label }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="collapsed-icons" v-if="isCollapsed">
      <button 
        @click="$emit('tool-selected', 'select')" 
        :class="{ active: activeTool === 'select' }"
        title="选择"
      >
        <span class="icon">⬚</span>
      </button>
      <button 
        @click="$emit('tool-selected', 'draw')" 
        :class="{ active: activeTool === 'draw' }"
        title="涂鸦"
      >
        <span class="icon">✏️</span>
      </button>
      <button @click="$emit('crop')" title="裁剪">
        <span class="icon">⬔</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  activeTool: string
  isCollapsed?: boolean
}>()

defineEmits<{
  'tool-selected': [tool: string]
  'filter-applied': [filter: string]
  'rotate': [angle: number]
  'flip': [direction: 'horizontal' | 'vertical']
  'crop': []
}>()

const filterExpanded = ref(true)

const filters = [
  { value: 'none', label: '原图', title: '无滤镜效果' },
  { value: 'grayscale', label: '灰度', title: '转换为灰度图像' },
  { value: 'sepia', label: '复古', title: '复古暖色调效果' },
  { value: 'invert', label: '反色', title: '反转颜色' },
  { value: 'blur', label: '模糊', title: '模糊效果' },
  { value: 'brightness', label: '提亮', title: '提高亮度' },
  { value: 'sharpen', label: '锐化', title: '增强边缘锐度' },
  { value: 'contrast', label: '对比度', title: '调整对比度' }
]
</script>

<style scoped>
.toolbar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.toolbar.collapsed {
  padding: 8px;
  width: 50px;
}

.toolbar-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;
}

.expand-icon {
  font-size: 10px;
  color: var(--text-secondary, #666);
}

.toolbar-divider {
  height: 1px;
  background: var(--border-color, #e0e0e0);
  margin: 4px 0;
}

.toolbar-section button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--hover-bg, #f5f5f5);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.toolbar-section button:hover {
  background: var(--accent-color, #1976d2);
  color: white;
  border-color: var(--accent-color, #1976d2);
  transform: translateX(4px);
}

.toolbar-section button.active {
  background: var(--accent-color, #1976d2);
  color: white;
  border-color: var(--accent-color, #1976d2);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.toolbar-section button .icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.toolbar-section button .label {
  flex: 1;
  text-align: left;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  padding: 8px 12px !important;
  font-size: 13px !important;
}

.filter-btn:hover {
  transform: scale(1.05);
}

.collapsed-icons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collapsed-icons button {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hover-bg, #f5f5f5);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapsed-icons button:hover,
.collapsed-icons button.active {
  background: var(--accent-color, #1976d2);
  color: white;
}

.collapsed-icons button .icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .toolbar {
    padding: 12px;
  }
  
  .toolbar-section button {
    padding: 12px;
  }
  
  .filter-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  
  .filter-btn {
    padding: 8px !important;
    font-size: 12px !important;
  }
}
</style>
