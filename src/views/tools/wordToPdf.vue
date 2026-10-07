<template>
  <div class="word-to-pdf-container">
    <h2 class="title">Word 导出 PDF 工具</h2>

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
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style="display: none"
        @change="handleFileSelect"
      >
      <div class="upload-content">
        <a-icon type="file-word" :style="{ fontSize: '48px', color: '#999' }" />
        <p>点击或拖放 .docx 文件到此处</p>
        <p class="hint">仅支持 .docx（新版 Word 格式），保留原排版、页眉页脚、分页；解析与导出均在本地完成</p>
      </div>
    </div>

    <!-- 文件信息 + 选项 -->
    <div v-if="selectedFile" class="info-area">
      <a-row align="middle">
        <a-col flex="auto">
          <div class="file-name">{{ selectedFile.name }}</div>
          <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
        </a-col>
        <a-col>
          <a-button type="link" danger @click="clearAll">重新选择</a-button>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 14px">
        <a-col :span="12">
          <label>清晰度：{{ scale }}x</label>
          <a-slider v-model:value="scale" :min="1" :max="3" :step="1" />
        </a-col>
        <a-col :span="12" style="display: flex; align-items: flex-end">
          <span class="hint">页面尺寸自动沿用 Word 原设置</span>
        </a-col>
      </a-row>
    </div>

    <!-- 预览 -->
    <div v-show="isRendered" class="preview-area">
      <div class="preview-header">
        <span>预览（原排版渲染）</span>
        <span class="hint">导出的 PDF 与预览一致</span>
      </div>
      <div class="preview-scroll">
        <div ref="previewRef" class="docx-container"></div>
      </div>
    </div>

    <!-- 操作 -->
    <div v-show="isRendered" class="action-area">
      <a-button type="primary" size="large" :loading="isExporting" @click="exportPdf">
        {{ isExporting ? '导出中...' : '导出 PDF' }}
      </a-button>
    </div>

    <!-- 说明 -->
    <div class="features-section">
      <h3>功能特点</h3>
      <ul>
        <li>将 .docx 文件转换为 PDF 并下载</li>
        <li>保留原排版：页面尺寸、页边距、分页、页眉页脚、表格、图片等</li>
        <li>本地渲染 Word 文档，内容不会上传</li>
        <li>个别复杂元素（浮动文本框、艺术字、SmartArt 等）可能略有差异</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const fileInput = ref(null);
const selectedFile = ref(null);
const previewRef = ref(null);
const isDragging = ref(false);
const isConverting = ref(false);
const isRendered = ref(false);
const isExporting = ref(false);
const scale = ref(2);

const triggerFileInput = () => {
  fileInput.value && fileInput.value.click();
};

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (file) loadDocx(file);
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file) loadDocx(file);
};

async function loadDocx(file) {
  if (!/\.docx$/i.test(file.name)) {
    message.error('请选择 .docx 格式的 Word 文件（.doc 旧格式不支持）');
    return;
  }
  selectedFile.value = file;
  isRendered.value = false;
  isConverting.value = true;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    // 清空容器后按原排版渲染
    const container = previewRef.value;
    container.innerHTML = '';
    await renderAsync(blob, container, null, {
      className: 'docx',
      inWrapper: true,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      ignoreLastRenderedPageBreak: true,
      ignoreFonts: false,
      ignoreWidth: false,
      ignoreHeight: false
    });
    isRendered.value = true;
    message.success('Word 解析成功');
  } catch (err) {
    console.error(err);
    message.error('解析失败，请确认文件是有效的 .docx');
  } finally {
    isConverting.value = false;
  }
}

async function exportPdf() {
  const container = previewRef.value;
  if (!container) return;
  const sections = Array.from(container.querySelectorAll('.docx'));
  if (!sections.length) {
    message.warning('没有可导出的内容');
    return;
  }
  isExporting.value = true;
  try {
    let doc = null;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      // 页面尺寸（96dpi 下 px → mm），沿用 Word 原页面尺寸
      const wMM = section.offsetWidth * 25.4 / 96;
      const hMM = section.offsetHeight * 25.4 / 96;
      const orientation = wMM > hMM ? 'landscape' : 'portrait';

      const canvas = await html2canvas(section, {
        scale: scale.value,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      if (!doc) {
        doc = new jsPDF({ unit: 'mm', format: [wMM, hMM], orientation, compress: true });
      } else {
        doc.addPage([wMM, hMM], orientation);
      }
      doc.addImage(imgData, 'JPEG', 0, 0, wMM, hMM);
    }
    doc.save('Word导出_' + stamp() + '.pdf');
    message.success('已导出 ' + sections.length + ' 页 PDF');
  } catch (err) {
    console.error(err);
    message.error('导出失败，请重试');
  } finally {
    isExporting.value = false;
  }
}

function clearAll() {
  selectedFile.value = null;
  isRendered.value = false;
  if (previewRef.value) previewRef.value.innerHTML = '';
  if (fileInput.value) fileInput.value.value = '';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function stamp() {
  const d = new Date();
  const p = (n) => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
}
</script>

<style scoped>
.word-to-pdf-container {
  font-family: Arial, sans-serif;
  max-width: 860px;
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

.info-area {
  margin: 20px 0;
  padding: 15px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 5px;
}

.info-area label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.info-area .hint {
  font-size: 12px;
  color: #999;
}

.file-name {
  font-weight: bold;
  color: #333;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.preview-area {
  margin: 20px 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #34495e;
  font-weight: bold;
}

.preview-header .hint {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.preview-scroll {
  max-height: 560px;
  overflow: auto;
  border: 1px solid #e8e8e8;
  border-radius: 5px;
  background: #eef0f3;
}

/* docx-preview 渲染出的分页内容（动态插入，需穿透 scoped） */
.docx-container :deep(.docx-wrapper) {
  padding: 20px 12px;
  background: #eef0f3;
}

.docx-container :deep(.docx) {
  margin: 0 auto 20px;
  background: #ffffff;
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
