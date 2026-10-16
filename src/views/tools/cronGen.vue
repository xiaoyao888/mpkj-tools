<template>
  <div class="cron-page">
    <h1 class="cron-title">在线Cron表达式生成器</h1>

    <div class="cron-expr">
      <a-input
        :value="exprText"
        class="expr-input"
        size="large"
        placeholder="Quartz Cron 表达式，可直接编辑"
        @change="onExprChange"
      />
      <div v-if="parseError" class="expr-error">{{ parseError }}</div>
    </div>

    <div class="cron-fields">
      <div v-for="f in FIELDS" :key="f.key" class="field-row">
        <div class="field-label">{{ f.label }}</div>
        <div class="field-body">
          <a-radio-group
            :value="state[f.key].mode"
            :options="modeOptions(f)"
            size="small"
            @change="(e) => onModeChange(f, e.target.value)"
          />

          <div v-if="state[f.key].mode === 'period'" class="field-extra">
            从
            <a-input-number
              :value="state[f.key].start"
              :min="f.min"
              :max="f.max"
              size="small"
              @change="(v) => setVal(f, 'start', v)"
            />
            开始， 每
            <a-input-number
              :value="state[f.key].interval"
              :min="1"
              :max="f.max"
              size="small"
              @change="(v) => setVal(f, 'interval', v)"
            />
            {{ f.unit }}执行一次
          </div>

          <div v-else-if="state[f.key].mode === 'specify'" class="field-extra">
            <a-select
              :value="state[f.key].values"
              :options="valueOptions(f)"
              mode="multiple"
              size="small"
              placeholder="请选择"
              class="specify-select"
              @change="(v) => setVal(f, 'values', v)"
            />
          </div>

          <div v-else-if="state[f.key].mode === 'dayW'" class="field-extra">
            每月
            <a-input-number
              :value="state[f.key].n"
              :min="1"
              :max="31"
              size="small"
              @change="(v) => setVal(f, 'n', v)"
            />
            日最近的工作日
          </div>

          <div v-else-if="state[f.key].mode === 'weekN'" class="field-extra">
            每月的第
            <a-input-number
              :value="state[f.key].nth"
              :min="1"
              :max="5"
              size="small"
              @change="(v) => setVal(f, 'nth', v)"
            />
            个
            <a-select
              :value="state[f.key].w"
              :options="weekOptions"
              size="small"
              class="week-select"
              @change="(v) => setVal(f, 'w', v)"
            />
          </div>

          <div v-else-if="state[f.key].mode === 'weekL'" class="field-extra">
            <a-select
              :value="state[f.key].w"
              :options="weekOptions"
              size="small"
              class="week-select"
              @change="(v) => setVal(f, 'w', v)"
            />
            的最后一个
          </div>
        </div>
      </div>
    </div>

    <div class="cron-next">
      <h3 class="block-title">最近5次运行时间</h3>
      <div v-if="!nextList.length" class="next-empty">表达式无效或无法推算</div>
      <ol v-else class="next-list">
        <li v-for="(t, i) in nextList" :key="i">{{ t }}</li>
      </ol>
      <div v-if="nextNote" class="next-note">{{ nextNote }}</div>
    </div>

    <div class="cron-examples">
      <h3 class="block-title">常用cron表达式例子</h3>
      <p v-for="(ex, i) in EXAMPLES" :key="i" class="example-item">{{ ex }}</p>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue';

const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEK_MAP = { SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7 };
const WEEK_RE = /SUN|MON|TUE|WED|THU|FRI|SAT/g;

const pad = (n) => String(n).padStart(2, '0');

// Quartz 七段：秒 分 时 日 月 周 年
const FIELDS = [
  { key: 'sec', label: '秒', unit: '秒', min: 0, max: 59, every: '每秒钟', modes: ['every', 'period', 'specify'] },
  { key: 'min', label: '分', unit: '分', min: 0, max: 59, every: '每分钟', modes: ['every', 'period', 'specify'] },
  { key: 'hour', label: '时', unit: '时', min: 0, max: 23, every: '每小时', modes: ['every', 'period', 'specify'] },
  { key: 'day', label: '日', unit: '日', min: 1, max: 31, every: '每日', modes: ['every', 'period', 'specify', 'nospecify', 'dayL', 'dayLW', 'dayW'] },
  { key: 'month', label: '月', unit: '月', min: 1, max: 12, every: '每月', modes: ['every', 'period', 'specify'] },
  { key: 'week', label: '周', unit: '周', min: 1, max: 7, every: '每周', modes: ['every', 'period', 'specify', 'nospecify', 'weekN', 'weekL'] },
  { key: 'year', label: '年', unit: '年', min: 1970, max: 2099, every: '每年', modes: ['every', 'period', 'specify'] }
];

const MODE_LABEL = {
  period: '周期',
  specify: '指定',
  nospecify: '不指定',
  dayL: '每月最后一日',
  dayLW: '每月最后一个工作日',
  dayW: '每月最近的工作日',
  weekN: '每月的第几个星期几',
  weekL: '每月最后一个星期几'
};

const EXAMPLES = [
  '0/2 * * * * ?   每2秒执行',
  '0 0/2 * * * ?   每2分钟执行',
  '0 0 2 1 * ?   每月1日凌晨2点执行',
  '0 15 10 ? * MON-FRI   周一到周五每天上午10:15执行',
  '0 15 10 ? 6L 2002-2006   2002-2006年每月最后一个星期五上午10:15执行',
  '0 0 10,14,16 * * ?   每天上午10点、下午2点、4点执行',
  '0 0/30 9-17 * * ?   朝九晚五内每半小时执行',
  '0 0 12 ? * WED   每周三中午12点执行',
  '0 0 12 * * ?   每天中午12点执行',
  '0 15 10 ? * *   每天上午10:15执行',
  '0 15 10 * * ?   每天上午10:15执行',
  '0 15 10 * * ? 2005   2005年每天上午10:15执行',
  '0 * 14 * * ?   每天下午2点内每分钟执行',
  '0 0/5 14 * * ?   每天下午2点到2:55内每5分钟执行',
  '0 0/5 14,18 * * ?   每天下午2点、6点内每5分钟执行',
  '0 0-5 14 * * ?   每天下午2点到2:05内每分钟执行',
  '0 10,44 14 ? 3 WED   每年三月的周三下午2:10、2:44执行',
  '0 15 10 ? * MON-FRI   周一至周五上午10:15执行',
  '0 15 10 15 * ?   每月15日上午10:15执行',
  '0 15 10 L * ?   每月最后一日上午10:15执行',
  '0 15 10 ? * 6L   每月最后一个星期五上午10:15执行',
  '0 15 10 ? * 6L 2002-2005   2002-2005年每月最后一个星期五上午10:15执行',
  '0 15 10 ? * 6#3   每月第三个星期五上午10:15执行'
];

const weekOptions = WEEK_NAMES.map((n, i) => ({ value: i + 1, label: `${n}(${i + 1})` }));

const makeState = (f) => ({
  mode: f.key === 'week' ? 'nospecify' : 'every',
  start: f.min,
  interval: 1,
  values: [],
  n: 1,
  w: 1,
  nth: 1
});

const state = reactive(Object.fromEntries(FIELDS.map((f) => [f.key, makeState(f)])));

const exprText = ref('* * * * * ? *');
const parseError = ref('');
const nextList = ref([]);
const nextNote = ref('');

const modeOptions = (f) => f.modes.map((m) => ({ value: m, label: m === 'every' ? f.every : MODE_LABEL[m] }));

const valueOptions = (f) => {
  if (f.key === 'week') return weekOptions;
  const opts = [];
  for (let v = f.min; v <= f.max; v++) opts.push({ value: v, label: String(v) });
  return opts;
};

const fmtTime = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// ---------- 字段段 -> 表达式 ----------
const segmentOf = (f, st) => {
  switch (st.mode) {
    case 'every':
      return '*';
    case 'nospecify':
      return '?';
    case 'period':
      return `${st.start ?? f.min}/${st.interval || 1}`;
    case 'specify':
      return st.values.length ? [...st.values].sort((a, b) => a - b).join(',') : '*';
    case 'dayL':
      return 'L';
    case 'dayLW':
      return 'LW';
    case 'dayW':
      return `${st.n ?? 1}W`;
    case 'weekN':
      return `${st.w ?? 1}#${st.nth ?? 1}`;
    case 'weekL':
      return `${st.w ?? 1}L`;
    default:
      return '*';
  }
};

const rebuild = () => FIELDS.map((f) => segmentOf(f, state[f.key])).join(' ');

// ---------- 表达式 -> 字段（双向解析） ----------
const expand = (seg, f) => {
  const out = new Set();
  for (const part of seg.split(',')) {
    const [rangeRaw, stepRaw] = part.split('/');
    const step = stepRaw ? Number(stepRaw) : 1;
    if (!Number.isFinite(step) || step < 1) throw new Error(`${f.label} 字段步长无效：${part}`);
    let start;
    let end;
    if (rangeRaw === '*' || rangeRaw === '?') {
      start = f.min;
      end = f.max;
    } else if (rangeRaw.includes('-')) {
      const [a, b] = rangeRaw.split('-');
      start = Number(a);
      end = Number(b);
    } else {
      start = Number(rangeRaw);
      end = stepRaw ? f.max : start;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error(`${f.label} 字段无法解析：${part}`);
    for (let v = start; v <= end; v += step) out.add(v);
  }
  if (!out.size) throw new Error(`${f.label} 字段无法解析：${seg}`);
  return out;
};

const parseSegment = (rawSeg, f) => {
  let seg = rawSeg.trim();
  if (f.key === 'week') seg = seg.toUpperCase().replace(WEEK_RE, (m) => String(WEEK_MAP[m]));

  const st = makeState(f);

  if (seg === '*') return st;

  if (seg === '?' || seg === '') {
    if (!f.modes.includes('nospecify')) throw new Error(`${f.label} 字段不支持 “?”`);
    st.mode = 'nospecify';
    return st;
  }

  if (f.key === 'day') {
    if (/^L$/i.test(seg)) {
      st.mode = 'dayL';
      return st;
    }
    if (/^LW$/i.test(seg)) {
      st.mode = 'dayLW';
      return st;
    }
    const mW = /^(\d{1,2})W$/i.exec(seg);
    if (mW) {
      st.mode = 'dayW';
      st.n = Number(mW[1]);
      return st;
    }
  }

  if (f.key === 'week') {
    const mHash = /^(\d)#(\d)$/.exec(seg);
    if (mHash) {
      st.mode = 'weekN';
      st.w = Number(mHash[1]);
      st.nth = Number(mHash[2]);
      return st;
    }
    const mL = /^(\d)L$/.exec(seg);
    if (mL) {
      st.mode = 'weekL';
      st.w = Number(mL[1]);
      return st;
    }
  }

  const mPeriod = /^(\d+)\/(\d+)$/.exec(seg);
  if (mPeriod) {
    st.mode = 'period';
    st.start = Number(mPeriod[1]);
    st.interval = Number(mPeriod[2]);
    return st;
  }

  st.mode = 'specify';
  st.values = [...expand(seg, f)].sort((a, b) => a - b);
  return st;
};

// ---------- 下次执行时间推算 ----------
const isWeekend = (y, m, d) => {
  const w = new Date(y, m, d).getDay();
  return w === 0 || w === 6;
};

const nearestWeekday = (y, m, day) => {
  const last = new Date(y, m + 1, 0).getDate();
  const t = Math.min(day, last);
  if (!isWeekend(y, m, t)) return t;
  const back = t - 1;
  if (back >= 1 && !isWeekend(y, m, back)) return back;
  const fwd = t + 1;
  if (fwd <= last && !isWeekend(y, m, fwd)) return fwd;
  return t;
};

const lastWeekday = (y, m, last) => {
  let d = last;
  while (d >= 1 && isWeekend(y, m, d)) d--;
  return d;
};

const parseDaySpec = (seg) => {
  if (seg === '*' || seg === '?') return { type: 'any' };
  if (/^LW$/i.test(seg)) return { type: 'lastWeekday' };
  if (/^L$/i.test(seg)) return { type: 'last' };
  const m = /^(\d{1,2})W$/i.exec(seg);
  if (m) return { type: 'nearest', day: Number(m[1]) };
  return { type: 'list', set: expand(seg, FIELDS[3]) };
};

const parseWeekSpec = (seg) => {
  if (seg === '*' || seg === '?') return { type: 'any' };
  const s = seg.toUpperCase().replace(WEEK_RE, (m) => String(WEEK_MAP[m]));
  const mHash = /^(\d)#(\d)$/.exec(s);
  if (mHash) return { type: 'nth', week: Number(mHash[1]), nth: Number(mHash[2]) };
  const mL = /^(\d)L$/.exec(s);
  if (mL) return { type: 'last', week: Number(mL[1]) };
  return { type: 'list', set: expand(s, FIELDS[5]) };
};

const dayMatches = (date, spec) => {
  const day = date.getDate();
  const y = date.getFullYear();
  const m = date.getMonth();
  switch (spec.type) {
    case 'any':
      return true;
    case 'last':
      return day === new Date(y, m + 1, 0).getDate();
    case 'lastWeekday':
      return day === lastWeekday(y, m, new Date(y, m + 1, 0).getDate());
    case 'nearest':
      return day === nearestWeekday(y, m, spec.day);
    default:
      return spec.set.has(day);
  }
};

const weekMatches = (date, spec) => {
  if (spec.type === 'any') return true;
  const w = date.getDay() + 1;
  const dom = date.getDate();
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  switch (spec.type) {
    case 'nth':
      return w === spec.week && Math.floor((dom - 1) / 7) + 1 === spec.nth;
    case 'last':
      return w === spec.week && dom > last - 7;
    default:
      return spec.set.has(w);
  }
};

const GUARD = 100000;

const runNext = (text, count) => {
  const segs = text.trim().split(/\s+/);
  if (segs.length !== 7) throw new Error(`需要 7 个字段（秒 分 时 日 月 周 年），当前 ${segs.length} 个`);
  const sec = expand(segs[0], FIELDS[0]);
  const min = expand(segs[1], FIELDS[1]);
  const hour = expand(segs[2], FIELDS[2]);
  const month = expand(segs[4], FIELDS[4]);
  const year = expand(segs[6], FIELDS[6]);
  const daySpec = parseDaySpec(segs[3]);
  const weekSpec = parseWeekSpec(segs[5]);

  const times = [];
  const d = new Date(Date.now() + 1000);
  d.setMilliseconds(0);
  let guard = 0;

  while (times.length < count && guard < GUARD) {
    guard++;
    if (!sec.has(d.getSeconds())) {
      d.setSeconds(d.getSeconds() + 1);
      continue;
    }
    if (!min.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1, 0);
      continue;
    }
    if (!hour.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0, 0);
      continue;
    }
    if (!month.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0);
      continue;
    }
    if (!year.has(d.getFullYear())) {
      d.setFullYear(d.getFullYear() + 1, 0, 1);
      d.setHours(0, 0, 0);
      continue;
    }
    if (!dayMatches(d, daySpec) || !weekMatches(d, weekSpec)) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0);
      continue;
    }
    times.push(new Date(d));
    d.setSeconds(d.getSeconds() + 1);
  }

  return { times, truncated: times.length < count };
};

const updateNext = () => {
  try {
    const r = runNext(exprText.value, 5);
    nextList.value = r.times.map(fmtTime);
    nextNote.value = r.truncated ? '该表达式匹配周期过长，仅列出有效范围内可推算的结果' : '';
  } catch {
    nextList.value = [];
    nextNote.value = '';
  }
};

// ---------- 交互 ----------
const syncFromUi = () => {
  exprText.value = rebuild();
  parseError.value = '';
  updateNext();
};

const onModeChange = (f, mode) => {
  state[f.key].mode = mode;
  syncFromUi();
};

const setVal = (f, key, val) => {
  state[f.key][key] = val;
  syncFromUi();
};

const onExprChange = (e) => {
  const text = e.target.value;
  exprText.value = text;
  const segs = text.trim().split(/\s+/);
  if (segs.length !== 7) {
    parseError.value = `需要 7 个字段（秒 分 时 日 月 周 年），当前 ${segs.length} 个`;
    updateNext();
    return;
  }
  try {
    const next = FIELDS.map((f, i) => parseSegment(segs[i], f));
    FIELDS.forEach((f, i) => Object.assign(state[f.key], next[i]));
    parseError.value = '';
  } catch (err) {
    parseError.value = err.message;
  }
  updateNext();
};

updateNext();
</script>
<style scoped>
.cron-page {
  max-width: 1100px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.cron-title {
  font-size: 18px;
  text-align: center;
  color: #34495e;
  margin-bottom: 16px;
}

.cron-expr {
  margin-bottom: 16px;
}

.expr-input {
  font-family: Consolas, Monaco, 'Courier New', monospace;
}

.expr-error {
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #ff4d4f;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 6px;
}

.field-row {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #e8e8e8;
}

.field-label {
  flex: none;
  width: 40px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  background: #1677ff;
  border-radius: 4px;
}

.field-body {
  flex: 1;
  min-width: 0;
}

.field-extra {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.specify-select {
  width: 100%;
  max-width: 520px;
}

.week-select {
  width: 110px;
}

.block-title {
  font-size: 14px;
  font-weight: bold;
  color: #34495e;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e8e8;
}

.cron-next {
  margin-top: 20px;
}

.next-list {
  margin: 0;
  padding-left: 22px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.9;
}

.next-empty,
.next-note {
  font-size: 12px;
  color: #999;
}

.cron-examples {
  margin-top: 20px;
}

.example-item {
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.7;
  color: #555;
  font-family: Consolas, Monaco, 'Courier New', monospace;
}
</style>
