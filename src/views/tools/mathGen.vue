<template>
  <div class="math-gen">
    <!-- 装饰背景 -->
    <div class="paper-grid" aria-hidden="true"></div>
    <div class="decoration deco-1" aria-hidden="true">＋</div>
    <div class="decoration deco-2" aria-hidden="true">－</div>
    <div class="decoration deco-3" aria-hidden="true">×</div>
    <div class="decoration deco-4" aria-hidden="true">÷</div>

    <!-- 头部 -->
    <header class="hero">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        一年级 · 数学练习
      </div>
      <h1 class="hero-title">
        小小数学家
        <span class="title-accent">练习册</span>
      </h1>
      <p class="hero-sub">动动小脑筋，让数字跳起舞来 ✦ 自定义题目一键生成，可打印</p>
    </header>

    <!-- 设置面板 -->
    <section class="panel" :class="{ 'panel-collapsed': panelCollapsed }">
      <div class="panel-header" @click="panelCollapsed = !panelCollapsed">
        <div class="panel-title">
          <span class="panel-icon">⚙</span>
          题目设置
        </div>
        <div class="panel-summary">
          <span class="summary-chip">{{ typeLabel }}</span>
          <span class="summary-chip">{{ rangeLabel }}</span>
          <span class="summary-chip">{{ countLabel }}道</span>
          <span class="panel-toggle">{{ panelCollapsed ? '展开' : '收起' }}</span>
        </div>
      </div>

      <div class="panel-body" v-show="!panelCollapsed">
        <div class="setting-group">
          <label class="setting-label">题目类型</label>
          <div class="chip-row">
            <button
              v-for="opt in typeOptions"
              :key="opt.value"
              class="chip"
              :class="{ active: form.type === opt.value }"
              @click="form.type = opt.value"
            >
              <span class="chip-icon">{{ opt.icon }}</span>
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">数字范围</label>
          <div class="chip-row">
            <button
              v-for="opt in rangeOptions"
              :key="opt.value"
              class="chip"
              :class="{ active: form.range === opt.value }"
              @click="form.range = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-group setting-flex">
            <label class="setting-label">题目数量</label>
            <div class="chip-row">
              <button
                v-for="opt in countOptions"
                :key="opt"
                class="chip"
                :class="{ active: form.count === opt }"
                @click="form.count = opt"
              >
                {{ opt }}道
              </button>
            </div>
          </div>

          <div class="setting-group setting-flex">
            <label class="setting-label">每行显示</label>
            <div class="chip-row">
              <button
                v-for="opt in [2, 3, 4]"
                :key="opt"
                class="chip"
                :class="{ active: form.perRow === opt }"
                @click="form.perRow = opt"
              >
                {{ opt }}列
              </button>
            </div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-group setting-flex">
            <label class="setting-label">进位/退位</label>
            <div class="chip-row">
              <button
                class="chip"
                :class="{ active: form.carryMode === 'auto' }"
                @click="form.carryMode = 'auto'"
              >不限</button>
              <button
                class="chip"
                :class="{ active: form.carryMode === 'carry' }"
                @click="form.carryMode = 'carry'"
              >必须有</button>
              <button
                class="chip"
                :class="{ active: form.carryMode === 'none' }"
                @click="form.carryMode = 'none'"
              >不进位</button>
            </div>
          </div>

          <div class="setting-group setting-flex">
            <label class="setting-label">其他选项</label>
            <div class="switch-row">
              <label class="switch">
                <input type="checkbox" v-model="form.allowZero" />
                <span>允许结果为0</span>
              </label>
              <label class="switch">
                <input type="checkbox" v-model="form.showAnswer" />
                <span>显示答案</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 操作栏 -->
    <section class="action-bar">
      <button class="btn btn-primary" @click="generate">
        <span class="btn-icon">✦</span>
        生成新题目
      </button>
      <button class="btn btn-ghost" @click="toggleAnswer">
        <span class="btn-icon">{{ form.showAnswer ? '◐' : '◉' }}</span>
        {{ form.showAnswer ? '隐藏答案' : '显示答案' }}
      </button>
      <button class="btn btn-ghost" @click="printProblems">
        <span class="btn-icon">⎙</span>
        打印
      </button>
      <button class="btn btn-ghost" @click="copyToClipboard">
        <span class="btn-icon">⧉</span>
        复制题目
      </button>
      <div class="action-stat">
        <span class="stat-label">已生成</span>
        <span class="stat-value">{{ problems.length }}</span>
        <span class="stat-label">道</span>
      </div>
    </section>

    <!-- 题目卡片区 -->
    <section class="worksheet">
      <div class="worksheet-header">
        <div class="wh-left">
          <span class="wh-title">{{ worksheetTitle }}</span>
          <span class="wh-meta">共 {{ problems.length }} 题 · {{ rangeLabel }}</span>
        </div>
        <div class="wh-right">
          <span class="wh-score">姓名：__________ 得分：__________</span>
        </div>
      </div>

      <div v-if="problems.length === 0" class="empty">
        <div class="empty-emoji">∑</div>
        <div class="empty-title">还没有题目呢</div>
        <div class="empty-sub">点击上方"生成新题目"按钮，开始你的数学之旅</div>
      </div>

      <ul
        v-else
        class="problem-grid"
        :style="{ '--per-row': form.perRow }"
      >
        <li
          v-for="(p, i) in problems"
          :key="i"
          class="problem-item"
        >
          <div class="problem-index">{{ i + 1 }}.</div>
          <div class="problem-content">
            <template v-if="p.kind === 'compare'">
              <span class="num">{{ p.a }}</span>
              <span class="op-blank" v-if="!form.showAnswer">○</span>
              <span class="op-answer" v-else>{{ p.answer }}</span>
              <span class="num">{{ p.b }}</span>
            </template>
            <template v-else-if="p.kind === 'fillblank'">
              <template v-for="(seg, idx) in p.segments" :key="idx">
                <span v-if="seg === 'blank' && !form.showAnswer" class="op-blank">______</span>
                <span v-else-if="seg === 'blank' && form.showAnswer" class="op-answer">{{ p.answer }}</span>
                <span v-else class="op num">{{ seg }}</span>
              </template>
            </template>
            <template v-else>
              <span class="num">{{ p.a }}</span>
              <span class="op">{{ p.op }}</span>
              <span class="num">{{ p.b }}</span>
              <span v-if="p.c !== undefined" class="op">{{ p.op2 }}</span>
              <span v-if="p.c !== undefined" class="num">{{ p.c }}</span>
              <span class="op">=</span>
              <span class="op-blank" v-if="!form.showAnswer">______</span>
              <span class="op-answer" v-else>{{ p.answer }}</span>
            </template>
          </div>
        </li>
      </ul>
    </section>

    <!-- 页脚 -->
    <footer class="page-footer">
      <span>小小数学家练习册 · 在动脑中成长</span>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const typeOptions = [
  { value: 'add', label: '加法', icon: '＋' },
  { value: 'sub', label: '减法', icon: '－' },
  { value: 'mixed', label: '加减混合', icon: '±' },
  { value: 'consec', label: '连加连减', icon: '⊕' },
  { value: 'compare', label: '大小比较', icon: '≶' },
  { value: 'fillblank', label: '填空', icon: '◻' },
]

const rangeOptions = [
  { value: 10, label: '10以内' },
  { value: 20, label: '20以内' },
  { value: 50, label: '50以内' },
  { value: 100, label: '100以内' },
]

const countOptions = [10, 20, 30, 50, 100]

const form = reactive({
  type: 'add',
  range: 20,
  count: 30,
  perRow: 3,
  carryMode: 'auto', // auto / carry / none
  allowZero: true,
  showAnswer: false,
})

const panelCollapsed = ref(false)
const problems = ref([])

const typeLabel = computed(() =>
  typeOptions.find(t => t.value === form.type)?.label ?? ''
)
const rangeLabel = computed(() => `${form.range}以内`)
const countLabel = computed(() => `${form.count}`)
const worksheetTitle = computed(() => {
  const map = {
    add: '加法练习',
    sub: '减法练习',
    mixed: '加减混合练习',
    consec: '连加连减练习',
    compare: '大小比较',
    fillblank: '填空练习',
  }
  return map[form.type] ?? '数学练习'
})

// 工具函数
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// 判断进位
const hasCarryAdd = (a, b) => {
  // 个位相加是否进位
  const aOnes = a % 10
  const bOnes = b % 10
  return aOnes + bOnes >= 10
}
// 判断退位
const hasBorrowSub = (a, b) => {
  // a - b 是否退位
  const aOnes = a % 10
  const bOnes = b % 10
  return bOnes > aOnes
}

const pickAdd = (range) => {
  let a, b, tries = 0
  do {
    a = randInt(0, range)
    b = randInt(0, range - a)
    tries++
    if (tries > 100) break
    // 根据 carryMode 决定
    if (form.carryMode === 'carry' && range >= 20) {
      if (hasCarryAdd(a, b)) break
    } else if (form.carryMode === 'none' && range >= 20) {
      if (!hasCarryAdd(a, b)) break
    } else {
      break
    }
  } while (true)
  // 限制总和不超过 range
  if (a + b > range) {
    a = randInt(0, range)
    b = randInt(0, range - a)
  }
  if (!form.allowZero && a + b === 0) {
    a = randInt(1, range)
    b = randInt(0, range - a)
  }
  return { a, b, op: '+', answer: a + b }
}

const pickSub = (range) => {
  let a, b, tries = 0
  do {
    a = randInt(0, range)
    b = randInt(0, a)
    tries++
    if (tries > 100) break
    if (form.carryMode === 'carry' && range >= 20) {
      if (hasBorrowSub(a, b)) break
    } else if (form.carryMode === 'none' && range >= 20) {
      if (!hasBorrowSub(a, b)) break
    } else {
      break
    }
  } while (true)
  if (!form.allowZero && a - b === 0) {
    a = randInt(1, range)
    b = randInt(0, a - 1)
  }
  return { a, b, op: '−', answer: a - b }
}

const pickConsec = (range) => {
  // 连加或连减
  const isAdd = Math.random() < 0.5
  let a, b, c
  if (isAdd) {
    a = randInt(0, range)
    b = randInt(0, Math.max(0, range - a))
    c = randInt(0, Math.max(0, range - a - b))
    if (!form.allowZero && a + b + c === 0) {
      a = randInt(1, range)
    }
    return { a, b, c, op: '+', op2: '+', answer: a + b + c }
  } else {
    a = randInt(0, range)
    b = randInt(0, a)
    c = randInt(0, Math.max(0, a - b))
    if (!form.allowZero && a - b - c === 0) {
      a = randInt(1, range)
      b = randInt(0, a - 1)
      c = randInt(0, Math.max(0, a - b - 1))
    }
    return { a, b, c, op: '−', op2: '−', answer: a - b - c }
  }
}

const pickCompare = (range) => {
  const a = randInt(0, range)
  const b = randInt(0, range)
  let answer
  if (a > b) answer = '>'
  else if (a < b) answer = '<'
  else answer = '='
  return { a, b, kind: 'compare', answer }
}

const pickFillblank = (range) => {
  // 形如 ? + b = c, a + ? = c, a - ? = c, ? - b = c
  const pattern = randInt(0, 3)
  const op = Math.random() < 0.5 ? '+' : '−'
  let segments, answer
  if (op === '+') {
    const a = randInt(0, range)
    const b = randInt(0, range - a)
    const c = a + b
    if (pattern === 0) {
      segments = ['blank', '+', b, '=', c]
      answer = a
    } else if (pattern === 1) {
      segments = [a, '+', 'blank', '=', c]
      answer = b
    } else {
      segments = [a, '+', b, '=', 'blank']
      answer = c
    }
  } else {
    const a = randInt(0, range)
    const b = randInt(0, a)
    const c = a - b
    if (pattern === 0) {
      segments = ['blank', '−', b, '=', c]
      answer = a
    } else if (pattern === 1) {
      segments = [a, '−', 'blank', '=', c]
      answer = b
    } else {
      segments = [a, '−', b, '=', 'blank']
      answer = c
    }
  }
  return { kind: 'fillblank', segments, answer }
}

const generateOne = () => {
  switch (form.type) {
    case 'add': return pickAdd(form.range)
    case 'sub': return pickSub(form.range)
    case 'mixed':
      return Math.random() < 0.5 ? pickAdd(form.range) : pickSub(form.range)
    case 'consec': return pickConsec(form.range)
    case 'compare': return pickCompare(form.range)
    case 'fillblank': return pickFillblank(form.range)
    default: return pickAdd(form.range)
  }
}

const generate = () => {
  problems.value = Array.from({ length: form.count }, generateOne)
  message.success(`已生成 ${form.count} 道${typeLabel.value}题目`)
}

const toggleAnswer = () => {
  form.showAnswer = !form.showAnswer
}

const copyToClipboard = () => {
  if (problems.value.length === 0) {
    message.warning('请先生成题目')
    return
  }
  const text = problems.value
    .map((p, i) => {
      const expr = renderProblem(p, true)
      return `${i + 1}. ${expr}`
    })
    .join('\n')
  navigator.clipboard.writeText(`${worksheetTitle.value}（${rangeLabel.value}）\n${text}`)
    .then(() => message.success('题目已复制到剪贴板'))
    .catch(() => message.error('复制失败，请手动选择'))
}

const renderProblem = (p, withAnswer = false) => {
  if (p.kind === 'compare') {
    return `${p.a} ${withAnswer ? p.answer : '○'} ${p.b}`
  }
  if (p.kind === 'fillblank') {
    return p.segments
      .map(s => (s === 'blank' ? (withAnswer ? p.answer : '___') : s))
      .join(' ')
  }
  if (p.c !== undefined) {
    return `${p.a} ${p.op} ${p.b} ${p.op2} ${p.c} = ${withAnswer ? p.answer : '___'}`
  }
  return `${p.a} ${p.op} ${p.b} = ${withAnswer ? p.answer : '___'}`
}

const printProblems = () => {
  if (problems.value.length === 0) {
    message.warning('请先生成题目')
    return
  }
  const perRow = form.perRow
  const body = problems.value
    .map((p, i) => {
      const expr = renderProblem(p, form.showAnswer)
      return `<li class="p-item" style="width:${100 / perRow}%">
        <span class="p-idx">${i + 1}.</span>
        <span class="p-expr">${expr}</span>
      </li>`
    })
    .join('')
  const win = window.open('', '_blank')
  win.document.write(`
    <html>
    <head>
      <title>${worksheetTitle.value}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
          padding: 24px 32px;
          color: #1a1a1a;
        }
        h1 { font-size: 22px; margin: 0 0 4px; }
        .meta { font-size: 13px; color: #666; margin-bottom: 4px; }
        .info { font-size: 14px; margin: 8px 0 16px; border-bottom: 1px dashed #999; padding-bottom: 8px;}
        ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; }
        .p-item {
          padding: 14px 8px;
          font-size: 18px;
          display: flex;
          gap: 8px;
          align-items: baseline;
          border-bottom: 1px dashed #eee;
        }
        .p-idx { color: #888; flex-shrink: 0; }
        .p-expr { font-family: 'Cambria Math', 'Times New Roman', serif; }
        @media print {
          body { padding: 12mm; }
        }
      </style>
    </head>
    <body>
      <div class="meta">小小数学家练习册</div>
      <h1>${worksheetTitle.value}</h1>
      <div class="info">共 ${problems.value.length} 题 · ${rangeLabel.value}${form.showAnswer ? ' · 含答案' : ''}　　姓名：__________　　得分：__________</div>
      <ul>${body}</ul>
    </body>
    </html>
  `)
  win.document.close()
  setTimeout(() => {
    win.print()
  }, 300)
}

onMounted(() => {
  generate()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@400;500;700;900&display=swap');

.math-gen {
  --paper: #fbf7ec;
  --paper-line: #d9e2c8;
  --ink: #1f2418;
  --ink-soft: #5b6353;
  --accent: #e8552b;
  --accent-soft: #fde2d6;
  --yellow: #f6c648;
  --green: #4f8a3c;
  --blue: #2b67c9;
  --pink: #e85a8c;
  --border: #e3d9c2;

  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  color: var(--ink);
  background: var(--paper);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 28px 24px 60px;
}

/* 网格纸背景 */
.paper-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--paper-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--paper-line) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}

/* 装饰运算符 */
.decoration {
  position: absolute;
  font-family: 'ZCOOL KuaiLe', sans-serif;
  font-size: 96px;
  color: var(--ink);
  opacity: 0.04;
  z-index: 0;
  user-select: none;
  pointer-events: none;
}
.deco-1 { top: 40px; right: 4%; transform: rotate(15deg); }
.deco-2 { top: 240px; left: 2%; transform: rotate(-12deg); }
.deco-3 { bottom: 80px; right: 6%; transform: rotate(8deg); }
.deco-4 { bottom: 200px; left: 4%; transform: rotate(-20deg); }

/* Hero */
.hero {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px 0 28px;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--ink);
  color: var(--paper);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.5px;
  font-weight: 500;
}
.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px rgba(232, 85, 43, 0.3);
}
.hero-title {
  font-family: 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif;
  font-size: clamp(38px, 6vw, 64px);
  font-weight: 400;
  margin: 14px 0 8px;
  letter-spacing: 2px;
  line-height: 1.1;
}
.title-accent {
  display: inline-block;
  background: var(--accent);
  color: var(--paper);
  padding: 2px 14px 6px;
  border-radius: 8px 14px 8px 16px;
  transform: rotate(-2deg);
  margin-left: 6px;
  box-shadow: 4px 4px 0 var(--ink);
}
.hero-sub {
  font-size: 14px;
  color: var(--ink-soft);
  margin: 0;
  letter-spacing: 0.5px;
}

/* 设置面板 */
.panel {
  position: relative;
  z-index: 1;
  max-width: 1080px;
  margin: 0 auto;
  background: #fffdf6;
  border: 2px solid var(--ink);
  border-radius: 18px;
  box-shadow: 6px 6px 0 var(--ink);
  overflow: hidden;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
  user-select: none;
}
.panel-title {
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-icon {
  display: inline-block;
  animation: spin 8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.panel-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.summary-chip {
  background: var(--paper);
  color: var(--ink);
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
}
.panel-toggle {
  margin-left: 8px;
  color: var(--yellow);
  font-size: 12px;
}
.panel-body {
  padding: 22px;
}
.setting-group {
  margin-bottom: 18px;
}
.setting-label {
  display: block;
  font-size: 12px;
  color: var(--ink-soft);
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  border: 2px solid var(--border);
  background: #fff;
  color: var(--ink);
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
}
.chip:hover {
  transform: translateY(-2px);
  border-color: var(--ink);
}
.chip.active {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
  box-shadow: 3px 3px 0 var(--accent);
}
.chip-icon {
  font-family: 'ZCOOL KuaiLe', sans-serif;
  font-size: 16px;
  color: var(--accent);
}
.chip.active .chip-icon { color: var(--yellow); }

.setting-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.setting-flex { flex: 1; min-width: 240px; }

.switch-row {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  user-select: none;
}
.switch input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
}

/* 操作栏 */
.action-bar {
  position: relative;
  z-index: 1;
  max-width: 1080px;
  margin: 22px auto;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.btn {
  border: 2px solid var(--ink);
  background: #fff;
  color: var(--ink);
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.18s ease;
  box-shadow: 3px 3px 0 var(--ink);
}
.btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}
.btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}
.btn-primary {
  background: var(--accent);
  color: var(--paper);
}
.btn-ghost {
  background: #fffdf6;
}
.btn-icon {
  font-family: 'ZCOOL KuaiLe', sans-serif;
  font-size: 16px;
}

.action-stat {
  margin-left: auto;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 14px;
  background: var(--ink);
  color: var(--paper);
  border-radius: 999px;
  font-size: 13px;
}
.stat-value {
  font-family: 'ZCOOL KuaiLe', sans-serif;
  font-size: 20px;
  color: var(--yellow);
}

/* 工作表 */
.worksheet {
  position: relative;
  z-index: 1;
  max-width: 1080px;
  margin: 0 auto;
  background: #fff;
  border: 2px solid var(--ink);
  border-radius: 18px;
  box-shadow: 6px 6px 0 var(--ink);
  overflow: hidden;
}
.worksheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 22px;
  background: linear-gradient(90deg, #fffdf6 0%, #f9f3df 100%);
  border-bottom: 2px dashed var(--border);
  flex-wrap: wrap;
  gap: 8px;
}
.wh-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.wh-title {
  font-family: 'ZCOOL KuaiLe', sans-serif;
  font-size: 22px;
  color: var(--ink);
}
.wh-meta {
  font-size: 13px;
  color: var(--ink-soft);
}
.wh-right { font-size: 13px; color: var(--ink-soft); }

.problem-grid {
  list-style: none;
  margin: 0;
  padding: 8px 18px 22px;
  display: grid;
  grid-template-columns: repeat(var(--per-row, 3), 1fr);
  gap: 4px 8px;
}
.problem-item {
  padding: 14px 10px;
  border-bottom: 1px dashed var(--border);
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: clamp(16px, 2vw, 20px);
  font-family: 'Cambria Math', 'Times New Roman', serif;
  break-inside: avoid;
}
.problem-index {
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
  font-family: 'ZCOOL KuaiLe', sans-serif;
}
.problem-content {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.num { color: var(--ink); }
.op {
  color: var(--ink);
  font-weight: 600;
  margin: 0 2px;
}
.op-blank {
  display: inline-block;
  min-width: 40px;
  border-bottom: 2px solid var(--ink);
  text-align: center;
  color: transparent;
}
.op-answer {
  display: inline-block;
  color: var(--accent);
  font-weight: 700;
  background: var(--accent-soft);
  padding: 0 8px;
  border-radius: 6px;
  min-width: 28px;
  text-align: center;
}

/* 空状态 */
.empty {
  padding: 80px 24px;
  text-align: center;
}
.empty-emoji {
  font-size: 56px;
  color: var(--accent);
  font-family: 'ZCOOL KuaiLe', sans-serif;
}
.empty-title {
  font-family: 'ZCOOL KuaiLe', sans-serif;
  font-size: 24px;
  margin: 12px 0 6px;
}
.empty-sub {
  font-size: 14px;
  color: var(--ink-soft);
}

/* 页脚 */
.page-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 32px;
  font-size: 12px;
  color: var(--ink-soft);
  letter-spacing: 1px;
}

@media (max-width: 720px) {
  .math-gen { padding: 16px 12px 40px; }
  .decoration { display: none; }
  .setting-row { flex-direction: column; gap: 18px; }
  .setting-flex { min-width: 0; }
  .action-bar { justify-content: center; }
  .action-stat { margin-left: 0; }
  .panel-body { padding: 16px; }
  .worksheet-header { flex-direction: column; align-items: flex-start; }
  .problem-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .problem-item { font-size: 16px; }
}

@media print {
  .panel, .action-bar, .hero, .page-footer, .decoration, .paper-grid { display: none !important; }
  .math-gen { background: #fff; padding: 0; }
  .worksheet { box-shadow: none; border: none; }
}
</style>
