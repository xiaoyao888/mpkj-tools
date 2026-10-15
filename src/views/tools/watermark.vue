<template>
  <div class="watermark-container">
    <h2 class="title">图片加水印工具</h2>

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
        <p>点击或拖放图片到此处</p>
        <p class="hint">支持 JPG / PNG / WebP 等，可多选，所有处理均在本地完成，图片不会上传</p>
      </div>
    </div>

    <!-- 水印设置 -->
    <div v-if="images.length" class="options-area">
      <a-row :gutter="16">
        <a-col :span="24">
          <label>水印文字</label>
          <a-input v-model:value="text" placeholder="请输入水印文字，如：仅供内部使用" allow-clear />
        </a-col>
      </a-row>
      <a-row :gutter="16" style="margin-top: 14px">
        <a-col :span="6">
          <label>字体大小：{{ fontSize }}px</label>
          <a-slider v-model:value="fontSize" :min="10" :max="200" :step="1" />
        </a-col>
        <a-col :span="6">
          <label>旋转角度：{{ angle }}°</label>
          <a-slider v-model:value="angle" :min="-90" :max="90" :step="1" />
        </a-col>
        <a-col :span="6">
          <label>文字颜色</label>
          <div class="color-field">
            <input v-model="color" type="color" class="color-picker">
            <span class="color-value">{{ color }}</span>
          </div>
        </a-col>
        <a-col :span="6">
          <label>透明度：{{ Math.round(opacity * 100) }}%</label>
          <a-slider v-model:value="opacity" :min="0.05" :max="1" :step="0.05" />
        </a-col>
      </a-row>
      <a-row :gutter="16" style="margin-top: 14px">
        <a-col :span="8">
          <label>水平间距：{{ gapX }}px</label>
          <a-slider v-model:value="gapX" :min="0" :max="600" :step="10" />
        </a-col>
        <a-col :span="8">
          <label>垂直间距：{{ gapY }}px</label>
          <a-slider v-model:value="gapY" :min="0" :max="600" :step="10" />
        </a-col>
        <a-col :span="8">
          <label>输出格式</label>
          <a-select v-model:value="format" style="width: 100%">
            <a-select-option value="png">PNG（支持透明）</a-select-option>
            <a-select-option value="jpeg">JPEG（体积小）</a-select-option>
          </a-select>
        </a-col>
      </a-row>
    </div>

    <!-- 预览与列表 -->
    <div v-if="images.length" class="preview-area">
      <div class="list-header">
        <span>已选 {{ images.length }} 张图片</span>
        <div class="ops">
          <a-button size="small" @click="refreshAll">刷新预览</a-button>
          <a-button size="small" danger @click="clearAll">清空</a-button>
        </div>
      </div>
      <div class="thumb-grid">
        <div v-for="(img, idx) in images" :key="img.id" class="thumb">
          <div class="thumb-num">{{ idx + 1 }}</div>
          <img :src="img.preview" alt="" @click.stop="previewImage(img)">
          <div class="thumb-meta">{{ img.width }}×{{ img.height }}</div>
          <div class="thumb-ops">
            <a-button size="small" type="primary" @click="downloadOne(idx)">下载</a-button>
            <a-button size="small" danger @click="remove(idx)">删除</a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作 -->
    <div v-if="images.length" class="action-area">
      <a-button type="primary" size="large" :loading="isProcessing" @click="downloadAll">
        {{ isProcessing ? '处理中...' : '批量下载全部（含 ZIP）' }}
      </a-button>
    </div>

    <!-- 说明 -->
    <div class="features-section">
      <h3>功能特点</h3>
      <ul>
        <li>支持自定义水印文字内容，一键批量添加</li>
        <li>支持调整字体大小、旋转角度、文字颜色和透明度</li>
        <li>支持调整水印水平/垂直间距，可平铺整张图片</li>
        <li>点击缩略图可弹窗查看大图，方便核对水印效果</li>
        <li>所有处理均在本地浏览器完成，图片不会上传，保证数据安全</li>
      </ul>
    </div>

    <!-- 大图预览弹窗 -->
    <a-modal
      :open="previewVisible"
      :title="previewItem ? previewItem.name : ''"
      :footer="null"
      width="auto"
      centered
      @cancel="previewVisible = false"
    >
      <div class="preview-modal">
        <img v-if="previewItem" :src="previewItem.preview" :alt="previewItem.name">
        <div v-if="previewItem" class="preview-meta">
          {{ previewItem.width }} × {{ previewItem.height }} px
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import JSZip from 'jszip';

const fileInput = ref(null);
const images = ref([]);
const isDragging = ref(false);
const isProcessing = ref(false);

// 水印参数
const text = ref('仅供内部使用');
const fontSize = ref(36);
const angle = ref(-30);
const color = ref('#888888');
const opacity = ref(0.3);
const gapX = ref(120);
const gapY = ref(120);
const format = ref('png');
let seq = 0;
let renderTimer = null;

// 大图预览弹窗状态
const previewVisible = ref(false);
const previewItem = ref(null);

const previewImage = (item) => {
  previewItem.value = item;
  previewVisible.value = true;
};

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
      const item = {
        id: ++seq,
        url,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        el: img,
        preview: url,
        blob: null
      };
      images.value.push(item);
      renderOne(item);
    };
    img.src = url;
  });
}

function remove(i) {
  const [target] = images.value.splice(i, 1);
  URL.revokeObjectURL(target.url);
  if (previewItem.value === target) {
    previewItem.value = null;
    previewVisible.value = false;
  }
}

function clearAll() {
  images.value.forEach((it) => URL.revokeObjectURL(it.url));
  images.value = [];
  previewItem.value = null;
  previewVisible.value = false;
}

// 参数变化时防抖重绘，避免频繁计算
watch([text, fontSize, angle, color, opacity, gapX, gapY], () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => refreshAll(), 200);
});

function refreshAll() {
  images.value.forEach((it) => renderOne(it));
}

// 核心：在图片上平铺绘制旋转水印
function renderOne(item) {
  const { width, height, el } = item;
  if (!width || !height) return;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // 白底，避免透明区域导出 JPEG 变黑
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(el, 0, 0, width, height);

  const wmText = text.value.trim();
  if (wmText) {
    const size = fontSize.value;
    ctx.font = `bold ${size}px "Microsoft YaHei", Arial, sans-serif`;
    ctx.fillStyle = color.value;
    ctx.globalAlpha = opacity.value;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const rad = (angle.value * Math.PI) / 180;
    // 平铺步长至少为文字尺寸 + 间距，防止水印重叠
    const textW = ctx.measureText(wmText).width;
    const stepX = Math.max(textW + gapX.value, size + gapX.value);
    const stepY = Math.max(size + gapY.value, size * 2);

    // 旋转水印，循环范围扩展以覆盖旋转后产生的空角
    const diag = Math.sqrt(width * width + height * height);
    for (let y = -diag; y < height + diag; y += stepY) {
      for (let x = -diag; x < width + diag; x += stepX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rad);
        ctx.fillText(wmText, 0, 0);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  const mime = format.value === 'jpeg' ? 'image/jpeg' : 'image/png';
  item.preview = canvas.toDataURL(mime, 0.92);
  canvas.toBlob((blob) => { item.blob = blob; }, mime, 0.92);
}

function extOf() {
  return format.value === 'jpeg' ? 'jpg' : 'png';
}

function baseName(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}

async function ensureBlob(item) {
  if (!item.blob) renderOne(item);
  // blob 为异步生成，等待一帧
  await new Promise((r) => setTimeout(r, 0));
  return item.blob;
}

function saveBlobUrl(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function downloadOne(i) {
  const item = images.value[i];
  isProcessing.value = true;
  try {
    const blob = await ensureBlob(item);
    saveBlobUrl(blob, `${baseName(item.name)}_水印.${extOf()}`);
    message.success('已下载：' + item.name);
  } catch (err) {
    console.error(err);
    message.error('下载失败，请重试');
  } finally {
    isProcessing.value = false;
  }
}

async function downloadAll() {
  if (!images.value.length) {
    message.warning('请先选择图片');
    return;
  }
  isProcessing.value = true;
  try {
    const zip = new JSZip();
    const used = new Set();
    for (const item of images.value) {
      const blob = await ensureBlob(item);
      let name = `${baseName(item.name)}_水印.${extOf()}`;
      // 重名时追加序号，避免打包覆盖
      if (used.has(name)) {
        name = `${baseName(item.name)}_水印_${used.size + 1}.${extOf()}`;
      }
      used.add(name);
      zip.file(name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveBlobUrl(content, `图片水印_${stamp()}.zip`);
    message.success('已打包 ' + images.value.length + ' 张图片');
  } catch (err) {
    console.error(err);
    message.error('打包失败，请重试');
  } finally {
    isProcessing.value = false;
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
.watermark-container {
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

.color-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 40px;
  height: 32px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-size: 12px;
  color: #999;
}

.preview-area {
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

.list-header .ops {
  display: flex;
  gap: 8px;
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
  cursor: zoom-in;
}

.thumb img:hover {
  filter: brightness(0.95);
}

.preview-modal {
  text-align: center;
}

.preview-modal img {
  max-width: min(80vw, 900px);
  max-height: 72vh;
  object-fit: contain;
  background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 16px 16px;
}

.preview-meta {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
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
