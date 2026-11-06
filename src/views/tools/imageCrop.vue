<template>
  <div class="crop-container">
    <h2 class="title">图片裁剪压缩工具</h2>

    <!-- 上传区域 -->
    <div
      v-if="!imageUrl"
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
        style="display: none"
        @change="handleFileSelect"
      >
      <div class="upload-content">
        <div class="upload-icon">🖼️</div>
        <p>点击或拖放图片到此处</p>
        <p class="hint">支持 JPG / PNG / WebP，所有处理均在本地完成，图片不会上传</p>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div v-else class="editor-layout">
      <div ref="stagePanel" class="canvas-panel">
        <div class="stage-scroll">
          <div class="image-stage" :style="{ width: displayW + 'px', height: displayH + 'px' }">
            <img
              ref="previewImg"
              class="stage-img"
              :src="imageUrl"
              alt="待裁剪图片"
              draggable="false"
              @load="onImageLoad"
            >
            <div class="crop-box" :style="cropStyle" @pointerdown="startDrag($event, 'move')">
              <div class="grid-line gx1"></div>
              <div class="grid-line gx2"></div>
              <div class="grid-line gy1"></div>
              <div class="grid-line gy2"></div>
              <div class="handle nw" @pointerdown.stop="startDrag($event, 'nw')"></div>
              <div class="handle ne" @pointerdown.stop="startDrag($event, 'ne')"></div>
              <div class="handle sw" @pointerdown.stop="startDrag($event, 'sw')"></div>
              <div class="handle se" @pointerdown.stop="startDrag($event, 'se')"></div>
            </div>
          </div>
        </div>
        <div class="stage-meta">
          原图 {{ naturalW }} × {{ naturalH }} px
          <span v-if="displayScale < 0.999">· 预览缩放 {{ Math.round(displayScale * 100) }}%</span>
          <span class="tip-text">拖动裁剪框移动，拖动四角调整大小，可用缩放条放大查看细节</span>
        </div>
      </div>

      <div class="settings-panel">
        <div class="field">
          <label>画布缩放：{{ zoom }}%（仅放大预览，不改变输出尺寸）</label>
          <a-slider v-model:value="zoom" :min="25" :max="400" :step="5" @change="applyZoom" />
          <div class="scale-quick">
            <button
              v-for="p in [50, 100, 200, 400]"
              :key="p"
              class="ratio-btn"
              :class="{ active: zoom === p }"
              @click="setZoom(p)"
            >{{ p }}%</button>
          </div>
        </div>

        <div class="field">
          <label>裁剪比例</label>
          <div class="ratio-btns">
            <button
              v-for="r in ratios"
              :key="r.value"
              class="ratio-btn"
              :class="{ active: ratio === r.value }"
              @click="setRatio(r.value)"
            >{{ r.label }}</button>
          </div>
        </div>

        <div class="field">
          <label>裁剪区域（像素）</label>
          <div class="size-grid">
            <a-input-number v-model:value="editX" :min="0" :max="naturalW" size="small" addon-before="X" @change="applyCropInput('x')" />
            <a-input-number v-model:value="editY" :min="0" :max="naturalH" size="small" addon-before="Y" @change="applyCropInput('y')" />
            <a-input-number v-model:value="editW" :min="1" :max="naturalW" size="small" addon-before="宽" @change="applyCropInput('w')" />
            <a-input-number v-model:value="editH" :min="1" :max="naturalH" size="small" addon-before="高" @change="applyCropInput('h')" />
          </div>
        </div>

        <div class="field">
          <label>输出格式</label>
          <a-select v-model:value="format" size="small" @change="scheduleResult">
            <a-select-option value="jpeg">JPEG（体积小）</a-select-option>
            <a-select-option value="png">PNG（支持透明）</a-select-option>
            <a-select-option value="webp">WebP（更小）</a-select-option>
          </a-select>
        </div>

        <div class="field">
          <label>压缩质量：{{ quality }}%{{ format === 'png' ? '（PNG 不支持' : '' }}{{ format === 'png' ? '质量调节）' : '' }}</label>
          <a-slider
            v-model:value="quality"
            :min="10"
            :max="100"
            :step="1"
            :disabled="format === 'png'"
            @change="scheduleResult"
          />
        </div>

        <div class="result-card">
          <div class="result-head">
            <span>输出预览</span>
            <span class="result-dim">{{ outW }} × {{ outH }} px</span>
          </div>
          <div class="result-thumb">
            <img v-if="resultUrl" :src="resultUrl" alt="输出预览">
            <span v-else class="placeholder">生成中...</span>
          </div>
          <div class="result-row"><span>原图大小</span><b>{{ fmtSize(originalSize) }}</b></div>
          <div class="result-row"><span>输出大小</span><b class="green">{{ fmtSize(resultSize) }}</b></div>
          <div class="result-row"><span>压缩率</span><b class="green">{{ savedText }}</b></div>
        </div>

        <div class="actions">
          <a-button type="primary" :loading="processing" @click="download">下载结果</a-button>
          <a-button @click="resetCrop">重置裁剪</a-button>
          <a-button danger @click="clearAll">重新选择</a-button>
        </div>
      </div>
    </div>

    <!-- 说明 -->
    <div class="features-section">
      <h3>功能特点</h3>
      <ul>
        <li>支持自由裁剪，也可锁定 1:1、4:3、16:9 等常用比例</li>
        <li>支持画布缩放（25%~400%），放大后可精确查看和调整裁剪区域</li>
        <li>可设置压缩质量，实时显示输出体积和压缩率</li>
        <li>支持导出 JPEG / PNG / WebP 格式，PNG/WebP 可保留透明背景</li>
        <li>裁剪框可直接拖动和拉伸，也可手动输入精确像素值</li>
        <li>所有处理均在本地浏览器完成，图片不会上传，保证数据安全</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';

const fileInput = ref(null);
const stagePanel = ref(null);
const previewImg = ref(null);

const isDragging = ref(false);
const imageUrl = ref('');
const fileName = ref('');
const naturalW = ref(0);
const naturalH = ref(0);
const originalSize = ref(0);
const displayW = ref(0);
const displayH = ref(0);

const crop = ref({ x: 0, y: 0, w: 0, h: 0 });
const ratio = ref(0);
const ratios = [
  { label: '自由', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 }
];

const editX = ref(0);
const editY = ref(0);
const editW = ref(0);
const editH = ref(0);

const format = ref('jpeg');
const quality = ref(85);
const zoom = ref(100);
const fitScale = ref(1);

const resultBlob = ref(null);
const resultUrl = ref('');
const resultSize = ref(0);
const processing = ref(false);
let resultTimer = null;
let resizeTimer = null;

const displayScale = computed(() => (naturalW.value ? displayW.value / naturalW.value : 1));

const outW = computed(() => Math.max(1, Math.round(crop.value.w)));

const outH = computed(() => Math.max(1, Math.round(crop.value.h)));

const cropStyle = computed(() => ({
  left: `${crop.value.x * displayScale.value}px`,
  top: `${crop.value.y * displayScale.value}px`,
  width: `${crop.value.w * displayScale.value}px`,
  height: `${crop.value.h * displayScale.value}px`
}));

const savedText = computed(() => {
  if (!originalSize.value || !resultSize.value) return '-';
  const pct = Math.round((1 - resultSize.value / originalSize.value) * 100);
  return pct >= 0 ? `省 ${pct}%` : `增大 ${-pct}%`;
});

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const fmtSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

watch(crop, (c) => {
  editX.value = Math.round(c.x);
  editY.value = Math.round(c.y);
  editW.value = Math.round(c.w);
  editH.value = Math.round(c.h);
}, { deep: true, immediate: true });

const triggerFileInput = () => {
  fileInput.value && fileInput.value.click();
};

const handleFileSelect = (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (file) loadFile(file);
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith('image/'));
  if (!file) {
    message.warning('未识别到图片文件');
    return;
  }
  loadFile(file);
};

const loadFile = (file) => {
  clearAll(true);
  fileName.value = file.name;
  originalSize.value = file.size;
  imageUrl.value = URL.createObjectURL(file);
  zoom.value = 100;
};

const onImageLoad = () => {
  const img = previewImg.value;
  if (!img) return;
  naturalW.value = img.naturalWidth;
  naturalH.value = img.naturalHeight;
  measureDisplay();
  initCrop();
  scheduleResult(0);
};

// 计算“适应画布”的基准缩放，再叠加用户缩放比例
const measureDisplay = () => {
  if (!naturalW.value) return;
  const panel = stagePanel.value;
  const availW = Math.max(120, (panel ? panel.clientWidth : 600) - 28);
  fitScale.value = Math.min(1, availW / naturalW.value, 440 / naturalH.value);
  applyZoom();
};

const applyZoom = () => {
  if (!naturalW.value) return;
  const s = fitScale.value * (zoom.value / 100);
  displayW.value = naturalW.value * s;
  displayH.value = naturalH.value * s;
};

const setZoom = (p) => {
  zoom.value = p;
  applyZoom();
};

const initCrop = () => {
  if (!naturalW.value) return;
  if (ratio.value) {
    applyRatioCrop();
    return;
  }
  crop.value = { x: 0, y: 0, w: naturalW.value, h: naturalH.value };
};

const applyRatioCrop = () => {
  const nw = naturalW.value;
  const nh = naturalH.value;
  const r = ratio.value;
  if (!nw || !nh || !r) return;
  let w = nw;
  let h = w / r;
  if (h > nh) {
    h = nh;
    w = h * r;
  }
  crop.value = {
    x: Math.round((nw - w) / 2),
    y: Math.round((nh - h) / 2),
    w: Math.round(w),
    h: Math.round(h)
  };
};

const setRatio = (value) => {
  ratio.value = value;
  if (!naturalW.value) return;
  if (value) {
    applyRatioCrop();
  }
  scheduleResult(0);
};

const applyCropInput = (key) => {
  if (!naturalW.value) return;
  const nw = naturalW.value;
  const nh = naturalH.value;
  let x = Number(editX.value) || 0;
  let y = Number(editY.value) || 0;
  let w = Number(editW.value) || 1;
  let h = Number(editH.value) || 1;

  if (ratio.value) {
    if (key === 'w') h = Math.round(w / ratio.value);
    else if (key === 'h') w = Math.round(h * ratio.value);
  }

  w = clamp(w, 1, nw);
  h = clamp(h, 1, nh);
  if (ratio.value) {
    if (w > h * ratio.value) w = Math.round(h * ratio.value);
    else h = Math.round(w / ratio.value);
  }
  x = clamp(x, 0, nw - w);
  y = clamp(y, 0, nh - h);

  crop.value = { x, y, w, h };
  scheduleResult(0);
};

/* ---------------- 拖动裁剪框 ---------------- */
let dragState = null;

const startDrag = (e, mode) => {
  if (!naturalW.value) return;
  e.preventDefault();
  dragState = {
    mode,
    startX: e.clientX,
    startY: e.clientY,
    crop: { ...crop.value }
  };
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', stopDrag, { once: true });
};

const onDrag = (e) => {
  if (!dragState) return;
  const scale = displayScale.value || 1;
  const dx = (e.clientX - dragState.startX) / scale;
  const dy = (e.clientY - dragState.startY) / scale;
  const c = dragState.crop;
  const nw = naturalW.value;
  const nh = naturalH.value;
  const minSize = Math.max(8, Math.round(Math.min(nw, nh) * 0.05));

  if (dragState.mode === 'move') {
    const x = clamp(c.x + dx, 0, nw - c.w);
    const y = clamp(c.y + dy, 0, nh - c.h);
    crop.value = { x, y, w: c.w, h: c.h };
    return;
  }

  const anchorX = dragState.mode.includes('w') ? c.x + c.w : c.x;
  const anchorY = dragState.mode.includes('n') ? c.y + c.h : c.y;
  const maxW = dragState.mode.includes('w') ? anchorX : nw - anchorX;
  const maxH = dragState.mode.includes('n') ? anchorY : nh - anchorY;

  let w = dragState.mode.includes('w') ? c.w - dx : c.w + dx;
  let h = dragState.mode.includes('n') ? c.h - dy : c.h + dy;

  if (ratio.value) {
    w = clamp(w, minSize, Math.min(maxW, maxH * ratio.value));
    h = Math.round(w / ratio.value);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio.value);
    }
  } else {
    w = clamp(w, minSize, maxW);
    h = clamp(h, minSize, maxH);
  }

  const x = dragState.mode.includes('w') ? anchorX - w : anchorX;
  const y = dragState.mode.includes('n') ? anchorY - h : anchorY;
  crop.value = { x, y, w, h };
};

const stopDrag = () => {
  window.removeEventListener('pointermove', onDrag);
  dragState = null;
  scheduleResult();
};

/* ---------------- 生成压缩结果 ---------------- */
const scheduleResult = (delay = 250) => {
  clearTimeout(resultTimer);
  resultTimer = setTimeout(updateResult, delay);
};

const updateResult = () => {
  const img = previewImg.value;
  const c = crop.value;
  if (!img || !naturalW.value || !c.w || !c.h) return;

  processing.value = true;
  const w = outW.value;
  const h = outH.value;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (format.value === 'jpeg') {
    // JPEG 不支持透明，先铺白底，避免透明区域变黑
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, w, h);

  const mime = `image/${format.value}`;
  const q = format.value === 'png' ? undefined : quality.value / 100;

  canvas.toBlob((blob) => {
    processing.value = false;
    if (!blob) {
      message.error('生成失败，请尝试更换输出格式');
      return;
    }
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
    resultBlob.value = blob;
    resultUrl.value = URL.createObjectURL(blob);
    resultSize.value = blob.size;
  }, mime, q);
};

/* ---------------- 下载与重置 ---------------- */
const extOf = () => (format.value === 'png' ? 'png' : format.value === 'webp' ? 'webp' : 'jpg');

const baseName = (name) => {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
};

const saveBlob = (blob, filename) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

const download = () => {
  if (!resultBlob.value) {
    scheduleResult(0);
    message.warning('结果还在生成，请稍候');
    return;
  }
  const filename = `${baseName(fileName.value)}_裁剪_${outW.value}x${outH.value}.${extOf()}`;
  saveBlob(resultBlob.value, filename);
  message.success('已下载：' + filename);
};

const resetCrop = () => {
  ratio.value = 0;
  initCrop();
  scheduleResult(0);
};

const clearAll = (keepData = false) => {
  clearTimeout(resultTimer);
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  resultUrl.value = '';
  resultBlob.value = null;
  resultSize.value = 0;
  resultTimer = null;
  if (!keepData) {
    imageUrl.value = '';
    fileName.value = '';
    naturalW.value = 0;
    naturalH.value = 0;
    originalSize.value = 0;
    crop.value = { x: 0, y: 0, w: 0, h: 0 };
    ratio.value = 0;
    zoom.value = 100;
    fitScale.value = 1;
  }
};

const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(measureDisplay, 120);
};

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('pointermove', onDrag);
  clearTimeout(resultTimer);
  clearTimeout(resizeTimer);
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
});
</script>

<style scoped>
.crop-container {
  font-family: Arial, sans-serif;
  max-width: 900px;
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

.upload-icon {
  font-size: 48px;
  line-height: 1;
}

.editor-layout {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.canvas-panel {
  flex: 1;
  min-width: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.stage-scroll {
  max-height: 470px;
  overflow: auto;
  background: #f0f0f0;
  border-radius: 4px;
}

.image-stage {
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
  user-select: none;
}

.stage-img {
  display: block;
  width: 100%;
  height: 100%;
  -webkit-user-drag: none;
}

.crop-box {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #fff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
  cursor: move;
  touch-action: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.45);
  pointer-events: none;
}

.gx1,
.gx2 {
  top: 0;
  bottom: 0;
  width: 1px;
}

.gx1 {
  left: 33.33%;
}

.gx2 {
  left: 66.66%;
}

.gy1,
.gy2 {
  left: 0;
  right: 0;
  height: 1px;
}

.gy1 {
  top: 33.33%;
}

.gy2 {
  top: 66.66%;
}

.handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 2px solid #1890ff;
  border-radius: 2px;
  box-sizing: border-box;
}

.handle.nw {
  top: -8px;
  left: -8px;
  cursor: nwse-resize;
}

.handle.ne {
  top: -8px;
  right: -8px;
  cursor: nesw-resize;
}

.handle.sw {
  bottom: -8px;
  left: -8px;
  cursor: nesw-resize;
}

.handle.se {
  bottom: -8px;
  right: -8px;
  cursor: nwse-resize;
}

.stage-meta {
  margin-top: 10px;
  font-size: 12px;
  color: #888;
}

.stage-meta .tip-text {
  margin-left: 10px;
  color: #aaa;
}

.settings-panel {
  width: 320px;
  flex-shrink: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
}

.ratio-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ratio-btn {
  padding: 4px 12px;
  font-size: 13px;
  color: #555;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.ratio-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.ratio-btn.active {
  color: #fff;
  background: #1890ff;
  border-color: #1890ff;
}

.size-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.scale-quick {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.result-card {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 6px;
}

.result-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: #666;
}

.result-dim {
  color: #1890ff;
  font-weight: bold;
}

.result-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110px;
  margin-bottom: 10px;
  overflow: hidden;
  background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 16px 16px;
  border-radius: 4px;
}

.result-thumb img {
  max-width: 100%;
  max-height: 110px;
  object-fit: contain;
}

.result-thumb .placeholder {
  font-size: 12px;
  color: #aaa;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 13px;
  color: #666;
}

.result-row .green {
  color: #52c41a;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions :deep(.ant-btn) {
  flex: 1;
}

.features-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.features-section h3 {
  color: #34495e;
  margin-bottom: 15px;
}

.features-section ul {
  list-style-type: none;
  padding: 0;
}

.features-section li {
  margin-bottom: 10px;
  padding-left: 24px;
  position: relative;
  color: #666;
}

.features-section li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #1890ff;
  font-weight: bold;
}

@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }

  .settings-panel {
    width: 100%;
  }
}
</style>
