<template>
  <div class="json-page">
    <h1 class="json-title">JSON格式化校验</h1>

    <div class="json-body">
      <div class="json-main">
        <textarea
          v-model="text"
          class="json-editor"
          spellcheck="false"
          placeholder="请贴入要格式化的JSON代码"
        ></textarea>

        <div class="json-btn">
          <a-button type="primary" @click="validate">格式化校验</a-button>
          <a-button type="primary" @click="compress">压缩</a-button>
          <a-button type="primary" @click="escapeText">转义</a-button>
          <a-button type="primary" @click="unescapeText">去除转义</a-button>
          <a-button type="primary" @click="toUnicode">中文转Unicode</a-button>
          <a-button type="primary" @click="fromUnicode">Unicode转中文</a-button>
          <a-button type="primary" @click="toQuery">转GET参数</a-button>
          <a-button type="primary" @click="copy">复制</a-button>
          <a-button type="primary" @click="clear">清空</a-button>
          <a-checkbox v-model:checked="remember">记忆</a-checkbox>
        </div>

        <div class="json-result" :class="resultType">
          <component :is="resultIcon" class="result-icon" />
          <pre class="result-text">{{ result }}</pre>
        </div>
      </div>

      <aside class="json-side">
        <div class="side-head">
          <span class="side-title">记录<span class="side-count">{{ records.length }}</span></span>
          <a-button type="link" size="small" danger :disabled="!records.length" @click="clearRecords">清空</a-button>
        </div>

        <div v-if="!records.length" class="side-empty">暂无记录</div>

        <ul v-else class="record-list">
          <li
            v-for="r in records"
            :key="r.id"
            class="record-item"
            :title="r.content"
            @click="useRecord(r)"
          >
            <div class="record-meta">
              <span class="record-action">{{ r.action }}</span>
              <span class="record-time">{{ r.time }}</span>
              <CloseOutlined class="record-del" @click.stop="removeRecord(r.id)" />
            </div>
            <div class="record-text">{{ preview(r.content) }}</div>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled, CloseOutlined } from '@ant-design/icons-vue';

// 与参考站一致的本地存储键名
const DATA_KEY = 'lastJsonData';
const CHECK_KEY = 'lastLoadChecked';
// 操作记录
const RECORD_KEY = 'jsonFormatRecords';
const MAX_RECORDS = 50;

const text = ref('');
const result = ref('请贴入要格式化的JSON代码');
const resultType = ref('');
const remember = ref(true);
const records = ref([]);

const resultIcon = computed(() => {
  if (resultType.value === 'success') return CheckCircleFilled;
  if (resultType.value === 'error') return CloseCircleFilled;
  return InfoCircleFilled;
});

const setResult = (msg, type = '') => {
  result.value = msg;
  resultType.value = type;
};

const pad = (n) => String(n).padStart(2, '0');
const formatTime = (d) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const saveRecords = () => localStorage.setItem(RECORD_KEY, JSON.stringify(records.value));

// 每次操作成功后记录结果内容，与上一条完全相同时不重复记
const addRecord = (action, content) => {
  if (!content) return;
  const last = records.value[0];
  if (last && last.action === action && last.content === content) return;
  records.value.unshift({ id: `${Date.now()}-${Math.random()}`, action, content, time: formatTime(new Date()) });
  if (records.value.length > MAX_RECORDS) records.value.length = MAX_RECORDS;
  saveRecords();
};

const removeRecord = (id) => {
  records.value = records.value.filter((r) => r.id !== id);
  saveRecords();
  message.success('已删除该记录');
};

const clearRecords = () => {
  records.value = [];
  saveRecords();
  message.success('已清空记录');
};

const useRecord = (r) => {
  text.value = r.content;
  setResult(`已载入「${r.action}」记录`, 'success');
};

const preview = (content) => {
  const one = content.replace(/\s+/g, ' ').trim();
  return one.length > 80 ? `${one.slice(0, 80)}…` : one;
};

// 由 JSON.parse 报错位置换算出行列
const errorInfo = (err, src) => {
  const msg = err.message;
  const m = /position (\d+)/.exec(msg);
  if (!m) return msg;
  const pos = Number(m[1]);
  const before = src.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  // 去掉引擎自带的 position 描述，统一为中文行列提示
  const base = msg.slice(0, m.index).replace(/[,\s]+$/, '');
  return `${base}（第 ${line} 行，第 ${col} 列）`;
};

const parseJson = (src) => JSON.parse(src);

const validate = () => {
  if (!text.value.trim()) {
    setResult('请贴入要格式化的JSON代码');
    return;
  }
  try {
    text.value = JSON.stringify(parseJson(text.value), null, 4);
    setResult('JSON格式正确，已格式化', 'success');
    addRecord('格式化校验', text.value);
  } catch (e) {
    setResult(`解析错误：${errorInfo(e, text.value)}`, 'error');
  }
};

const compress = () => {
  if (!text.value.trim()) {
    setResult('请贴入要格式化的JSON代码');
    return;
  }
  try {
    text.value = JSON.stringify(parseJson(text.value));
    setResult('已压缩', 'success');
    addRecord('压缩', text.value);
  } catch (e) {
    setResult(`解析错误：${errorInfo(e, text.value)}`, 'error');
  }
};

const escapeText = () => {
  if (!text.value) {
    setResult('请贴入要格式化的JSON代码');
    return;
  }
  text.value = JSON.stringify(text.value).slice(1, -1);
  setResult('已转义', 'success');
  addRecord('转义', text.value);
};

const unescapeText = () => {
  text.value = text.value.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (m, g) => {
    if (g[0] === 'u') return String.fromCharCode(parseInt(g.slice(1), 16));
    const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0', '\\': '\\', '"': '"', "'": "'", '/': '/' };
    return map[g] !== undefined ? map[g] : g;
  });
  setResult('已去除转义', 'success');
  addRecord('去除转义', text.value);
};

const toUnicode = () => {
  text.value = text.value.replace(/[^\x00-\x7F]/g, (c) => {
    const cp = c.codePointAt(0);
    const hex = (n) => '\\u' + n.toString(16).padStart(4, '0');
    if (cp > 0xffff) {
      return hex(Math.floor((cp - 0x10000) / 0x400) + 0xd800) + hex(((cp - 0x10000) % 0x400) + 0xdc00);
    }
    return hex(cp);
  });
  setResult('中文已转为Unicode', 'success');
  addRecord('中文转Unicode', text.value);
};

const fromUnicode = () => {
  text.value = text.value.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  setResult('Unicode已转为中文', 'success');
  addRecord('Unicode转中文', text.value);
};

const toQuery = () => {
  if (!text.value.trim()) {
    setResult('请贴入要格式化的JSON代码');
    return;
  }
  let data;
  try {
    data = parseJson(text.value);
  } catch (e) {
    setResult(`解析错误：${errorInfo(e, text.value)}`, 'error');
    return;
  }
  if (data === null || typeof data !== 'object') {
    setResult('转GET参数需要 JSON 对象或数组', 'error');
    return;
  }
  const parts = [];
  const walk = (key, val) => {
    if (Array.isArray(val)) {
      val.forEach((v, i) => walk(`${key}[${i}]`, v));
    } else if (val && typeof val === 'object') {
      Object.keys(val).forEach((k) => walk(key ? `${key}[${k}]` : k, val[k]));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val === null ? '' : val)}`);
    }
  };
  walk('', data);
  text.value = parts.join('&');
  setResult(`已转换为GET参数（共 ${parts.length} 项）`, 'success');
  addRecord('转GET参数', text.value);
};

const copy = () => {
  if (!text.value) {
    message.warning('没有可复制的内容');
    return;
  }
  const done = () => message.success('已复制到剪贴板');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text.value).then(done).catch(() => fallbackCopy(done));
  } else {
    fallbackCopy(done);
  }
};

const fallbackCopy = (done) => {
  const ta = document.createElement('textarea');
  ta.value = text.value;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } finally {
    document.body.removeChild(ta);
  }
};

const clear = () => {
  text.value = '';
  setResult('请贴入要格式化的JSON代码');
  message.success('已清空');
};

// 记忆：内容随输入保存，勾选状态独立保存
watch(text, (val) => {
  if (remember.value) localStorage.setItem(DATA_KEY, val);
});
watch(remember, (val) => {
  localStorage.setItem(CHECK_KEY, val ? 'yes' : 'no');
  if (!val) localStorage.removeItem(DATA_KEY);
});

onMounted(() => {
  const savedChecked = localStorage.getItem(CHECK_KEY);
  if (savedChecked === 'no') remember.value = false;
  const savedData = localStorage.getItem(DATA_KEY);
  if (savedData && savedChecked !== 'no') text.value = savedData;

  try {
    const saved = JSON.parse(localStorage.getItem(RECORD_KEY));
    records.value = Array.isArray(saved) ? saved : [];
  } catch {
    records.value = [];
  }
});
</script>
<style scoped>
.json-page {
  max-width: 1100px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.json-title {
  font-size: 18px;
  text-align: center;
  color: #34495e;
  margin-bottom: 16px;
}

.json-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.json-main {
  flex: 1;
  min-width: 0;
}

.json-editor {
  width: 100%;
  min-height: 320px;
  padding: 10px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  overflow: auto;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  resize: vertical;
  outline: none;
}

.json-editor:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.json-btn {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}

.json-result {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
}

.json-result.success {
  border-color: #b7eb8f;
  background: #f6ffed;
}

.json-result.error {
  border-color: #ffa39e;
  background: #fff1f0;
}

.result-icon {
  margin-top: 3px;
  color: #1677ff;
}

.json-result.success .result-icon {
  color: #52c41a;
}

.json-result.error .result-icon {
  color: #ff4d4f;
}

.result-text {
  margin: 0;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-side {
  flex: none;
  width: 250px;
  position: sticky;
  top: 70px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 8px 10px;
}

.side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.side-title {
  font-size: 13px;
  font-weight: bold;
  color: #34495e;
}

.side-count {
  margin-left: 4px;
  font-size: 11px;
  font-weight: normal;
  color: #999;
}

.side-empty {
  padding: 16px 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}

.record-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.record-item {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}

.record-item:hover {
  background: #f0f7ff;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.record-action {
  font-weight: bold;
  color: #1677ff;
}

.record-time {
  flex: 1;
  color: #999;
}

.record-del {
  font-size: 12px;
  color: #bbb;
  transition: color 0.15s;
}

.record-del:hover {
  color: #ff4d4f;
}

.record-text {
  margin-top: 2px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #666;
  word-break: break-all;
}

@media (max-width: 900px) {
  .json-body {
    flex-direction: column;
  }

  .json-side {
    position: static;
    width: 100%;
    max-height: 260px;
  }
}
</style>
