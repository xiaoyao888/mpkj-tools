<template>
  <div class="chinese-gen">
    <!-- 装饰背景：田字格 + 印章 -->
    <div class="paper-bg" aria-hidden="true"></div>
    <div class="seal seal-tl" aria-hidden="true">語</div>
    <div class="seal seal-br" aria-hidden="true">文</div>
    <div class="brush deco-b1" aria-hidden="true">永</div>
    <div class="brush deco-b2" aria-hidden="true">字</div>
    <div class="brush deco-b3" aria-hidden="true">八</div>
    <div class="brush deco-b4" aria-hidden="true">法</div>

    <!-- Hero -->
    <header class="hero">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        一年级 · 语文园地
      </div>
      <h1 class="hero-title">
        小小读书郎
        <span class="title-accent">字帖</span>
      </h1>
      <p class="hero-sub">横竖撇捺见真章　＊　拼音古诗一笔书</p>
    </header>

    <!-- 设置面板 -->
    <section class="panel" :class="{ 'panel-collapsed': panelCollapsed }">
      <div class="panel-header" @click="panelCollapsed = !panelCollapsed">
        <div class="panel-title">
          <span class="panel-icon">册</span>
          题型设置
        </div>
        <div class="panel-summary">
          <span class="summary-chip">{{ typeLabel }}</span>
          <span class="summary-chip">{{ countLabel }}题</span>
          <span class="panel-toggle">{{ panelCollapsed ? '展开' : '收起' }}</span>
        </div>
      </div>

      <div class="panel-body" v-show="!panelCollapsed">
        <div class="setting-group">
          <label class="setting-label">练习题型</label>
          <div class="chip-row">
            <button
              v-for="opt in typeOptions"
              :key="opt.value"
              class="chip"
              :class="{ active: form.type === opt.value }"
              @click="selectType(opt.value)"
            >
              <span class="chip-icon">{{ opt.icon }}</span>
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
              >{{ opt }}题</button>
            </div>
          </div>
          <div class="setting-group setting-flex" v-if="form.type !== 'poem' && form.type !== 'similar'">
            <label class="setting-label">每行显示</label>
            <div class="chip-row">
              <button
                v-for="opt in [2, 3, 4]"
                :key="opt"
                class="chip"
                :class="{ active: form.perRow === opt }"
                @click="form.perRow = opt"
              >{{ opt }}列</button>
            </div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-group setting-flex">
            <label class="setting-label">显示选项</label>
            <div class="switch-row">
              <label class="switch">
                <input type="checkbox" v-model="form.showAnswer" />
                <span>显示答案</span>
              </label>
              <label class="switch" v-if="form.type === 'pinyin' || form.type === 'cpinyin'">
                <input type="checkbox" v-model="form.showTone" />
                <span>显示声调</span>
              </label>
            </div>
          </div>
          <div class="setting-group setting-flex" v-if="form.type === 'poem'">
            <label class="setting-label">古诗选择</label>
            <div class="switch-row">
              <label class="switch">
                <input type="checkbox" v-model="form.randomPoem" />
                <span>随机抽题</span>
              </label>
              <label class="switch">
                <input type="checkbox" v-model="form.allPoems" />
                <span>全部古诗</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 古诗选择列表 -->
        <div class="setting-group" v-if="form.type === 'poem' && !form.allPoems">
          <label class="setting-label">选择古诗</label>
          <div class="poem-list">
            <label
              v-for="(p, i) in poemLibrary"
              :key="i"
              class="poem-pick"
              :class="{ active: selectedPoemIdx.includes(i) }"
            >
              <input type="checkbox" :value="i" v-model="selectedPoemIdx" />
              <span class="poem-title">{{ p.title }}</span>
              <span class="poem-author">{{ p.author }}</span>
            </label>
          </div>
        </div>
      </div>
    </section>

    <!-- 操作栏 -->
    <section class="action-bar">
      <button class="btn btn-primary" @click="generate">
        <span class="btn-icon">墨</span>
        重新出题
      </button>
      <button class="btn btn-ghost" @click="toggleAnswer">
        <span class="btn-icon">{{ form.showAnswer ? '藏' : '显' }}</span>
        {{ form.showAnswer ? '隐藏答案' : '显示答案' }}
      </button>
      <button class="btn btn-ghost" @click="printProblems">
        <span class="btn-icon">印</span>
        打印
      </button>
      <button class="btn btn-ghost" @click="copyToClipboard">
        <span class="btn-icon">抄</span>
        复制
      </button>
      <div class="action-stat">
        <span class="stat-label">共</span>
        <span class="stat-value">{{ problems.length }}</span>
        <span class="stat-label">题</span>
      </div>
    </section>

    <!-- 工作表 -->
    <section class="worksheet">
      <div class="worksheet-header">
        <div class="wh-left">
          <span class="wh-title">{{ worksheetTitle }}</span>
          <span class="wh-meta">{{ typeLabel }} · 一年级语文练习</span>
        </div>
        <div class="wh-right">
          <span class="wh-score">姓名：__________　得分：__________</span>
        </div>
      </div>

      <div v-if="problems.length === 0" class="empty">
        <div class="empty-emoji">文</div>
        <div class="empty-title">还没有题目</div>
        <div class="empty-sub">点击"重新出题"按钮，开始你的语文之旅</div>
      </div>

      <!-- 拼音类题型：田字格展示 -->
      <ul
        v-else-if="form.type === 'pinyin' || form.type === 'cpinyin' || form.type === 'strokes'"
        class="problem-grid char-grid"
        :style="{ '--per-row': form.perRow }"
      >
        <li v-for="(p, i) in problems" :key="i" class="problem-item char-item">
          <div class="char-index">{{ i + 1 }}.</div>
          <div class="char-cell">
            <!-- 田字格 -->
            <div class="tian-grid">
              <div class="tian-line tian-h"></div>
              <div class="tian-line tian-v"></div>
              <div class="tian-line tian-d1"></div>
              <div class="tian-line tian-d2"></div>
            </div>
            <span
              v-if="form.type === 'pinyin' || form.type === 'strokes' || (form.type === 'cpinyin' && form.showAnswer)"
              class="char-text"
              :class="{ 'char-big': form.type !== 'strokes' }"
            >{{ p.char }}</span>
          </div>
          <div class="char-meta">
            <template v-if="form.type === 'pinyin'">
              <div class="pinyin-line" v-if="!form.showAnswer">＿＿＿＿＿</div>
              <div class="pinyin-answer" v-else>{{ form.showTone ? p.pinyin : p.pinyinPlain }}</div>
            </template>
            <template v-else-if="form.type === 'cpinyin'">
              <div class="pinyin-show">{{ form.showTone ? p.pinyin : p.pinyinPlain }}</div>
            </template>
            <template v-else-if="form.type === 'strokes'">
              <div class="stroke-label">笔画数：</div>
              <div class="pinyin-line" v-if="!form.showAnswer">＿＿</div>
              <div class="pinyin-answer" v-else>{{ p.strokes }}画</div>
            </template>
          </div>
        </li>
      </ul>

      <!-- 组词题型 -->
      <ul
        v-else-if="form.type === 'word'"
        class="problem-grid word-grid"
        :style="{ '--per-row': form.perRow }"
      >
        <li v-for="(p, i) in problems" :key="i" class="problem-item word-item">
          <div class="problem-index">{{ i + 1 }}.</div>
          <div class="word-content">
            <span class="word-char">{{ p.char }}</span>
            <span class="word-arrow">→</span>
            <span class="word-blank" v-if="!form.showAnswer">（　　　）（　　　）（　　　）</span>
            <span class="word-answer" v-else>（{{ p.words.join('）（') }}）</span>
          </div>
        </li>
      </ul>

      <!-- 古诗填空 -->
      <div v-else-if="form.type === 'poem'" class="poem-area">
        <div v-for="(poem, pi) in poemProblems" :key="pi" class="poem-card">
          <div class="poem-head">
            <span class="poem-name">《{{ poem.title }}》</span>
            <span class="poem-writer">{{ poem.author }}</span>
          </div>
          <div class="poem-lines">
            <div v-for="(line, li) in poem.lines" :key="li" class="poem-line">
              <template v-for="(ch, ci) in line.chars" :key="ci">
                <span v-if="ch === 'blank' && !form.showAnswer" class="poem-blank">＿＿</span>
                <span v-else-if="ch === 'blank' && form.showAnswer" class="poem-answer">{{ line.answer[0] }}</span>
                <span v-else class="poem-char">{{ ch }}</span>
              </template>
            </div>
          </div>
          <div class="poem-foot" v-if="form.showAnswer">
            答案：{{ poem.lines.map(l => l.answer.join(',')).join(' | ') }}
          </div>
        </div>
      </div>

      <!-- 形近字辨析 -->
      <ul
        v-else-if="form.type === 'similar'"
        class="problem-grid similar-grid"
        :style="{ '--per-row': 1 }"
      >
        <li v-for="(p, i) in problems" :key="i" class="problem-item similar-item">
          <div class="problem-index">{{ i + 1 }}.</div>
          <div class="similar-content">
            <div class="similar-pair">
              <span class="similar-char">{{ p.a }}</span>
              <span class="similar-sep">/</span>
              <span class="similar-char">{{ p.b }}</span>
            </div>
            <div class="similar-words">
              <span class="similar-blank" v-if="!form.showAnswer">＿＿</span>
              <span class="similar-ans" v-else>{{ p.answer1 }}</span>
              <span class="word-tail">{{ p.word1Tail }}</span>
              <span class="similar-sep2">　　</span>
              <span class="word-tail-prefix">{{ p.word2Head }}</span>
              <span class="similar-blank" v-if="!form.showAnswer">＿＿</span>
              <span class="similar-ans" v-else>{{ p.answer2 }}</span>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <footer class="page-footer">
      <span>小小读书郎字帖 · 笔墨之间见天地</span>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'

// ===== 一年级常用汉字库（带拼音、笔画、组词）=====
const charLibrary = [
  // 数字
  { c: '一', p: 'yī', s: 1, w: ['一起', '一定', '一同'] },
  { c: '二', p: 'èr', s: 2, w: ['二十', '第二', '二年级'] },
  { c: '三', p: 'sān', s: 3, w: ['三十', '三月', '三个'] },
  { c: '四', p: 'sì', s: 5, w: ['四月', '四十', '四面'] },
  { c: '五', p: 'wǔ', s: 4, w: ['五月', '五十', '五个'] },
  { c: '六', p: 'liù', s: 4, w: ['六月', '六十', '六一'] },
  { c: '七', p: 'qī', s: 2, w: ['七月', '七十', '七个'] },
  { c: '八', p: 'bā', s: 2, w: ['八月', '八十', '八个'] },
  { c: '九', p: 'jiǔ', s: 2, w: ['九月', '九十', '九个'] },
  { c: '十', p: 'shí', s: 2, w: ['十月', '一百', '十分'] },
  // 人体
  { c: '人', p: 'rén', s: 2, w: ['人们', '人民', '工人'] },
  { c: '口', p: 'kǒu', s: 3, w: ['口水', '开口', '入口'] },
  { c: '手', p: 'shǒu', s: 4, w: ['双手', '手指', '拍手'] },
  { c: '目', p: 'mù', s: 5, w: ['目光', '目的', '节目'] },
  { c: '耳', p: 'ěr', s: 6, w: ['耳朵', '木耳', '耳目'] },
  { c: '头', p: 'tóu', s: 5, w: ['头发', '抬头', '石头'] },
  { c: '牙', p: 'yá', s: 4, w: ['牙齿', '刷牙', '门牙'] },
  { c: '心', p: 'xīn', s: 4, w: ['开心', '心里', '关心'] },
  // 自然
  { c: '日', p: 'rì', s: 4, w: ['日出', '生日', '今日'] },
  { c: '月', p: 'yuè', s: 4, w: ['月亮', '月光', '明月'] },
  { c: '水', p: 'shuǐ', s: 4, w: ['水果', '开水', '山水'] },
  { c: '火', p: 'huǒ', s: 4, w: ['火车', '水火', '生火'] },
  { c: '山', p: 'shān', s: 3, w: ['山水', '高山', '青山'] },
  { c: '石', p: 'shí', s: 5, w: ['石头', '宝石', '玉石'] },
  { c: '田', p: 'tián', s: 5, w: ['田野', '田地', '水田'] },
  { c: '木', p: 'mù', s: 4, w: ['树木', '木头', '木马'] },
  { c: '风', p: 'fēng', s: 4, w: ['风雨', '大风', '风景'] },
  { c: '云', p: 'yún', s: 4, w: ['白云', '云彩', '乌云'] },
  { c: '雨', p: 'yǔ', s: 8, w: ['下雨', '雨水', '小雨'] },
  { c: '雪', p: 'xuě', s: 11, w: ['下雪', '雪人', '雪花'] },
  { c: '天', p: 'tiān', s: 4, w: ['天空', '今天', '明天'] },
  { c: '地', p: 'dì', s: 6, w: ['地上', '地方', '天地'] },
  // 方向
  { c: '上', p: 'shàng', s: 3, w: ['上面', '上午', '上山'] },
  { c: '下', p: 'xià', s: 3, w: ['下面', '下午', '下雨'] },
  { c: '左', p: 'zuǒ', s: 5, w: ['左手', '左边', '左右'] },
  { c: '右', p: 'yòu', s: 5, w: ['右手', '右边', '左右'] },
  { c: '前', p: 'qián', s: 9, w: ['前面', '从前', '前进'] },
  { c: '后', p: 'hòu', s: 6, w: ['后面', '后来', '以后'] },
  // 称谓
  { c: '爸', p: 'bà', s: 8, w: ['爸爸'] },
  { c: '妈', p: 'mā', s: 6, w: ['妈妈'] },
  { c: '哥', p: 'gē', s: 10, w: ['哥哥', '大哥'] },
  { c: '姐', p: 'jiě', s: 8, w: ['姐姐', '大姐'] },
  { c: '弟', p: 'dì', s: 7, w: ['弟弟', '兄弟'] },
  { c: '你', p: 'nǐ', s: 7, w: ['你们', '你好', '你的'] },
  { c: '我', p: 'wǒ', s: 7, w: ['我们', '自我', '我家'] },
  { c: '他', p: 'tā', s: 5, w: ['他们', '他人', '其他'] },
  // 颜色
  { c: '红', p: 'hóng', s: 6, w: ['红色', '红花', '粉红'] },
  { c: '黄', p: 'huáng', s: 11, w: ['黄色', '金黄', '黄河'] },
  { c: '蓝', p: 'lán', s: 13, w: ['蓝色', '蓝天', '深蓝'] },
  { c: '绿', p: 'lǜ', s: 11, w: ['绿色', '绿叶'] },
  { c: '白', p: 'bái', s: 5, w: ['白色', '白云', '白天'] },
  { c: '黑', p: 'hēi', s: 12, w: ['黑色', '黑夜', '黑白'] },
  // 动物
  { c: '鸟', p: 'niǎo', s: 5, w: ['小鸟', '飞鸟', '鸟儿'] },
  { c: '鱼', p: 'yú', s: 8, w: ['小鱼', '大鱼', '金鱼'] },
  { c: '马', p: 'mǎ', s: 3, w: ['小马', '马上', '马车'] },
  { c: '羊', p: 'yáng', s: 6, w: ['小羊', '山羊', '羊毛'] },
  { c: '猫', p: 'māo', s: 11, w: ['小猫', '猫咪', '花猫'] },
  { c: '狗', p: 'gǒu', s: 8, w: ['小狗', '热狗', '狼狗'] },
  // 植物
  { c: '花', p: 'huā', s: 7, w: ['花朵', '红花', '花生'] },
  { c: '草', p: 'cǎo', s: 9, w: ['小草', '草地', '青草'] },
  { c: '树', p: 'shù', s: 9, w: ['树木', '树叶', '大树'] },
  { c: '叶', p: 'yè', s: 5, w: ['树叶', '叶子', '落叶'] },
  // 大小
  { c: '大', p: 'dà', s: 3, w: ['大小', '大人', '大家'] },
  { c: '小', p: 'xiǎo', s: 3, w: ['小人', '小事', '小鸟'] },
  { c: '多', p: 'duō', s: 6, w: ['多少', '许多', '多于'] },
  { c: '少', p: 'shǎo', s: 4, w: ['少年', '少数'] },
  // 其他常用
  { c: '的', p: 'de', s: 8, w: ['好的', '我的', '你的'] },
  { c: '了', p: 'le', s: 2, w: ['好了', '来了', '到了'] },
  { c: '在', p: 'zài', s: 6, w: ['现在', '正在', '在场'] },
  { c: '有', p: 'yǒu', s: 6, w: ['没有', '有的', '有人'] },
  { c: '中', p: 'zhōng', s: 4, w: ['中间', '中国', '心中'] },
  { c: '里', p: 'lǐ', s: 7, w: ['里面', '里头', '这里'] },
  { c: '不', p: 'bù', s: 4, w: ['不是', '不好', '不行'] },
  { c: '好', p: 'hǎo', s: 6, w: ['好的', '你好', '好处'] },
]

// ===== 古诗库 =====
const poemLibrary = [
  {
    title: '静夜思',
    author: '唐 · 李白',
    text: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
    blanks: [[2], [4], [3], [3]], // 每行挖空位置（字符索引）
  },
  {
    title: '春晓',
    author: '唐 · 孟浩然',
    text: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'],
    blanks: [[4], [2], [4], [2]],
  },
  {
    title: '咏鹅',
    author: '唐 · 骆宾王',
    text: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'],
    blanks: [[0], [1], [2], [3]],
  },
  {
    title: '画',
    author: '唐 · 王维',
    text: ['远看山有色', '近听水无声', '春去花还在', '人来鸟不惊'],
    blanks: [[4], [4], [3], [4]],
  },
  {
    title: '悯农',
    author: '唐 · 李绅',
    text: ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'],
    blanks: [[4], [4], [4], [4]],
  },
  {
    title: '一去二三里',
    author: '宋 · 邵雍',
    text: ['一去二三里', '烟村四五家', '亭台六七座', '八九十枝花'],
    blanks: [[1], [1], [1], [1]],
  },
]

// ===== 形近字组 =====
const similarPairs = [
  { a: '人', b: '入', w1: '人们', w2: '进入' },
  { a: '九', b: '丸', w1: '九十', w2: '药丸' },
  { a: '目', b: '日', w1: '目光', w2: '日光' },
  { a: '田', b: '由', w1: '田地', w2: '自由' },
  { a: '大', b: '太', w1: '大小', w2: '太阳' },
  { a: '王', b: '玉', w1: '大王', w2: '玉石' },
  { a: '月', b: '用', w1: '月光', w2: '用处' },
  { a: '了', b: '子', w1: '好了', w2: '孩子' },
  { a: '木', b: '本', w1: '木头', w2: '本来' },
  { a: '儿', b: '几', w1: '儿女', w2: '几个' },
  { a: '工', b: '土', w1: '工人', w2: '土地' },
  { a: '天', b: '夫', w1: '天空', w2: '丈夫' },
  { a: '鸟', b: '乌', w1: '小鸟', w2: '乌云' },
  { a: '牛', b: '午', w1: '小牛', w2: '上午' },
  { a: '白', b: '百', w1: '白天', w2: '一百' },
  { a: '老', b: '考', w1: '老师', w2: '考试' },
]

// ===== 选项 =====
const typeOptions = [
  { value: 'pinyin', label: '看字写拼音', icon: '拼' },
  { value: 'cpinyin', label: '看拼音写字', icon: '字' },
  { value: 'word', label: '组词练习', icon: '词' },
  { value: 'strokes', label: '笔画数', icon: '画' },
  { value: 'poem', label: '古诗填空', icon: '诗' },
  { value: 'similar', label: '形近字', icon: '辨' },
]
const countOptions = [10, 20, 30, 50, 100, 500, 1000, 2000, 5000]

const form = reactive({
  type: 'pinyin',
  count: 20,
  perRow: 4,
  showAnswer: false,
  showTone: true,
  randomPoem: true,
  allPoems: true,
})

const panelCollapsed = ref(false)
const problems = ref([])
const poemProblems = ref([])
const selectedPoemIdx = ref([0])

const typeLabel = computed(() =>
  typeOptions.find(t => t.value === form.type)?.label ?? ''
)
const countLabel = computed(() => `${form.count}`)
const worksheetTitle = computed(() => {
  const map = {
    pinyin: '看字写拼音',
    cpinyin: '看拼音写字',
    word: '组词练习',
    strokes: '笔画数练习',
    poem: '古诗填空',
    similar: '形近字辨析',
  }
  return map[form.type] ?? '语文练习'
})

// 去除声调
const stripTone = (p) => p.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (m) => {
  const map = { ā: 'a', á: 'a', ǎ: 'a', à: 'a', ē: 'e', é: 'e', ě: 'e', è: 'e', ī: 'i', í: 'i', ǐ: 'i', ì: 'i', ō: 'o', ó: 'o', ǒ: 'o', ò: 'o', ū: 'u', ú: 'u', ǔ: 'u', ù: 'u', ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v' }
  return map[m] || m
})

const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

const selectType = (t) => {
  form.type = t
  generate()
}

const generatePinyin = () => {
  return pickN(charLibrary, form.count).map(ch => ({
    char: ch.c,
    pinyin: ch.p,
    pinyinPlain: stripTone(ch.p),
    strokes: ch.s,
  }))
}

const generateStrokes = () => {
  return pickN(charLibrary, form.count).map(ch => ({
    char: ch.c,
    pinyin: ch.p,
    pinyinPlain: stripTone(ch.p),
    strokes: ch.s,
  }))
}

const generateWord = () => {
  return pickN(charLibrary.filter(c => c.w.length >= 2), form.count).map(ch => ({
    char: ch.c,
    words: ch.w,
  }))
}

const generateSimilar = () => {
  return pickN(similarPairs, Math.min(form.count, similarPairs.length)).map(p => {
    const w1 = p.w1
    const w2 = p.w2
    // 找出 a 在 w1 中的位置，b 在 w2 中的位置
    const aPos = w1.indexOf(p.a)
    const bPos = w2.indexOf(p.b)
    // 随机决定显示顺序
    const showReverse = Math.random() < 0.5
    return {
      a: showReverse ? p.b : p.a,
      b: showReverse ? p.a : p.b,
      word1Head: w1.slice(0, aPos),
      word1Tail: w1.slice(aPos + 1),
      word2Head: w2.slice(0, bPos),
      word2Tail: w2.slice(bPos + 1),
      answer1: p.a,
      answer2: p.b,
    }
  })
}

const generatePoem = () => {
  let pool = []
  if (form.allPoems) {
    pool = poemLibrary.map((_, i) => i)
  } else if (selectedPoemIdx.value.length > 0) {
    pool = [...selectedPoemIdx.value]
  } else {
    pool = [0]
  }
  if (form.randomPoem && !form.allPoems) {
    pool = [pool[Math.floor(Math.random() * pool.length)]]
  }
  if (form.randomPoem && form.allPoems) {
    // 随机选1-3首
    const n = Math.min(pool.length, Math.floor(Math.random() * 3) + 1)
    pool = pickN(pool, n)
  }
  return pool.map(idx => {
    const p = poemLibrary[idx]
    const lines = p.text.map((line, li) => {
      const blanks = p.blanks[li] || []
      const chars = line.split('').map((ch, ci) => blanks.includes(ci) ? 'blank' : ch)
      const answer = blanks.map(bi => line[bi])
      return { chars, answer }
    })
    return { title: p.title, author: p.author, lines }
  })
}

const generate = () => {
  if (form.type === 'poem') {
    poemProblems.value = generatePoem()
    problems.value = []
    message.success(`已生成 ${poemProblems.value.length} 首古诗`)
    return
  }
  poemProblems.value = []
  switch (form.type) {
    case 'pinyin':
    case 'cpinyin':
      problems.value = generatePinyin()
      break
    case 'word':
      problems.value = generateWord()
      break
    case 'strokes':
      problems.value = generateStrokes()
      break
    case 'similar':
      problems.value = generateSimilar()
      break
    default:
      problems.value = generatePinyin()
  }
  message.success(`已生成 ${problems.value.length} 道${typeLabel.value}题目`)
}

const toggleAnswer = () => {
  form.showAnswer = !form.showAnswer
}

// 复制文本
const buildCopyText = () => {
  if (form.type === 'poem') {
    return poemProblems.value.map(p => {
      const lines = p.lines.map(l =>
        l.chars.map(c => c === 'blank' ? (form.showAnswer ? l.answer[0] : '＿') : c).join('')
      ).join('\n')
      return `《${p.title}》 ${p.author}\n${lines}`
    }).join('\n\n')
  }
  if (form.type === 'pinyin') {
    return problems.value.map((p, i) =>
      `${i + 1}. ${p.char} — ${form.showAnswer ? (form.showTone ? p.pinyin : p.pinyinPlain) : '___'}`
    ).join('\n')
  }
  if (form.type === 'cpinyin') {
    return problems.value.map((p, i) =>
      `${i + 1}. ${form.showTone ? p.pinyin : p.pinyinPlain} — ${form.showAnswer ? p.char : '___'}`
    ).join('\n')
  }
  if (form.type === 'word') {
    return problems.value.map((p, i) =>
      `${i + 1}. ${p.char} → ${form.showAnswer ? p.words.join('、') : '____'}`
    ).join('\n')
  }
  if (form.type === 'strokes') {
    return problems.value.map((p, i) =>
      `${i + 1}. ${p.char}（${form.showAnswer ? p.strokes + '画' : '___'}）`
    ).join('\n')
  }
  if (form.type === 'similar') {
    return problems.value.map((p, i) =>
      `${i + 1}. ${p.a}/${p.b}　${p.word1Head}＿${p.word1Tail}→${form.showAnswer ? p.answer1 : '_'}　${p.word2Head}＿${p.word2Tail}→${form.showAnswer ? p.answer2 : '_'}`
    ).join('\n')
  }
  return ''
}

const copyToClipboard = () => {
  if (problems.value.length === 0 && poemProblems.value.length === 0) {
    message.warning('请先生成题目')
    return
  }
  const text = `${worksheetTitle.value}\n${buildCopyText()}`
  navigator.clipboard.writeText(text)
    .then(() => message.success('题目已复制到剪贴板'))
    .catch(() => message.error('复制失败，请手动选择'))
}

const printProblems = () => {
  if (problems.value.length === 0 && poemProblems.value.length === 0) {
    message.warning('请先生成题目')
    return
  }
  let body = ''
  if (form.type === 'poem') {
    body = poemProblems.value.map(p => {
      const lines = p.lines.map(l => {
        return l.chars.map(c => c === 'blank' ? (form.showAnswer ? `<span class="ans">${l.answer[0]}</span>` : '＿') : c).join('')
      }).join('<br>')
      return `<div class="poem"><div class="ptitle">《${p.title}》 ${p.author}</div><div class="plines">${lines}</div></div>`
    }).join('')
  } else if (form.type === 'pinyin' || form.type === 'cpinyin' || form.type === 'strokes') {
    const perRow = form.perRow
    body = `<ul class="grid" style="--per-row:${perRow}">` + problems.value.map((p, i) => {
      let main = ''
      let sub = ''
      if (form.type === 'pinyin') {
        main = p.char
        sub = form.showAnswer ? (form.showTone ? p.pinyin : p.pinyinPlain) : '＿＿＿'
      } else if (form.type === 'cpinyin') {
        main = form.showAnswer ? p.char : '　'
        sub = form.showTone ? p.pinyin : p.pinyinPlain
      } else if (form.type === 'strokes') {
        main = p.char
        sub = form.showAnswer ? p.strokes + '画' : '＿＿画'
      }
      return `<li class="cell"><div class="idx">${i + 1}.</div><div class="tian"><div class="th"></div><div class="tv"></div><div class="td1"></div><div class="td2"></div><span class="ch">${main}</span></div><div class="sub">${sub}</div></li>`
    }).join('') + '</ul>'
  } else if (form.type === 'word') {
    const perRow = form.perRow
    body = `<ul class="grid" style="--per-row:${perRow}">` + problems.value.map((p, i) =>
      `<li class="cell"><span class="idx">${i + 1}.</span><span class="ch">${p.char}</span><span class="arrow">→</span><span class="ans">${form.showAnswer ? p.words.join('、') : '＿＿＿、＿＿＿、＿＿＿'}</span></li>`
    ).join('') + '</ul>'
  } else if (form.type === 'similar') {
    body = `<ul class="grid" style="--per-row:1">` + problems.value.map((p, i) =>
      `<li class="cell sim"><span class="idx">${i + 1}.</span><div class="pair">${p.a} / ${p.b}</div><div class="ws"><span class="w">${p.word1Head}＿${p.word1Tail}</span><span class="ans">${form.showAnswer ? p.answer1 : '＿'}</span>　<span class="w">${p.word2Head}＿${p.word2Tail}</span><span class="ans">${form.showAnswer ? p.answer2 : '＿'}</span></div></li>`
    ).join('') + '</ul>'
  }
  const win = window.open('', '_blank')
  win.document.write(`
    <html><head><title>${worksheetTitle.value}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'KaiTi', '楷体', 'Microsoft YaHei', serif; padding: 24px 32px; color: #1a1a1a; }
      h1 { font-size: 22px; margin: 0 0 4px; font-family: 'KaiTi', serif; }
      .meta { font-size: 13px; color: #666; margin-bottom: 4px; }
      .info { font-size: 14px; margin: 8px 0 16px; border-bottom: 1px dashed #999; padding-bottom: 8px; }
      ul.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(var(--per-row, 4), 1fr); gap: 16px 8px; }
      .cell { display: flex; align-items: center; gap: 8px; font-size: 18px; flex-wrap: wrap; border-bottom: 1px dashed #eee; padding: 8px 4px; }
      .idx { color: #5b6353; flex-shrink: 0; }
      .tian { position: relative; width: 48px; height: 48px; border: 1px solid #333; display: inline-flex; align-items: center; justify-content: center; }
      .th { position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed #bbb; }
      .tv { position: absolute; top: 0; bottom: 0; left: 50%; border-left: 1px dashed #bbb; }
      .td1, .td2 { position: absolute; left: 0; right: 0; top: 0; bottom: 0; }
      .td1 { border-top: 1px dashed #ddd; transform: rotate(45deg); transform-origin: center; }
      .td2 { border-top: 1px dashed #ddd; transform: rotate(-45deg); transform-origin: center; }
      .ch { font-size: 28px; font-family: 'KaiTi', '楷体', serif; position: relative; z-index: 1; }
      .sub { width: 100%; text-align: center; font-size: 14px; color: #444; padding-top: 4px; }
      .arrow { color: #888; }
      .ans { color: #2b67c9; font-weight: 600; }
      .pair { font-size: 18px; margin: 0 12px; }
      .pair, .ws { display: inline-block; }
      .sim { font-size: 16px; }
      .poem { margin-bottom: 24px; text-align: center; }
      .ptitle { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
      .plines { font-size: 20px; line-height: 2; font-family: 'KaiTi', serif; }
      .poem .ans { color: #c8392b; font-weight: bold; }
      @media print { body { padding: 12mm; } }
    </style></head>
    <body>
      <div class="meta">小小读书郎字帖</div>
      <h1>${worksheetTitle.value}</h1>
      <div class="info">一年级语文练习${form.showAnswer ? ' · 含答案' : ''}　　姓名：__________　　得分：__________</div>
      ${body}
    </body></html>
  `)
  win.document.close()
  setTimeout(() => win.print(), 300)
}

watch(() => form.allPoems, (v) => {
  if (v) form.randomPoem = true
})

onMounted(() => {
  generate()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500;700;900&display=swap');

.chinese-gen {
  --paper: #fbf7ec;
  --paper-line: #d4dcd0;
  --ink: #1f2418;
  --ink-soft: #5b6353;
  --accent: #2f6e3d;       /* 墨竹绿 */
  --accent-soft: #d7e7d3;
  --cinnabar: #b8341d;    /* 朱砂红（印章）*/
  --gold: #b58a30;
  --border: #d8c8a8;
  --shen: #2a3328;

  font-family: 'Noto Serif SC', 'Microsoft YaHei', serif;
  color: var(--ink);
  background: var(--paper);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 28px 24px 60px;
}

/* 田字格背景 */
.paper-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--paper-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--paper-line) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
}

/* 印章装饰 */
.seal {
  position: absolute;
  width: 64px;
  height: 64px;
  background: var(--cinnabar);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Ma Shan Zheng', 'ZCOOL KuaiLe', serif;
  font-size: 32px;
  border-radius: 6px;
  opacity: 0.18;
  z-index: 0;
  user-select: none;
  pointer-events: none;
  box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4px var(--cinnabar);
}
.seal-tl { top: 30px; left: 16px; transform: rotate(-6deg); }
.seal-br { bottom: 60px; right: 16px; transform: rotate(4deg); }

/* 大字装饰 */
.brush {
  position: absolute;
  font-family: 'Ma Shan Zheng', serif;
  font-size: 140px;
  color: var(--ink);
  opacity: 0.04;
  z-index: 0;
  user-select: none;
  pointer-events: none;
}
.deco-b1 { top: 30px; right: 6%; transform: rotate(8deg); }
.deco-b2 { top: 280px; left: 2%; transform: rotate(-10deg); }
.deco-b3 { bottom: 60px; right: 4%; transform: rotate(12deg); }
.deco-b4 { bottom: 220px; left: 3%; transform: rotate(-8deg); }

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
  box-shadow: 0 0 0 3px rgba(47, 110, 61, 0.3);
}
.hero-title {
  font-family: 'Ma Shan Zheng', 'ZCOOL KuaiLe', serif;
  font-size: clamp(38px, 6vw, 64px);
  font-weight: 400;
  margin: 14px 0 8px;
  letter-spacing: 4px;
  line-height: 1.1;
}
.title-accent {
  display: inline-block;
  background: var(--accent);
  color: var(--paper);
  padding: 2px 16px 6px;
  border-radius: 6px 14px 8px 16px;
  transform: rotate(-2deg);
  margin-left: 6px;
  box-shadow: 4px 4px 0 var(--ink);
}
.hero-sub {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 16px;
  color: var(--ink-soft);
  margin: 0;
  letter-spacing: 2px;
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
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 2px;
}
.panel-icon {
  display: inline-block;
  background: var(--accent);
  color: var(--paper);
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
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
  color: var(--gold);
  font-size: 12px;
}
.panel-body { padding: 22px; }
.setting-group { margin-bottom: 18px; }
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
  font-family: 'Ma Shan Zheng', serif;
  font-size: 16px;
  color: var(--cinnabar);
}
.chip.active .chip-icon { color: var(--gold); }

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
  align-items: center;
  padding-top: 8px;
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

/* 古诗选择 */
.poem-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.poem-pick {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  background: #fff;
  user-select: none;
}
.poem-pick.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.poem-pick input { accent-color: var(--accent); }
.poem-title {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 15px;
  letter-spacing: 1px;
}
.poem-author {
  color: var(--ink-soft);
  font-size: 11px;
  margin-left: auto;
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
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 1px;
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
.btn-ghost { background: #fffdf6; }
.btn-icon {
  font-family: 'Ma Shan Zheng', serif;
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
  font-family: 'Ma Shan Zheng', serif;
  font-size: 20px;
  color: var(--gold);
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
  background: linear-gradient(90deg, #fffdf6 0%, #f4f0e0 100%);
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
  font-family: 'Ma Shan Zheng', serif;
  font-size: 24px;
  color: var(--ink);
  letter-spacing: 2px;
}
.wh-meta { font-size: 13px; color: var(--ink-soft); }
.wh-right { font-size: 13px; color: var(--ink-soft); }

.problem-grid {
  list-style: none;
  margin: 0;
  padding: 12px 18px 22px;
  display: grid;
  grid-template-columns: repeat(var(--per-row, 4), 1fr);
  gap: 8px;
}
.problem-item {
  padding: 12px 8px;
  border-bottom: 1px dashed var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  break-inside: avoid;
}
.problem-index {
  color: var(--cinnabar);
  font-weight: 700;
  flex-shrink: 0;
  font-family: 'Ma Shan Zheng', serif;
  letter-spacing: 1px;
}

/* 字 + 拼音题型 */
.char-item {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}
.char-index {
  color: var(--cinnabar);
  font-family: 'Ma Shan Zheng', serif;
  font-size: 13px;
  letter-spacing: 1px;
  align-self: flex-start;
}
.char-cell {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-width: 90px;
  margin: 0 auto;
  border: 1.5px solid var(--ink);
  background: #fffdf6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tian-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.tian-line { position: absolute; }
.tian-h { left: 0; right: 0; top: 50%; border-top: 1px dashed var(--ink-soft); opacity: 0.4; }
.tian-v { top: 0; bottom: 0; left: 50%; border-left: 1px dashed var(--ink-soft); opacity: 0.4; }
.tian-d1 {
  left: 0; right: 0; top: 50%; height: 0;
  border-top: 1px dashed var(--ink-soft);
  transform: rotate(45deg);
  transform-origin: center;
  opacity: 0.25;
}
.tian-d2 {
  left: 0; right: 0; top: 50%; height: 0;
  border-top: 1px dashed var(--ink-soft);
  transform: rotate(-45deg);
  transform-origin: center;
  opacity: 0.25;
}
.char-text {
  font-family: 'Ma Shan Zheng', 'KaiTi', '楷体', serif;
  font-size: 28px;
  color: var(--ink);
  position: relative;
  z-index: 1;
  line-height: 1;
}
.char-big { font-size: 40px; }
.char-meta {
  text-align: center;
  width: 100%;
  font-family: 'Noto Serif SC', serif;
}
.pinyin-line {
  font-size: 14px;
  color: var(--ink-soft);
  letter-spacing: 2px;
  padding: 4px 0;
}
.pinyin-answer {
  font-size: 16px;
  color: var(--cinnabar);
  font-weight: 700;
  background: var(--accent-soft);
  padding: 2px 10px;
  border-radius: 6px;
  display: inline-block;
}
.pinyin-show {
  font-size: 16px;
  color: var(--ink);
  font-weight: 600;
  padding: 4px 0;
}
.char-answer {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 24px;
  color: var(--cinnabar);
  background: var(--accent-soft);
  padding: 0 10px;
  border-radius: 6px;
  display: inline-block;
}
.stroke-label {
  font-size: 13px;
  color: var(--ink-soft);
  margin-bottom: 4px;
}

/* 组词题型 */
.word-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 18px;
}
.word-char {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 28px;
  color: var(--ink);
  background: var(--accent-soft);
  padding: 2px 12px;
  border-radius: 8px;
}
.word-arrow { color: var(--ink-soft); }
.word-blank {
  color: var(--ink-soft);
  font-size: 16px;
  letter-spacing: 2px;
}
.word-answer {
  color: var(--cinnabar);
  font-weight: 700;
  font-size: 16px;
}

/* 古诗 */
.poem-area {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.poem-card {
  background: #fffdf6;
  border: 1.5px solid var(--ink);
  border-radius: 12px;
  padding: 20px 24px;
  position: relative;
}
.poem-card::before {
  content: '诗';
  position: absolute;
  top: -10px;
  left: 16px;
  background: var(--cinnabar);
  color: var(--paper);
  font-family: 'Ma Shan Zheng', serif;
  padding: 2px 12px;
  border-radius: 4px;
  font-size: 14px;
}
.poem-head {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border);
}
.poem-name {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 22px;
  letter-spacing: 2px;
  color: var(--ink);
}
.poem-writer {
  display: block;
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 4px;
}
.poem-lines {
  text-align: center;
  font-family: 'Ma Shan Zheng', 'KaiTi', serif;
  font-size: 24px;
  line-height: 2.2;
  letter-spacing: 4px;
}
.poem-char { color: var(--ink); }
.poem-blank {
  display: inline-block;
  min-width: 28px;
  border-bottom: 2px solid var(--cinnabar);
  margin: 0 4px;
}
.poem-answer {
  display: inline-block;
  color: var(--cinnabar);
  background: var(--accent-soft);
  padding: 0 8px;
  border-radius: 4px;
  min-width: 28px;
}
.poem-foot {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  font-size: 12px;
  color: var(--ink-soft);
  text-align: right;
}

/* 形近字 */
.similar-grid { grid-template-columns: repeat(1, 1fr) !important; }
.similar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 16px;
}
.similar-prompt {
  color: var(--ink-soft);
  font-size: 13px;
}
.similar-pair {
  background: var(--ink);
  color: var(--paper);
  padding: 4px 12px;
  border-radius: 8px;
}
.similar-char {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 20px;
  letter-spacing: 2px;
}
.similar-sep { margin: 0 6px; color: var(--gold); }
.similar-words {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 18px;
}
.word-blank-line {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 18px;
  color: var(--ink);
}
.similar-arrow { color: var(--ink-soft); }
.similar-blank {
  display: inline-block;
  min-width: 24px;
  border-bottom: 2px solid var(--cinnabar);
  text-align: center;
}
.similar-ans {
  display: inline-block;
  color: var(--cinnabar);
  background: var(--accent-soft);
  padding: 0 6px;
  border-radius: 4px;
  font-family: 'Ma Shan Zheng', serif;
  font-size: 18px;
}
.word-tail {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 18px;
  color: var(--ink);
}
.similar-sep2 { color: transparent; }

/* 空状态 */
.empty {
  padding: 80px 24px;
  text-align: center;
}
.empty-emoji {
  font-size: 56px;
  color: var(--accent);
  font-family: 'Ma Shan Zheng', serif;
}
.empty-title {
  font-family: 'Ma Shan Zheng', serif;
  font-size: 24px;
  margin: 12px 0 6px;
}
.empty-sub {
  font-size: 14px;
  color: var(--ink-soft);
}

.page-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 32px;
  font-size: 12px;
  color: var(--ink-soft);
  letter-spacing: 2px;
  font-family: 'Ma Shan Zheng', serif;
}

@media (max-width: 720px) {
  .chinese-gen { padding: 16px 12px 40px; }
  .seal, .brush { display: none; }
  .setting-row { flex-direction: column; gap: 18px; }
  .setting-flex { min-width: 0; }
  .action-bar { justify-content: center; }
  .action-stat { margin-left: 0; }
  .panel-body { padding: 16px; }
  .worksheet-header { flex-direction: column; align-items: flex-start; }
  .problem-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .poem-lines { font-size: 18px; letter-spacing: 2px; }
  .char-text { font-size: 24px; }
  .char-big { font-size: 30px; }
}

@media print {
  .panel, .action-bar, .hero, .page-footer, .seal, .brush, .paper-bg { display: none !important; }
  .chinese-gen { background: #fff; padding: 0; }
  .worksheet { box-shadow: none; border: none; }
}
</style>
