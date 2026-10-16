<template>
  <div class="zishu-page">
    <h1 class="zishu-title">字数统计工具</h1>

    <div class="zishu-form">
      <a-textarea
        v-model:value="text"
        class="zishu-editor"
        :rows="10"
        placeholder="请输入要统计的文本"
        @paste="onPaste"
      />

      <div class="zishu-btn">
        <a-button type="primary" @click="pasteText">粘贴</a-button>
        <a-button danger @click="clear">清空</a-button>
      </div>

      <p class="zishu-tips">
        提示：点击“粘贴”按钮后，浏览器会弹出权限申请，请点击“允许”，否则粘贴功能不可用。
      </p>

      <table class="stat-table">
        <thead>
          <tr>
            <th class="stat-name">项目</th>
            <th>数量</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in statRows" :key="row.label">
            <td>{{ row.label }}</td>
            <td><strong>{{ row.value }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="tool-info">
      <h5>工具说明</h5>
      <p>
        1.本工具所有运算均在本地客户端完成，不会上传任何用户数据。<br />
        2.总字数统计规则与 Word 基本一致，英文单词、连续符号均按单个字数计算。<br />
        3.总字符数支持两种编码格式统计。
      </p>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';

const text = ref('');

const ZERO = { total: 0, utf8: 0, gbk: 0, cn: 0, cnP: 0, en: 0, words: 0, enP: 0, number: 0 };

// 与参考站一致的外文符号集合
const EN_PUNCT = /[|~`!@#$%^&*()\-_+=|\\[\]{};:"',<.>/?]/g;

// 总字数：数字（含小数）、汉字、连续字母各算 1 个，其余非空白非单词字符各算 1 个
const countTotal = (str) => {
  try {
    const m = str.match(/\d+(?:[.,]\d+)*|[\p{Script=Han}]|[a-zA-Z]+|[^\p{Script=Han}\s\w]/gu);
    return m ? m.length : 0;
  } catch {
    const m = str.match(/\d+(?:[.,]\d+)*|[\u4E00-\u9FFF]|[a-zA-Z]+|[^\u4E00-\u9FFF\s\w]/g);
    return m ? m.length : 0;
  }
};

const byteLengthUTF8 = (str) => {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    len += c <= 127 ? 1 : c <= 2047 ? 2 : 3;
  }
  return len;
};

const byteLengthGBK = (str) => {
  let len = 0;
  for (let i = 0; i < str.length; i++) len += str.charCodeAt(i) <= 127 ? 1 : 2;
  return len;
};

const stats = computed(() => {
  const src = text.value.replace(/\r\n/g, '\n');
  if (!src) return { ...ZERO };

  const flat = src.replace(/\n/g, '');
  const cnArr = src.match(/[\u4e00-\u9fa5]/g) || [];
  const wordArr = src.match(/\b\w+\b/g) || [];
  const numWordArr = src.match(/\b\d+\b/g) || [];
  const enPunctArr = flat.match(EN_PUNCT) || [];

  let nonAscii = 0;
  for (let i = 0; i < flat.length; i++) {
    if (/[^\x00-\xff]/.test(flat.charAt(i))) nonAscii++;
  }

  return {
    total: countTotal(src),
    utf8: byteLengthUTF8(src),
    gbk: byteLengthGBK(src),
    cn: cnArr.length,
    cnP: nonAscii - cnArr.length,
    en: (flat.match(/[A-Za-z]/g) || []).length,
    words: wordArr.length - numWordArr.length,
    enP: enPunctArr.length,
    number: (flat.match(/[0-9]/g) || []).length
  };
});

const statRows = computed(() => [
  { label: '总字数', value: stats.value.total },
  { label: '总字符数(UTF-8)', value: stats.value.utf8 },
  { label: '总字符数(GBK)', value: stats.value.gbk },
  { label: '总汉字数', value: stats.value.cn },
  { label: '汉字符号', value: stats.value.cnP },
  { label: '外文字母', value: stats.value.en },
  { label: '外文单词', value: stats.value.words },
  { label: '外文符号', value: stats.value.enP },
  { label: '数字', value: stats.value.number }
]);

const onPaste = (e) => {
  const clip = e.clipboardData?.getData('text');
  if (clip) {
    e.preventDefault();
    text.value = text.value + clip;
  }
};

const fallbackPaste = () => {
  const ta = document.createElement('textarea');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  try {
    document.execCommand('paste');
    if (ta.value) text.value = ta.value;
  } finally {
    document.body.removeChild(ta);
  }
};

const pasteText = () => {
  if (navigator.clipboard && navigator.clipboard.readText && window.isSecureContext) {
    navigator.clipboard
      .readText()
      .then((clip) => {
        text.value = clip;
        message.success('已粘贴剪贴板内容');
      })
      .catch((err) => {
        message.error(`无法读取剪贴板内容：${err}`);
      });
  } else {
    fallbackPaste();
  }
};

const clear = () => {
  text.value = '';
  message.success('已清空');
};
</script>
<style scoped>
.zishu-page {
  max-width: 1100px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.zishu-title {
  font-size: 18px;
  text-align: center;
  color: #34495e;
  margin-bottom: 16px;
}

.zishu-editor {
  font-size: 13px;
  line-height: 1.7;
}

.zishu-btn {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.zishu-tips {
  margin: 0 0 12px;
  font-size: 12px;
  color: #999;
}

.stat-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  font-size: 13px;
}

.stat-table th,
.stat-table td {
  padding: 9px 14px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.stat-table thead th {
  background: #fafafa;
  color: #34495e;
  font-weight: bold;
}

.stat-table tbody tr:last-child td {
  border-bottom: none;
}

.stat-name {
  width: 180px;
}

.stat-table tbody td strong {
  color: #1677ff;
  font-size: 14px;
}

.tool-info {
  margin-top: 20px;
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

.tool-info h5 {
  font-size: 14px;
  color: #34495e;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;
}

@media (max-width: 600px) {
  .zishu-page {
    margin: 10px;
    padding: 14px;
  }

  .stat-name {
    width: 120px;
  }
}
</style>
