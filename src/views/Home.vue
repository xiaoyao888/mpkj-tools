<template>
  <div class="home-container">
    <h2 class="title">在线工具集</h2>
    <p class="subtitle">所有工具均在本地浏览器运行，数据不会上传</p>

    <div v-for="group in MENU_GROUPS" :key="group.key" class="tool-group">
      <div class="group-title">
        <component :is="group.icon" class="group-icon" />
        <span>{{ group.title }}</span>
      </div>
      <div class="tool-grid">
        <div
          v-for="item in group.children"
          :key="item.path"
          class="tool-card"
          @click="go(item.path)"
        >
          <div class="tool-icon">
            <component :is="TOOL_ICONS[item.path]" />
          </div>
          <div class="tool-info">
            <div class="tool-name">{{ item.name }}</div>
            <div class="tool-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { MENU_GROUPS, TOOL_ICONS } from '@/config/menus';

const router = useRouter();
const go = (path) => router.push(path);
</script>

<style scoped>
.home-container {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  color: #34495e;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 24px;
}

.tool-group {
  margin-bottom: 24px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 15px;
  font-weight: bold;
  color: #34495e;
}

.group-icon {
  color: #1890ff;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tool-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 10px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

.tool-icon {
  flex: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #1890ff;
  background: #e6f7ff;
  border-radius: 8px;
}

.tool-name {
  font-size: 14px;
  font-weight: bold;
  color: #34495e;
}

.tool-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
</style>
