<template>
  <div class="app-container">
    <ImageEditor />
  </div>
</template>

<script setup lang="ts">
import ImageEditor from './components/ImageEditor.vue'
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
