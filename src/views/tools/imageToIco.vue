<template>
  <div class="ico-container">
    <h2 class="title">图片转 ICO 工具</h2>

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
        <p class="hint">支持 PNG / JPG / WebP，所有处理均在本地完成，图片不会上传</p>
      </div>
    </div>

    <template v-else>
      <div class="edit-panel">
        <div class="source-box">
          <div class="source-title">原图</div>
          <img :src="imageUrl" class="source-img" alt="原图">
          <div class="source-meta">{{ naturalW }} × {{ naturalH }} px · {{ fmtSize(originalSize) }}</div>
        </div>

        <div class="settings-box">
          <div class="field">
            <label>选择 ICO 尺寸（可多选，最大 256×256）</label>
            <a-checkbox-group v-model:value="sizes" class="size-checks">
              <a-checkbox v-for="s in sizeOptions" :key="s" :value="s">{{ s }}×{{ s }}</a-checkbox>
            </a-checkbox-group>
          </div>

          <div class="size-tip">
            推荐勾选 16 / 32 / 48 / 256，覆盖任务栏、桌面图标与高清显示。图片会按比例居中缩放，多余区域透明。
          </div>

          <div class="result-card">
            <div class="result-row"><span>包含尺寸</span><b>{{ sizes.length }} 个</b></div>
            <div class="result-row"><span>ICO 体积</span><b class="green">{{ fmtSize(icoSize) }}</b></div>
          </div>

          <div class="actions">
            <a-button type="primary" :disabled="!sizes.length || generating" :loading="generating" @click="download">
              下载 ICO
            </a-button>
            <a-button danger @click="clearAll">重新选择</a-button>
          </div>
        </div>
      </div>

      <div class="preview-section">
        <div class="preview-head">图标预览</div>
        <div class="preview-grid">
          <div v-for="p in previews" :key="p.size" class="preview-item">
            <div class="preview-img">
              <img :src="p.url" :alt="`${p.size}px`" :style="previewStyle(p.size)">
            </div>
            <div class="preview-size">{{ p.size }} × {{ p.size }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 说明 -->
    <div class="features-section">
      <h3>功能特点</h3>
      <ul>
        <li>一次生成多尺寸 ICO，兼容 Windows 任务栏、桌面、浏览器等场景</li>
        <li>支持 16、24、32、48、64、128、256 像素，按需勾选</li>
        <li>非正方形图片自动按比例居中，空白区域透明</li>
        <li>生成后实时预览各尺寸效果，并显示 ICO 文件体积</li>
        <li>所有处理均在本地浏览器完成，图片不会上传，保证数据安全</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';

const fileInput = ref(null);
const isDragging = ref(false);
const imageUrl = ref('');
const fileName = ref('');
const originalSize = ref(0);
const naturalW = ref(0);
const naturalH = ref(0);
const imageEl = ref(null);

const sizeOptions = [16, 24, 32, 48, 64, 128, 256];
const sizes = ref([16, 32, 48, 256]);
const previews = ref([]);
const icoBlob = ref(null);
const icoSize = ref(0);
const generating = ref(false);
let genTimer = null;

const fmtSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const previewStyle = (size) => ({
  width: `${Math.min(120, size)}px`,
  height: `${Math.min(120, size)}px`
});

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

  const img = new Image();
  img.onload = () => {
    naturalW.value = img.naturalWidth;
    naturalH.value = img.naturalHeight;
    imageEl.value = img;
    generate();
  };
  img.onerror = () => message.error('图片加载失败，请更换文件');
  img.src = imageUrl.value;
};

watch(sizes, () => {
  clearTimeout(genTimer);
  genTimer = setTimeout(generate, 150);
}, { deep: true });

/* 将图片按比例居中绘制到 size×size 画布 */
const drawToCanvas = (size) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const nw = naturalW.value;
  const nh = naturalH.value;
  const scale = Math.min(size / nw, size / nh);
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));
  const x = Math.round((size - w) / 2);
  const y = Math.round((size - h) / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageEl.value, x, y, w, h);
  return canvas;
};

const blobToBuffer = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

const canvasToPngBlob = (canvas) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

/* 按 ICO 规范拼接：6 字节文件头 + 16 字节目录项/图 + PNG 数据 */
const buildIco = async (canvasList) => {
  const entries = [];
  for (const { size, canvas } of canvasList) {
    const blob = await canvasToPngBlob(canvas);
    const buffer = await blobToBuffer(blob);
    entries.push({ size, buffer });
  }

  const headerSize = 6 + entries.length * 16;
  const total = headerSize + entries.reduce((sum, e) => sum + e.buffer.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  // ICONDIR：保留位 0，类型 1（图标），图像数量
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);

  let offset = headerSize;
  entries.forEach((e, i) => {
    const p = 6 + i * 16;
    out[p] = e.size >= 256 ? 0 : e.size; // 256 用 0 表示
    out[p + 1] = e.size >= 256 ? 0 : e.size;
    out[p + 2] = 0; // 调色板数量
    out[p + 3] = 0; // 保留
    view.setUint16(p + 4, 1, true); // 颜色平面
    view.setUint16(p + 6, 32, true); // 位深
    view.setUint32(p + 8, e.buffer.length, true);
    view.setUint32(p + 12, offset, true);
    out.set(e.buffer, offset);
    offset += e.buffer.length;
  });

  return new Blob([out], { type: 'image/x-icon' });
};

const generate = async () => {
  if (!imageEl.value || !naturalW.value) return;
  if (!sizes.value.length) {
    previews.value = [];
    icoBlob.value = null;
    icoSize.value = 0;
    return;
  }

  generating.value = true;
  try {
    const sorted = [...sizes.value].sort((a, b) => a - b);
    previews.value = sorted.map((size) => {
      const canvas = drawToCanvas(size);
      return { size, url: canvas.toDataURL('image/png'), canvas };
    });

    const ico = await buildIco(previews.value.map((p) => ({ size: p.size, canvas: p.canvas })));
    icoBlob.value = ico;
    icoSize.value = ico.size;
  } catch (err) {
    console.error(err);
    message.error('生成 ICO 失败，请重试');
  } finally {
    generating.value = false;
  }
};

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
  if (!sizes.value.length) {
    message.warning('请至少选择一个尺寸');
    return;
  }
  if (!icoBlob.value) {
    message.warning('ICO 还在生成，请稍候');
    return;
  }
  const filename = `${baseName(fileName.value)}.ico`;
  saveBlob(icoBlob.value, filename);
  message.success('已下载：' + filename);
};

const clearAll = (keepData = false) => {
  clearTimeout(genTimer);
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  icoBlob.value = null;
  icoSize.value = 0;
  imageEl.value = null;
  previews.value = [];
  if (!keepData) {
    imageUrl.value = '';
    fileName.value = '';
    originalSize.value = 0;
    naturalW.value = 0;
    naturalH.value = 0;
    sizes.value = [16, 32, 48, 256];
  }
};

onUnmounted(() => {
  clearTimeout(genTimer);
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
});
</script>

<style scoped>
.ico-container {
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

.upload-icon {
  font-size: 48px;
  line-height: 1;
}

.edit-panel {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.source-box {
  width: 240px;
  flex-shrink: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  text-align: center;
}

.source-title {
  margin-bottom: 10px;
  font-size: 13px;
  color: #666;
  text-align: left;
}

.source-img {
  display: block;
  max-width: 100%;
  max-height: 200px;
  margin: 0 auto;
  object-fit: contain;
  background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 16px 16px;
  border-radius: 4px;
}

.source-meta {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
  word-break: break-all;
}

.settings-box {
  flex: 1;
  min-width: 0;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.field {
  margin-bottom: 12px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.size-checks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 6px;
}

.size-tip {
  margin-bottom: 14px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #888;
  background: #fafafa;
  border-radius: 4px;
}

.result-card {
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 6px;
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

.preview-section {
  margin-top: 20px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.preview-head {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: bold;
  color: #34495e;
}

.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: flex-end;
}

.preview-item {
  text-align: center;
}

.preview-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128px;
  height: 128px;
  background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 16px 16px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.preview-img img {
  image-rendering: auto;
}

.preview-size {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
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
  .edit-panel {
    flex-direction: column;
  }

  .source-box {
    width: 100%;
    box-sizing: border-box;
  }

  .preview-grid {
    justify-content: center;
  }
}
</style>
