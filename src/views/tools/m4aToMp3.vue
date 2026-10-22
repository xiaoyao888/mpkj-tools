<template>
  <main class="converter-container">
    <header class="page-header">
      <div class="header-icon"><AudioOutlined /></div>
      <div>
        <h2>M4A 批量转 MP3</h2>
        <p>音频仅在当前浏览器中处理，不会上传到服务器</p>
      </div>
    </header>

    <section
      class="upload-area"
      :class="{ dragover: isDragging, disabled: isBusy }"
      role="button"
      tabindex="0"
      @click="triggerFileInput"
      @keydown.enter.prevent="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".m4a,audio/mp4,audio/x-m4a"
        multiple
        hidden
        @change="handleFileSelect"
      >
      <UploadOutlined class="upload-icon" />
      <p class="upload-title">点击选择或拖放多个 M4A 文件</p>
      <p class="upload-hint">最多 100 个文件，每个不超过 500 MB，可继续添加</p>
    </section>

    <section v-if="items.length" class="file-panel">
      <div class="list-header">
        <div>
          <strong>转换队列</strong>
          <span>{{ items.length }} 个文件 · {{ formatFileSize(totalInputSize) }}</span>
        </div>
        <a-button type="link" danger :disabled="isBusy" @click="clearAll">清空</a-button>
      </div>

      <div class="settings-row">
        <label for="bitrate">MP3 音质</label>
        <a-select
          id="bitrate"
          v-model:value="bitrate"
          :disabled="isBusy"
          @change="handleBitrateChange"
        >
          <a-select-option :value="128">标准 · 128 kbps</a-select-option>
          <a-select-option :value="192">较高 · 192 kbps</a-select-option>
          <a-select-option :value="256">高品质 · 256 kbps</a-select-option>
          <a-select-option :value="320">最高 · 320 kbps</a-select-option>
        </a-select>
        <span class="estimate">预计合计约 {{ estimatedSize }}</span>
      </div>

      <div class="file-list">
        <article
          v-for="item in items"
          :key="item.id"
          class="file-item"
          :class="`status-${item.status}`"
        >
          <div class="file-row">
            <div class="file-icon">
              <CheckCircleFilled v-if="item.status === 'done'" />
              <LoadingOutlined v-else-if="item.status === 'converting'" />
              <ExclamationCircleFilled v-else-if="item.status === 'error'" />
              <FileOutlined v-else />
            </div>
            <div class="file-details">
              <strong :title="item.file.name">{{ item.file.name }}</strong>
              <span>
                {{ formatFileSize(item.file.size) }}
                <template v-if="item.duration"> · {{ formatDuration(item.duration) }}</template>
                <template v-if="item.status === 'done'"> · {{ formatFileSize(item.outputBlob.size) }}</template>
              </span>
            </div>
            <span class="file-status">{{ itemStatusText(item) }}</span>
            <a-tooltip v-if="item.status === 'done'" title="下载 MP3">
              <a-button
                type="text"
                aria-label="下载 MP3"
                @click="downloadItem(item)"
              >
                <template #icon><DownloadOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="移除文件">
              <a-button
                type="text"
                danger
                :aria-label="`移除 ${item.file.name}`"
                :disabled="isBusy"
                @click="removeItem(item.id)"
              >
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-tooltip>
          </div>

          <a-progress
            v-if="item.status === 'converting'"
            class="item-progress"
            :percent="Math.round(item.progress)"
            :show-info="false"
            size="small"
          />
          <p v-if="item.status === 'error'" class="item-error">{{ item.error }}</p>
          <audio
            v-if="item.status === 'done'"
            :src="item.outputUrl"
            controls
            preload="metadata"
          ></audio>
        </article>
      </div>
    </section>

    <section v-if="isBusy" class="progress-panel" aria-live="polite">
      <div class="progress-copy">
        <span>{{ statusText }}</span>
        <strong>{{ displayProgress }}%</strong>
      </div>
      <a-progress :percent="displayProgress" :show-info="false" status="active" />
      <p v-if="stage === 'loading'">首次使用需加载约 31 MB 的转换组件，后续访问通常由浏览器缓存。</p>
    </section>

    <div v-if="items.length" class="actions">
      <a-button
        v-if="!isBusy && convertibleCount"
        type="primary"
        size="large"
        @click="convertBatch"
      >
        <template #icon><SwapOutlined /></template>
        转换 {{ convertibleCount }} 个文件
      </a-button>
      <a-button
        v-if="isConverting"
        danger
        size="large"
        @click="cancelConversion"
      >
        <template #icon><CloseOutlined /></template>
        取消转换
      </a-button>
      <a-button
        v-if="completedItems.length"
        size="large"
        :loading="stage === 'packing'"
        :disabled="isConverting"
        @click="downloadAll"
      >
        <template #icon><DownloadOutlined /></template>
        {{ completedItems.length > 1 ? `打包下载 ${completedItems.length} 个 MP3` : '下载 MP3' }}
      </a-button>
    </div>

    <section class="notes">
      <h3>使用说明</h3>
      <div class="note-grid">
        <div><SafetyCertificateOutlined /><span><strong>本地处理</strong>音频不离开你的设备</span></div>
        <div><SoundOutlined /><span><strong>批量队列</strong>逐个转换以控制内存占用</span></div>
        <div><ThunderboltOutlined /><span><strong>统一下载</strong>多个结果可打包为 ZIP</span></div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  AudioOutlined,
  CheckCircleFilled,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  FileOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  SoundOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UploadOutlined
} from '@ant-design/icons-vue';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_FILE_COUNT = 100;
const INPUT_FILE = 'input.m4a';
const OUTPUT_FILE = 'output.mp3';

const fileInput = ref(null);
const items = ref([]);
const bitrate = ref(192);
const isDragging = ref(false);
const stage = ref('idle');
const progress = ref(0);
const currentName = ref('');
const batchPosition = ref(0);
const batchTotal = ref(0);

let nextId = 0;
let ffmpeg = createFFmpeg();
let cancelled = false;
const metadataUrls = new Set();

const isConverting = computed(() => stage.value === 'loading' || stage.value === 'converting');
const isBusy = computed(() => isConverting.value || stage.value === 'packing');
const displayProgress = computed(() => Math.min(100, Math.max(0, Math.round(progress.value))));
const completedItems = computed(() => items.value.filter((item) => item.status === 'done'));
const convertibleCount = computed(() => items.value.filter((item) => item.status !== 'done').length);
const totalInputSize = computed(() => items.value.reduce((sum, item) => sum + item.file.size, 0));
const estimatedSize = computed(() => {
  const totalDuration = items.value.reduce((sum, item) => sum + item.duration, 0);
  return totalDuration
    ? formatFileSize((totalDuration * bitrate.value * 1000) / 8)
    : '按所选码率输出';
});
const statusText = computed(() => {
  if (stage.value === 'loading') return '正在加载转换组件';
  if (stage.value === 'packing') return '正在打包 MP3 文件';
  return `正在转换 ${batchPosition.value}/${batchTotal.value}：${currentName.value}`;
});

function createFFmpeg() {
  const instance = new FFmpeg();
  instance.on('progress', ({ progress: value }) => {
    if (stage.value !== 'converting' || !Number.isFinite(value)) return;
    const normalized = Math.min(1, Math.max(0, value));
    const current = items.value.find((item) => item.status === 'converting');
    if (current) current.progress = normalized * 100;
    progress.value = ((batchPosition.value - 1 + normalized) / batchTotal.value) * 100;
  });
  return instance;
}

function triggerFileInput() {
  if (!isBusy.value) fileInput.value?.click();
}

function handleDragOver(event) {
  if (!isBusy.value && event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
    isDragging.value = true;
  }
}

function handleDrop(event) {
  isDragging.value = false;
  if (!isBusy.value) addFiles(event.dataTransfer?.files);
}

function handleFileSelect(event) {
  addFiles(event.target.files);
  event.target.value = '';
}

function addFiles(fileList) {
  const incoming = Array.from(fileList || []);
  if (!incoming.length) return;

  const existingKeys = new Set(items.value.map((item) => fileKey(item.file)));
  let invalidCount = 0;
  let oversizedCount = 0;
  let duplicateCount = 0;
  let limitCount = 0;

  for (const file of incoming) {
    if (!file.name.toLowerCase().endsWith('.m4a')) {
      invalidCount += 1;
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      oversizedCount += 1;
      continue;
    }
    const key = fileKey(file);
    if (existingKeys.has(key)) {
      duplicateCount += 1;
      continue;
    }
    if (items.value.length >= MAX_FILE_COUNT) {
      limitCount += 1;
      continue;
    }

    existingKeys.add(key);
    const item = {
      id: ++nextId,
      file,
      duration: 0,
      status: 'pending',
      progress: 0,
      error: '',
      outputBlob: null,
      outputUrl: '',
      outputName: ''
    };
    items.value.push(item);
    loadDuration(item);
  }

  const warnings = [];
  if (invalidCount) warnings.push(`${invalidCount} 个非 M4A 文件`);
  if (oversizedCount) warnings.push(`${oversizedCount} 个超大文件`);
  if (duplicateCount) warnings.push(`${duplicateCount} 个重复文件`);
  if (limitCount) warnings.push(`${limitCount} 个超出数量限制的文件`);
  if (warnings.length) message.warning(`已忽略：${warnings.join('、')}`);
}

function loadDuration(item) {
  const url = URL.createObjectURL(item.file);
  metadataUrls.add(url);
  const audio = new Audio();
  const cleanup = () => {
    URL.revokeObjectURL(url);
    metadataUrls.delete(url);
  };
  audio.preload = 'metadata';
  audio.onloadedmetadata = () => {
    if (Number.isFinite(audio.duration) && items.value.some((entry) => entry.id === item.id)) {
      item.duration = audio.duration;
    }
    cleanup();
  };
  audio.onerror = cleanup;
  audio.src = url;
}

async function convertBatch() {
  const queue = items.value.filter((item) => item.status !== 'done');
  if (!queue.length) return;

  cancelled = false;
  batchPosition.value = 0;
  batchTotal.value = queue.length;
  progress.value = 0;
  queue.forEach((item) => resetItemResult(item));
  const engine = ffmpeg;

  try {
    if (!engine.loaded) {
      stage.value = 'loading';
      await engine.load({ coreURL, wasmURL });
    }
    if (cancelled) return;

    for (let index = 0; index < queue.length; index += 1) {
      if (cancelled) break;
      const item = queue[index];
      batchPosition.value = index + 1;
      currentName.value = item.file.name;
      stage.value = 'converting';
      item.status = 'converting';
      item.progress = 1;
      progress.value = (index / queue.length) * 100;

      try {
        await engine.writeFile(INPUT_FILE, await fetchFile(item.file));
        const exitCode = await engine.exec([
          '-i', INPUT_FILE,
          '-vn',
          '-map_metadata', '0',
          '-codec:a', 'libmp3lame',
          '-b:a', `${bitrate.value}k`,
          '-id3v2_version', '3',
          OUTPUT_FILE
        ]);
        if (cancelled) {
          item.status = 'pending';
          break;
        }
        if (exitCode !== 0) throw new Error(`FFmpeg exited with code ${exitCode}`);

        const data = await engine.readFile(OUTPUT_FILE);
        item.outputBlob = new Blob([data], { type: 'audio/mpeg' });
        item.outputUrl = URL.createObjectURL(item.outputBlob);
        item.outputName = outputNameFor(item);
        item.status = 'done';
        item.progress = 100;
      } catch (error) {
        if (cancelled) {
          item.status = 'pending';
          break;
        }
        console.error(`Failed to convert ${item.file.name}`, error);
        item.status = 'error';
        item.error = '转换失败，请确认文件有效后重试';
      } finally {
        if (engine.loaded) {
          await Promise.allSettled([
            engine.deleteFile(INPUT_FILE),
            engine.deleteFile(OUTPUT_FILE)
          ]);
        }
      }
      progress.value = ((index + 1) / queue.length) * 100;
    }

    if (!cancelled) {
      const successCount = queue.filter((item) => item.status === 'done').length;
      const failedCount = queue.filter((item) => item.status === 'error').length;
      if (successCount) message.success(`已完成 ${successCount} 个文件${failedCount ? `，${failedCount} 个失败` : ''}`);
      else message.error('所选文件均转换失败，请检查文件后重试');
    }
  } catch (error) {
    if (!cancelled) {
      console.error(error);
      message.error('转换组件加载失败，请刷新页面后重试');
    }
  } finally {
    const active = items.value.find((item) => item.status === 'converting');
    if (active) active.status = 'pending';
    stage.value = 'idle';
    currentName.value = '';
  }
}

function cancelConversion() {
  cancelled = true;
  const active = items.value.find((item) => item.status === 'converting');
  if (active) {
    active.status = 'pending';
    active.progress = 0;
  }
  ffmpeg.terminate();
  ffmpeg = createFFmpeg();
  stage.value = 'idle';
  progress.value = 0;
  message.info('已取消，完成的文件仍可下载');
}

async function downloadAll() {
  if (completedItems.value.length === 1) {
    downloadItem(completedItems.value[0]);
    return;
  }
  if (!completedItems.value.length) return;

  stage.value = 'packing';
  progress.value = 0;
  try {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    completedItems.value.forEach((item) => zip.file(item.outputName, item.outputBlob));
    const blob = await zip.generateAsync({ type: 'blob' }, ({ percent }) => {
      progress.value = percent;
    });
    const url = URL.createObjectURL(blob);
    downloadUrl(url, `M4A转MP3_${timestamp()}.zip`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error(error);
    message.error('打包失败，请单独下载文件');
  } finally {
    stage.value = 'idle';
  }
}

function downloadItem(item) {
  if (item.outputUrl) downloadUrl(item.outputUrl, item.outputName);
}

function downloadUrl(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function handleBitrateChange() {
  if (!completedItems.value.length) return;
  items.value.forEach((item) => resetItemResult(item));
  message.info('音质已更改，请重新转换');
}

function resetItemResult(item) {
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  item.outputBlob = null;
  item.outputUrl = '';
  item.outputName = '';
  item.error = '';
  item.progress = 0;
  item.status = 'pending';
}

function removeItem(id) {
  const index = items.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  resetItemResult(items.value[index]);
  items.value.splice(index, 1);
}

function clearAll() {
  items.value.forEach(resetItemResult);
  items.value = [];
  progress.value = 0;
}

function itemStatusText(item) {
  return {
    pending: '等待转换',
    converting: `${Math.round(item.progress)}%`,
    done: '已完成',
    error: '失败'
  }[item.status];
}

function outputNameFor(item) {
  const base = fileBaseName(item.file.name);
  const itemIndex = items.value.findIndex((entry) => entry.id === item.id);
  const occurrence = items.value
    .slice(0, itemIndex + 1)
    .filter((entry) => fileBaseName(entry.file.name).toLowerCase() === base.toLowerCase())
    .length;
  return `${base}${occurrence > 1 ? ` (${occurrence})` : ''}.mp3`;
}

function fileKey(file) {
  return `${file.name.toLowerCase()}::${file.size}::${file.lastModified}`;
}

function fileBaseName(name) {
  return name.replace(/\.m4a$/i, '') || 'converted';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const parts = [minutes, secs].map((value) => String(value).padStart(2, '0'));
  return hours ? `${hours}:${parts.join(':')}` : parts.join(':');
}

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
}

onBeforeUnmount(() => {
  items.value.forEach(resetItemResult);
  metadataUrls.forEach((url) => URL.revokeObjectURL(url));
  metadataUrls.clear();
  if (ffmpeg.loaded) ffmpeg.terminate();
});
</script>

<style scoped>
.converter-container {
  width: min(880px, calc(100% - 32px));
  margin: 28px auto 48px;
  padding: 28px;
  color: #27364a;
  background: #f8fafc;
  border: 1px solid #dce3ea;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(31, 45, 61, 0.08);
}

.page-header,
.file-row,
.list-header,
.progress-copy {
  display: flex;
  align-items: center;
}

.page-header {
  gap: 14px;
  margin-bottom: 24px;
}

.header-icon {
  display: grid;
  flex: 0 0 48px;
  height: 48px;
  place-items: center;
  color: #fff;
  background: #1677ff;
  border-radius: 8px;
  font-size: 24px;
}

.page-header h2 {
  margin: 0;
  color: #223247;
  font-size: 24px;
  font-weight: 650;
  letter-spacing: 0;
}

.page-header p {
  margin: 2px 0 0;
  color: #748094;
  font-size: 13px;
}

.upload-area {
  display: grid;
  min-height: 190px;
  padding: 28px;
  place-content: center;
  text-align: center;
  background: #fff;
  border: 2px dashed #b8c4d2;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-area:hover,
.upload-area:focus-visible,
.upload-area.dragover {
  outline: none;
  border-color: #1677ff;
  background: #f0f7ff;
}

.upload-area.disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.upload-icon {
  margin-bottom: 12px;
  color: #1677ff;
  font-size: 42px;
}

.upload-title {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.upload-hint,
.list-header span,
.file-details span,
.estimate,
.progress-panel p {
  color: #8490a1;
  font-size: 12px;
}

.upload-hint {
  margin: 5px 0 0;
}

.file-panel,
.progress-panel {
  margin-top: 18px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e1e7ee;
  border-radius: 8px;
}

.list-header {
  justify-content: space-between;
  gap: 12px;
}

.list-header strong,
.list-header span {
  display: block;
}

.list-header strong {
  color: #31445a;
  font-weight: 650;
}

.settings-row {
  display: grid;
  grid-template-columns: 90px minmax(180px, 240px) 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 14px 0;
  border-top: 1px solid #edf0f4;
  border-bottom: 1px solid #edf0f4;
}

.settings-row label {
  color: #506176;
  font-size: 13px;
  font-weight: 600;
}

.file-list {
  max-height: 520px;
  overflow-y: auto;
}

.file-item {
  padding: 14px 2px;
  border-bottom: 1px solid #edf0f4;
}

.file-item:last-child {
  border-bottom: 0;
}

.file-row {
  gap: 10px;
}

.file-icon {
  display: grid;
  flex: 0 0 36px;
  height: 36px;
  place-items: center;
  color: #1677ff;
  background: #eaf3ff;
  border-radius: 6px;
  font-size: 17px;
}

.status-done .file-icon {
  color: #239d55;
  background: #eaf8ef;
}

.status-error .file-icon {
  color: #d94a4a;
  background: #fff0f0;
}

.file-details {
  min-width: 0;
  flex: 1;
}

.file-details strong,
.file-details span {
  display: block;
}

.file-details strong {
  overflow: hidden;
  color: #26384d;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-status {
  flex: 0 0 64px;
  color: #6f7d90;
  font-size: 12px;
  text-align: right;
}

.status-done .file-status {
  color: #239d55;
}

.status-error .file-status,
.item-error {
  color: #cf3f3f;
}

.item-progress {
  display: block;
  margin: 7px 0 0 46px;
  width: calc(100% - 48px);
}

.item-error {
  margin: 5px 0 0 46px;
  font-size: 12px;
}

.file-item audio {
  display: block;
  width: calc(100% - 46px);
  height: 36px;
  margin: 10px 0 0 46px;
}

.progress-copy {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
  color: #506176;
  font-size: 13px;
}

.progress-copy span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-copy strong {
  color: #1677ff;
  font-weight: 650;
}

.progress-panel p {
  margin: 5px 0 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.actions :deep(.ant-btn) {
  min-width: 168px;
}

.notes {
  margin-top: 34px;
  padding-top: 22px;
  border-top: 1px solid #dce3ea;
}

.notes h3 {
  margin: 0 0 14px;
  color: #31445a;
  font-size: 15px;
  font-weight: 650;
}

.note-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.note-grid > div {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #738094;
  font-size: 12px;
}

.note-grid svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #1677ff;
  font-size: 17px;
}

.note-grid strong {
  display: block;
  margin-bottom: 2px;
  color: #42556b;
  font-weight: 600;
}

@media (max-width: 640px) {
  .converter-container {
    width: calc(100% - 20px);
    margin-top: 14px;
    padding: 18px;
  }

  .page-header h2 {
    font-size: 20px;
  }

  .upload-area {
    min-height: 170px;
    padding: 24px 12px;
  }

  .settings-row {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .file-status {
    display: none;
  }

  .file-item audio {
    width: 100%;
    margin-left: 0;
  }

  .note-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .actions :deep(.ant-btn) {
    width: 100%;
  }
}
</style>
