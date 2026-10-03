<template>
  <div class="image-to-pdf-container">
    <h2 class="title">图片合并 PDF 工具</h2>

    <!-- 上传区域 -->
    <div
      class="upload-area"
      :class="{ dragover: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileSelect"
      >
      <div class="upload-content">
        <a-icon type="picture" :style="{ fontSize: '48px', color: '#999' }" />
        <p>点击或拖放多张图片到此处</p>
        <p class="hint">支持 JPG / PNG / WebP / BMP 等，可多选，所有处理均在本地完成，图片不会上传</p>
      </div>
    </div>

    <!-- 选项 -->
    <div v-if="images.length" class="options-area">
      <a-row :gutter="16">
        <a-col :span="8">
          <label>纸张大小</label>
          <a-select v-model:value="pageSize" style="width: 100%">
            <a-select-option value="a4">A4（210×297mm）</a-select-option>
            <a-select-option value="letter">Letter（8.5×11in）</a-select-option>
            <a-select-option value="native">原图尺寸</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="8">
          <label>页面方向</label>
          <a-select v-model:value="orientation" style="width: 100%">
            <a-select-option value="auto">自动（按图片宽高）</a-select-option>
            <a-select-option value="portrait">纵向</a-select-option>
            <a-select-option value="landscape">横向</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="8">
          <label>边距（mm）</label>
          <a-input-number v-model:value="margin" :min="0" :max="50" :step="1" style="width: 100%" />
        </a-col>
      </a-row>
      <a-row :gutter="16" style="margin-top: 14px">
        <a-col :span="24">
          <label>画质：{{ Math.round(quality * 100) }}%</label>
          <a-slider v-model:value="quality" :min="0.5" :max="1" :step="0.01" />
        </a-col>
      </a-row>
    </div>

    <!-- 图片列表 -->
    <div v-if="images.length" class="image-list">
      <div class="list-header">
        <span>已选 {{ images.length }} 张图片</span>
        <a-button type="link" danger @click="clearAll">清空</a-button>
      </div>
      <div class="thumb-grid">
        <div v-for="(img, idx) in images" :key="img.id" class="thumb">
          <div class="thumb-num">{{ idx + 1 }}</div>
          <img :src="img.url" alt="">
          <div class="thumb-meta">{{ img.width }}×{{ img.height }}</div>
          <div class="thumb-ops">
            <a-button size="small" :disabled="idx === 0" @click="move(idx, -1)">↑</a-button>
            <a-button size="small" :disabled="idx === images.length - 1" @click="move(idx, 1)">↓</a-button>
            <a-button size="small" danger @click="remove(idx)">删除</a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作 -->
    <div v-if="images.length" class="action-area">
      <a-button type="primary" size="large" :loading="isGenerating" @click="mergeToPdf">
        {{ isGenerating ? '生成中...' : '合并并下载 PDF' }}
      </a-button>
    </div>

    <!-- 说明 -->
    <div class="features-section">
      <h3>功能特点</h3>
      <ul>
        <li>支持多张图片按顺序合并为一个 PDF 文件</li>
        <li>支持拖放、多选、上移/下移调整顺序</li>
        <li>可自定义纸张大小、页面方向、边距和画质</li>
        <li>所有处理均在本地浏览器完成，图片不会上传，保证数据安全</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { jsPDF } from 'jspdf';

const fileInput = ref(null);
const images = ref([]);
const isDragging = ref(false);
const isGenerating = ref(false);
const pageSize = ref('a4');
const orientation = ref('auto');
const margin = ref(10);
const quality = ref(0.92);
let seq = 0;

// 纸张尺寸（纵向 [宽, 高]，单位 pt）
const PAGE = { a4: [595.28, 841.89], letter: [612, 792] };

const triggerFileInput = () => {
  fileInput.value && fileInput.value.click();
};

const handleFileSelect = (e) => {
  addFiles(e.target.files);
  e.target.value = '';
};

const handleDrop = (e) => {
  isDragging.value = false;
  addFiles(e.dataTransfer.files);
};

function addFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
  if (!files.length) {
    message.warning('未识别到图片文件');
    return;
  }
  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      images.value.push({
        id: ++seq,
        url,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.src = url;
  });
}

function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= images.value.length) return;
  const arr = images.value;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function remove(i) {
  URL.revokeObjectURL(images.value[i].url);
  images.value.splice(i, 1);
}

function clearAll() {
  images.value.forEach((it) => URL.revokeObjectURL(it.url));
  images.value = [];
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
  });
}

// 将图片绘制到 canvas 并转成 JPEG dataURL（统一格式、按需缩放）
async function toJpeg(url) {
  const img = await loadImage(url);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const MAX = 8000; // 限制最大尺寸，避免超大图导致内存问题
  const s = Math.min(1, MAX / Math.max(w, h));
  w = Math.max(1, Math.round(w * s));
  h = Math.max(1, Math.round(h * s));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return { dataUrl: canvas.toDataURL('image/jpeg', quality.value), w, h };
}

function layout(px, py) {
  const mm2pt = 72 / 25.4;
  const m = margin.value * mm2pt;

  if (pageSize.value === 'native') {
    return { W: px, H: py, orientation: px > py ? 'landscape' : 'portrait', dx: 0, dy: 0, dw: px, dh: py };
  }

  let [W, H] = PAGE[pageSize.value] || PAGE.a4;
  const wantLandscape =
    orientation.value === 'landscape' || (orientation.value === 'auto' && px > py);
  if (wantLandscape !== (W > H)) {
    [W, H] = [H, W];
  }
  const o = W > H ? 'landscape' : 'portrait';
  const availW = W - 2 * m;
  const availH = H - 2 * m;
  const s = Math.min(availW / px, availH / py, 1); // 只缩小不放大
  const dw = px * s;
  const dh = py * s;
  return { W, H, orientation: o, dx: (W - dw) / 2, dy: (H - dh) / 2, dw, dh };
}

async function mergeToPdf() {
  if (!images.value.length) {
    message.warning('请先选择图片');
    return;
  }
  isGenerating.value = true;
  try {
    const pages = [];
    for (const it of images.value) {
      const { dataUrl, w, h } = await toJpeg(it.url);
      pages.push({ dataUrl, ...layout(w, h) });
    }

    const first = pages[0];
    const doc = new jsPDF({
      unit: 'pt',
      format: [first.W, first.H],
      orientation: first.orientation,
      compress: true
    });

    pages.forEach((p, i) => {
      if (i > 0) doc.addPage([p.W, p.H], p.orientation);
      doc.addImage(p.dataUrl, 'JPEG', p.dx, p.dy, p.dw, p.dh);
    });

    doc.save('合并PDF_' + stamp() + '.pdf');
    message.success('已生成 ' + pages.length + ' 页 PDF');
  } catch (err) {
    console.error(err);
    message.error('生成失败，请重试');
  } finally {
    isGenerating.value = false;
  }
}

function stamp() {
  const d = new Date();
  const p = (n) => (n < 10 ? '0' : '') + n;
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    '_' +
    p(d.getHours()) +
    p(d.getMinutes())
  );
}
</script>

<style scoped>
.image-to-pdf-container {
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
  margin-bottom: 30px;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
}

.upload-area:hover {
  border-color: #1890ff;
}

.upload-area.dragover {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.upload-content p {
  margin: 10px 0;
  color: #666;
}

.upload-content .hint {
  font-size: 12px;
  color: #999;
}

.options-area {
  margin: 20px 0;
  padding: 15px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 5px;
}

.options-area label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.image-list {
  margin: 20px 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #34495e;
  font-weight: bold;
}

.thumb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}

.thumb {
  position: relative;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  text-align: center;
}

.thumb img {
  width: 100%;
  height: 120px;
  object-fit: contain;
  background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 16px 16px;
  display: block;
}

.thumb-num {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 1px 7px;
  border-radius: 10px;
}

.thumb-meta {
  font-size: 11px;
  color: #999;
  padding: 6px;
}

.thumb-ops {
  display: flex;
  gap: 4px;
  padding: 0 8px 10px;
  justify-content: center;
}

.action-area {
  margin-top: 20px;
  text-align: center;
}

.features-section {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.features-section h3 {
  color: #34495e;
  margin-bottom: 15px;
}

.features-section ul {
  list-style: none;
  padding-left: 0;
}

.features-section li {
  padding: 5px 0;
  padding-left: 20px;
  position: relative;
  color: #666;
}

.features-section li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #52c41a;
}
</style>
