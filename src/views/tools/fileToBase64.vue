<template>
  <div class="file-to-base64-container">
    <h2 class="title">文件转Base64工具</h2>
    
    <!-- 文件上传区域 -->
    <div 
      class="upload-area" 
      :class="{ 'dragover': isDragging }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput" 
        type="file" 
        style="display: none" 
        @change="handleFileSelect"
        multiple="false"
      >
      <div class="upload-content">
        <a-icon type="upload" :style="{ fontSize: '48px', color: '#999' }" />
        <p>点击或拖放文件到此处</p>
        <p class="hint">支持任意文件类型，所有转换均在本地完成，数据不会上传</p>
      </div>
    </div>

    <!-- 已选文件信息 -->
    <div v-if="selectedFile" class="file-info">
      <a-row align="middle">
        <a-col flex="auto">
          <div class="file-name">{{ selectedFile.name }}</div>
          <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
        </a-col>
        <a-col>
          <a-button type="primary" @click="convertToBase64" :disabled="isConverting">
            {{ isConverting ? '转换中...' : '转换为Base64' }}
          </a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 转换结果 -->
    <div v-if="base64Result" class="result-area">
      <a-form-item label="Base64编码结果">
        <a-input
          v-model:value="base64Result"
          type="textarea"
          :rows="8"
          readonly
        >
          <template #suffix>
            <a-tooltip title="点击复制">
              <a-icon type="copy" @click="copyToClipboard" />
            </a-tooltip>
          </template>
        </a-input>
      </a-form-item>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <a-button type="primary" @click="copyToClipboard" :disabled="!base64Result">复制到剪贴板</a-button>
        <a-button type="default" @click="clearResult">清除结果</a-button>
        <a-button type="default" @click="downloadBase64AsFile">下载为.txt文件</a-button>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="features-section">
      <h3>功能特点</h3>
      <ul>
        <li>支持任意文件类型的Base64编码转换</li>
        <li>所有转换均在本地浏览器中完成，确保数据安全</li>
        <li>支持拖放操作，方便快捷</li>
        <li>一键复制结果到剪贴板</li>
        <li>支持下载Base64编码结果为文本文件</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

const fileInput = ref(null);
const selectedFile = ref(null);
const base64Result = ref('');
const isDragging = ref(false);
const isConverting = ref(false);

// 触发文件选择对话框
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 处理文件选择
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
};

// 拖放相关处理
const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file) {
    handleFile(file);
  }
};

// 处理选择的文件
const handleFile = (file) => {
  selectedFile.value = file;
  base64Result.value = ''; // 清除之前的结果
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 将文件转换为Base64
const convertToBase64 = () => {
  if (!selectedFile.value) {
    message.error('请先选择文件');
    return;
  }

  isConverting.value = true;
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    // 移除data URL前缀，只保留Base64字符串
    const base64String = e.target.result.split(',')[1];
    base64Result.value = base64String;
    isConverting.value = false;
    message.success('文件转换成功');
  };
  
  reader.onerror = () => {
    isConverting.value = false;
    message.error('文件转换失败，请重试');
  };
  
  reader.readAsDataURL(selectedFile.value);
};

// 复制到剪贴板
const copyToClipboard = () => {
  if (!base64Result.value) {
    message.warning('没有可复制的内容');
    return;
  }

  navigator.clipboard.writeText(base64Result.value).then(() => {
    message.success('Base64编码已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败，请手动选择并复制');
  });
};

// 清除结果
const clearResult = () => {
  selectedFile.value = null;
  base64Result.value = '';
  fileInput.value.value = '';
  message.info('已清除所有内容');
};

// 下载Base64为文件
const downloadBase64AsFile = () => {
  if (!base64Result.value) {
    message.warning('没有可下载的内容');
    return;
  }

  const blob = new Blob([base64Result.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedFile.value.name}.base64.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  message.success('文件下载成功');
};
</script>

<style scoped>
.file-to-base64-container {
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

.file-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 5px;
}

.file-name {
  font-weight: bold;
  color: #333;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.result-area {
  margin-top: 30px;
}

.action-buttons {
  margin-top: 15px;
  display: flex;
  gap: 10px;
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