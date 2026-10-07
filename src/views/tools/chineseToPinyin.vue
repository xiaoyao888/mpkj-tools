<template>
  <div class="chinese-to-pinyin-container">
    <h2 class="page-title">汉字批量转拼音</h2>
    
    <div class="main-content">
      <!-- 左侧：输入区域和选项 -->
      <div class="left-panel">
        <div class="panel-title">输入文本</div>
        <a-textarea
          v-model:value="inputText"
          placeholder="请输入要转换的汉字文本"
          :rows="12"
          :maxlength="2000"
          show-count
          allow-clear
          @change="handleInputChange"
          class="input-textarea"
        />
        
        <!-- 转换选项 -->
        <div class="options-section">
          <div class="option-group">
            <span class="option-label">输出格式：</span>
            <a-radio-group v-model:value="outputFormat" class="radio-group">
              <a-radio value="lowercase">小写</a-radio>
              <a-radio value="uppercase">大写</a-radio>
              <a-radio value="capitalize">首字母大写</a-radio>
              <a-radio value="firstletter">仅提取首字母</a-radio>
            </a-radio-group>
          </div>
          
          <div class="option-group">
            <span class="option-label">分隔符：</span>
            <a-select v-model:value="separator" class="separator-select">
              <a-select-option value="space">空格</a-select-option>
              <a-select-option value="hyphen">连字符 (-)</a-select-option>
              <a-select-option value="underline">下划线 (_)</a-select-option>
              <a-select-option value="none">无</a-select-option>
            </a-select>
          </div>
          
          <div class="option-group">
            <a-checkbox v-model:checked="includeToneMarks">包含音调</a-checkbox>
            <a-checkbox v-model:checked="keepOriginal">保留非中文字符</a-checkbox>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <a-button type="primary" @click="convertToPinyin" :loading="isConverting" class="convert-button">
            转换为拼音
          </a-button>
          <a-button @click="clearAll" class="clear-button">清空</a-button>
          <a-button @click="copyResult" v-if="outputText" :loading="isCopying" class="copy-button">
            复制结果
          </a-button>
        </div>
      </div>
      
      <!-- 右侧：结果显示区域 -->
      <div class="right-panel">
        <div class="panel-title">转换结果</div>
        <a-textarea
          v-model:value="outputText"
          :rows="20"
          readonly
          placeholder="转换结果将显示在这里..."
          class="result-textarea"
        />
        <div class="result-stats" v-if="outputText">
          共 {{ outputText.length }} 字符
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import { Textarea, Button, Radio, Select, Checkbox } from 'ant-design-vue';

// 导入pinyin包（通常是默认导入）
import pinyin from 'pinyin';

// 组件状态
const inputText = ref('');
const outputText = ref('');
const isConverting = ref(false);
const isCopying = ref(false);
const outputFormat = ref('lowercase'); // lowercase, uppercase, capitalize
const separator = ref('none'); // space, hyphen, underline, none
const includeToneMarks = ref(false);
const keepOriginal = ref(false);

// 根据分隔符选项获取实际的分隔符字符串
const actualSeparator = computed(() => {
  switch(separator.value) {
    case 'space': return ' ';
    case 'hyphen': return '-';
    case 'underline': return '_';
    case 'none': return '';
    default: return ' ';
  }
});

// 处理输入变化
const handleInputChange = () => {
  // 可以在这里添加输入验证或实时转换逻辑
};

// 汉字转拼音的核心函数
const convertToPinyin = async () => {
  if (!inputText.value.trim()) {
    message.warning('请输入要转换的汉字文本');
    return;
  }

  isConverting.value = true;
  try {
    // 模拟异步处理
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const text = inputText.value;
    
    // 配置pinyin插件选项
    const options = {
      style: includeToneMarks.value ? pinyin.STYLE_TONE : pinyin.STYLE_NORMAL
    };
    
    // 使用pinyin插件转换文本
    const pinyinArray = pinyin(text, options);
    
    // 处理结果数组
    let result = '';
    let lastWasChinese = false;
    
    // 遍历原始文本的每个字符
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // 检查是否为换行符
      if (char === '\n' || char === '\r') {
        // 无论是否保留非中文字符，都保留换行符
        result += char;
        lastWasChinese = false;
      } 
      // 检查是否为中文字符
      else if (/[\u4e00-\u9fa5]/.test(char)) {
        // 使用pinyin插件获取拼音
        const charPinyin = pinyin(char, options);
        if (charPinyin && charPinyin.length > 0 && charPinyin[0] && charPinyin[0].length > 0) {
          let py = charPinyin[0][0];
          
          // 应用输出格式
          switch(outputFormat.value) {
            case 'uppercase':
              py = py.toUpperCase();
              break;
            case 'capitalize':
              py = py.charAt(0).toUpperCase() + py.slice(1);
              break;
            case 'firstletter':
              py = py.charAt(0).toLowerCase(); // 仅提取首字母并转为小写
              break;
            default:
              py = py.toLowerCase();
          }
          
          // 在需要时添加分隔符
          if (lastWasChinese && actualSeparator.value) {
            result += actualSeparator.value;
          }
          
          result += py;
          lastWasChinese = true;
        }
      } else {
        // 非中文字符和非换行符，仅在keepOriginal为true时添加
        if (keepOriginal.value) {
          result += char;
        }
        lastWasChinese = false;
      }
    }
    
    outputText.value = result;
    message.success('转换成功');
  } catch (error) {
    console.error('转换失败:', error);
    message.error('转换失败，请重试');
  } finally {
    isConverting.value = false;
  }
};

// 数字音调转符号音调（简化版）
const convertNumberToneToSymbolTone = (pinyin) => {
  // 这里是简化版的实现，实际应用中需要更复杂的映射
  const toneMap = {
    'a1': 'ā', 'a2': 'á', 'a3': 'ǎ', 'a4': 'à',
    'e1': 'ē', 'e2': 'é', 'e3': 'ě', 'e4': 'è',
    'i1': 'ī', 'i2': 'í', 'i3': 'ǐ', 'i4': 'ì',
    'o1': 'ō', 'o2': 'ó', 'o3': 'ǒ', 'o4': 'ò',
    'u1': 'ū', 'u2': 'ú', 'u3': 'ǔ', 'u4': 'ù',
    'v1': 'ǖ', 'v2': 'ǘ', 'v3': 'ǚ', 'v4': 'ǜ'
  };
  
  for (const [numTone, symbolTone] of Object.entries(toneMap)) {
    if (pinyin.includes(numTone)) {
      return pinyin.replace(numTone, symbolTone);
    }
  }
  
  return pinyin;
};

// 清空所有内容
const clearAll = () => {
  inputText.value = '';
  outputText.value = '';
  message.info('已清空');
};

// 复制结果到剪贴板
const copyResult = async () => {
  if (!outputText.value) return;
  
  isCopying.value = true;
  try {
    await navigator.clipboard.writeText(outputText.value);
    message.success('结果已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    message.error('复制失败，请手动复制');
  } finally {
    isCopying.value = false;
  }
};
</script>

<style scoped>
.chinese-to-pinyin-container {
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.page-title {
  text-align: center;
  font-size: 28px;
  color: #333;
  margin-bottom: 30px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 24px;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.input-textarea {
  width: 100%;
  flex-shrink: 0;
}

.options-section {
  margin: 16px 0;
}

.option-group {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-label {
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.radio-group {
  flex: 1;
}

.separator-select {
  width: 120px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.convert-button {
  background-color: #1890ff;
  border-color: #1890ff;
}

.convert-button:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.clear-button {
  background-color: #fff;
  border-color: #d9d9d9;
  color: #333;
}

.clear-button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.copy-button {
  background-color: #52c41a;
  border-color: #52c41a;
}

.copy-button:hover {
  background-color: #73d13d;
  border-color: #73d13d;
}

.result-textarea {
  width: 100%;
  background-color: #fafafa;
  flex: 1;
  min-height: 400px;
}

.result-stats {
  font-size: 14px;
  color: #666;
  text-align: right;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
  }
  
  .result-textarea {
    min-height: 200px;
  }
}

@media (max-width: 768px) {
  .chinese-to-pinyin-container {
    padding: 10px;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .option-group {
    flex-wrap: wrap;
  }
}
</style>