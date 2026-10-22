<template>
  <div class="editor-app">
    <header class="topbar">
      <div class="brand-area">
        <a-tooltip title="返回工具箱">
          <a-button type="text" aria-label="返回工具箱" @click="router.push('/')">
            <template #icon><ArrowLeftOutlined /></template>
          </a-button>
        </a-tooltip>
        <div class="brand-mark"><EditOutlined /></div>
        <div class="brand-copy">
          <h1>公众号文章编辑器</h1>
          <span>UEditor</span>
        </div>
      </div>

      <div class="document-title">
        <a-input v-model:value="articleTitle" placeholder="未命名文章" :bordered="false" />
      </div>

      <div class="top-actions">
        <a-button @click="saveDraft">
          <template #icon><SaveOutlined /></template>
          保存
        </a-button>
        <a-button @click="previewOpen = true">
          <template #icon><EyeOutlined /></template>
          预览
        </a-button>
        <a-button type="primary" @click="copyRichText">
          <template #icon><CopyOutlined /></template>
          复制正文
        </a-button>
      </div>
    </header>

    <div class="workspace">
      <aside class="category-panel">
        <a-segmented
          v-model:value="libraryMode"
          block
          :options="libraryModes"
          @change="handleModeChange"
        />
        <a-menu
          class="category-menu"
          mode="inline"
          :selected-keys="[selectedCategory]"
          @click="handleCategoryClick"
        >
          <a-menu-item v-for="item in categoryItems" :key="item.key">
            <template #icon><component :is="item.icon" /></template>
            {{ item.label }}
          </a-menu-item>
        </a-menu>
      </aside>

      <aside class="material-panel">
        <div class="panel-heading">
          <div>
            <strong>{{ selectedCategory }}</strong>
            <span>{{ libraryMode === 'symbols' ? activeSymbols.length : materialTotal }} 项</span>
          </div>
        </div>

        <a-input-search
          v-if="libraryMode !== 'symbols'"
          v-model:value="keyword"
          allow-clear
          placeholder="搜索素材"
          @search="pageNo = 1"
        />

        <div v-if="libraryMode === 'symbols'" class="symbol-grid">
          <button
            v-for="symbol in activeSymbols"
            :key="symbol"
            type="button"
            :title="symbol"
            @click="insertSymbol(symbol)"
          >{{ symbol }}</button>
        </div>

        <template v-else>
          <div v-if="databaseInitializing || materialLoading" class="material-loading">
            <a-spin :tip="databaseInitializing ? '正在初始化素材库' : '正在加载素材'" />
          </div>
          <a-result
            v-else-if="databaseError"
            class="material-error"
            status="error"
            title="素材库加载失败"
            :sub-title="databaseError"
          >
            <template #extra>
              <a-button type="primary" size="small" @click="initializeMaterials">重试</a-button>
            </template>
          </a-result>
          <div v-else-if="materialItems.length" class="material-list">
            <button
              v-for="item in materialItems"
              :key="item.id"
              type="button"
              class="material-card"
              @click="insertMaterial(item)"
            >
              <span class="material-name">{{ item.title }}</span>
              <span class="material-preview" v-html="item.content"></span>
              <span class="tag-row">
                <a-tag v-for="tag in item.keywords" :key="tag">{{ tag }}</a-tag>
              </span>
            </button>
          </div>
          <a-empty v-else class="empty-state" description="没有匹配的素材" />
          <a-pagination
            v-if="!databaseError && materialTotal > pageSize"
            v-model:current="pageNo"
            class="pagination"
            size="small"
            :page-size="pageSize"
            :total="materialTotal"
            :show-size-changer="false"
          />
        </template>
      </aside>

      <main class="editing-panel">
        <div class="editor-meta">
          <div class="editor-state">
            <span class="state-dot" :class="{ ready: editorReady }"></span>
            {{ editorReady ? '编辑器已就绪' : '正在加载 UEditor' }}
          </div>
          <div class="meta-actions">
            <span>{{ textCount }} 字</span>
            <a-popconfirm title="确定清空正文吗？" ok-text="清空" cancel-text="取消" @confirm="clearContent">
              <a-button type="text" danger size="small">
                <template #icon><DeleteOutlined /></template>
                清空
              </a-button>
            </a-popconfirm>
          </div>
        </div>

        <div class="editor-section">
          <VueUeditorWrap
            v-model="editorContent"
            :config="editorConfig"
            editor-id="miaopai-wx-editor"
            @ready="handleEditorReady"
          />
        </div>
      </main>
    </div>

    <a-drawer
      v-model:open="previewOpen"
      title="公众号预览"
      placement="right"
      :width="previewWidth"
    >
      <article class="wechat-preview">
        <h1>{{ articleTitle || '未命名文章' }}</h1>
        <div class="preview-meta">公众号文章编辑器</div>
        <div class="preview-content" v-html="editorContent"></div>
      </article>
    </a-drawer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';
import { VueUeditorWrap } from 'vue-ueditor-wrap';
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  HighlightOutlined,
  NotificationOutlined,
  ProfileOutlined,
  SaveOutlined,
  ScissorOutlined,
  TagsOutlined
} from '@ant-design/icons-vue';
import { SYMBOL_GROUPS } from '@/config/symbols';
import { initializeEditorMaterials, queryEditorMaterials } from '@/services/editorMaterialDb';

const router = useRouter();
const store = useStore();
const DRAFT_KEY = 'mpkj-wx-editor-draft';

const libraryModes = [
  { label: '样式', value: 'styles' },
  { label: '模板', value: 'templates' },
  { label: '符号', value: 'symbols' }
];

const styleCategories = [
  { key: '标题', label: '标题', icon: FontSizeOutlined, tids: [1, 20, 21, 37, 46] },
  { key: '正文', label: '正文', icon: ProfileOutlined, tids: [2, 6, 7] },
  { key: '图文', label: '图文', icon: FileImageOutlined, tids: [10, 22, 42, 43, 44, 45] },
  { key: '按钮', label: '按钮', icon: NotificationOutlined, tids: [38] },
  { key: '分割线', label: '分割线', icon: ScissorOutlined, tids: [35, 36] },
  { key: '关注引导', label: '关注引导', icon: HighlightOutlined, tids: [3, 31, 32, 40] },
  { key: '其他', label: '其他', icon: AppstoreOutlined, tids: [0, 5, 14, 25] }
];

const templateCategories = [
  { key: '全部', label: '全部', icon: AppstoreOutlined, tids: [] },
  { key: '轮播', label: '轮播', icon: FileImageOutlined, tids: [45] },
  { key: '互动', label: '互动', icon: TagsOutlined, tids: [22] },
  { key: '动效', label: '动效', icon: CalendarOutlined, tids: [42] }
];

const symbolCategories = SYMBOL_GROUPS.map((group) => ({
  key: group.title,
  label: group.title,
  icon: TagsOutlined
}));

const libraryMode = ref('styles');
const keyword = ref('');
const pageNo = ref(1);
const pageSize = 6;
const materialItems = ref([]);
const materialTotal = ref(0);
const materialLoading = ref(false);
const databaseInitializing = ref(true);
const databaseReady = ref(false);
const databaseError = ref('');
const articleTitle = ref('');
const editorContent = ref('');
const editorInstance = shallowRef(null);
const editorReady = ref(false);
const previewOpen = ref(false);
const viewportWidth = ref(window.innerWidth);
let searchTimer = null;
let querySequence = 0;
let suppressNextPageLoad = false;

const selectedCategory = computed({
  get: () => store.getters.getSelectedCategory,
  set: (value) => store.commit('setSelectedCategory', value)
});

const categoryItems = computed(() => {
  if (libraryMode.value === 'templates') return templateCategories;
  if (libraryMode.value === 'symbols') return symbolCategories;
  return styleCategories;
});

const activeSymbols = computed(() => {
  return SYMBOL_GROUPS.find((group) => group.title === selectedCategory.value)?.symbols || [];
});

const textCount = computed(() => editorContent.value.replace(/<[^>]*>/g, '').replace(/\s/g, '').length);
const previewWidth = computed(() => viewportWidth.value < 640 ? '100%' : 430);

const editorConfig = {
  UEDITOR_HOME_URL: '/ueditor/',
  initialFrameHeight: 500,
  initialFrameWidth: '100%',
  toolbars: [
    [ 'source', '|', 'undo', 'redo', '|', 'bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', '|',
      'fullscreen','rowspacingtop', 'rowspacingbottom', 'lineheight', '|',
      'customstyle', 'paragraph', 'fontfamily', 'fontsize', '|',
      'directionalityltr', 'directionalityrtl', 'indent', '|',
      'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|', 'touppercase', 'tolowercase', '|',
      'link', 'unlink', 'anchor', '|', 'imagenone', 'imageleft', 'imageright', 'imagecenter', '|',
      'simpleupload', 'insertimage', 'emotion', 'scrawl', 'insertvideo', 'attachment', 'insertcode', 'pagebreak', 'template', 'background', '|',
      'horizontal', 'date', 'time', 'spechars', 'wordimage', '|',
      'inserttable', 'deletetable', 'insertparagraphbeforetable', 'insertrow', 'deleterow', 'insertcol', 'deletecol', 'mergecells', 'mergeright', 'mergedown', 'splittocells', 'splittorows', 'splittocols', 'charts', '|',
      'print', 'preview', 'searchreplace', 'drafts' ]
  ],
  serverUrl: '',
  enableBase64: true,
  imageActionName: 'uploadimage',
  imageAllowFiles: ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
  allowDivTransToP: false,
  retainOnlyLabelPasted: true
};

function handleModeChange(mode) {
  const first = mode === 'templates'
    ? templateCategories[0].key
    : mode === 'symbols'
      ? symbolCategories[0].key
      : styleCategories[0].key;
  selectedCategory.value = first;
  keyword.value = '';
  pageNo.value = 1;
}

function handleCategoryClick({ key }) {
  selectedCategory.value = key;
  pageNo.value = 1;
}

function getActiveMaterialCategory() {
  const categories = libraryMode.value === 'templates' ? templateCategories : styleCategories;
  return categories.find((item) => item.key === selectedCategory.value) || categories[0];
}

async function loadMaterialPage() {
  if (!databaseReady.value || libraryMode.value === 'symbols') return;

  const sequence = ++querySequence;
  materialLoading.value = true;
  databaseError.value = '';

  try {
    const category = getActiveMaterialCategory();
    const result = await queryEditorMaterials({
      type: libraryMode.value === 'templates' ? 1 : 0,
      tids: category.tids,
      keyword: keyword.value,
      page: pageNo.value,
      pageSize
    });
    if (sequence !== querySequence) return;
    materialItems.value = result.items;
    materialTotal.value = result.total;
  } catch (error) {
    if (sequence !== querySequence) return;
    console.error(error);
    materialItems.value = [];
    materialTotal.value = 0;
    databaseError.value = '无法从本地数据库读取素材，请刷新页面重试';
  } finally {
    if (sequence === querySequence) materialLoading.value = false;
  }
}

async function initializeMaterials() {
  databaseInitializing.value = true;
  databaseError.value = '';
  databaseReady.value = false;

  try {
    await initializeEditorMaterials();
    databaseReady.value = true;
    await loadMaterialPage();
  } catch (error) {
    databaseError.value = error.message || '素材库初始化失败，请刷新页面重试';
  } finally {
    databaseInitializing.value = false;
  }
}

function handleEditorReady(editor) {
  editorInstance.value = editor;
  editorReady.value = true;
}

function insertMaterial(item) {
  const html = `<p><br></p>${item.content}<p><br></p>`;
  if (editorInstance.value) editorInstance.value.execCommand('inserthtml', html);
  else editorContent.value += html;
  message.success(`已插入“${item.title}”`);
}

function insertSymbol(symbol) {
  if (editorInstance.value) editorInstance.value.execCommand('inserttext', symbol);
  else editorContent.value += symbol;
}

function clearContent() {
  if (editorInstance.value) editorInstance.value.setContent('');
  editorContent.value = '';
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    title: articleTitle.value,
    content: editorContent.value,
    savedAt: Date.now()
  }));
  message.success('草稿已保存');
}

async function copyRichText() {
  if (!editorContent.value.trim()) {
    message.warning('正文为空');
    return;
  }
  const plainText = editorContent.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  try {
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([editorContent.value], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        })
      ]);
    } else {
      fallbackCopyRichText(editorContent.value);
    }
    message.success('正文已复制，可粘贴到公众号编辑器');
  } catch (error) {
    console.error(error);
    fallbackCopyRichText(editorContent.value);
    message.success('正文已复制');
  }
}

function fallbackCopyRichText(html) {
  const container = document.createElement('div');
  container.contentEditable = 'true';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.innerHTML = html;
  document.body.appendChild(container);
  const range = document.createRange();
  range.selectNodeContents(container);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('copy');
  selection.removeAllRanges();
  container.remove();
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft) return;
    articleTitle.value = draft.title || '';
    editorContent.value = draft.content || '';
  } catch {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function updateViewport() {
  viewportWidth.value = window.innerWidth;
}

watch([libraryMode, selectedCategory, pageNo], () => {
  if (suppressNextPageLoad) {
    suppressNextPageLoad = false;
    return;
  }
  loadMaterialPage();
});

watch(keyword, () => {
  window.clearTimeout(searchTimer);
  if (pageNo.value !== 1) {
    suppressNextPageLoad = true;
    pageNo.value = 1;
  }
  searchTimer = window.setTimeout(loadMaterialPage, 250);
});

onMounted(() => {
  loadDraft();
  initializeMaterials();
  window.addEventListener('resize', updateViewport, { passive: true });
});

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer);
  querySequence += 1;
  window.removeEventListener('resize', updateViewport);
  editorInstance.value = null;
});
</script>

<style scoped>
.editor-app {
  min-height: 100vh;
  color: #27364a;
  background: #eef1f5;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(250px, 1fr) minmax(240px, 460px) minmax(320px, 1fr);
  align-items: center;
  gap: 20px;
  min-height: 64px;
  padding: 10px 18px;
  background: #fff;
  border-bottom: 1px solid #dfe4ea;
  box-shadow: 0 2px 8px rgba(31, 45, 61, 0.06);
}

.brand-area,
.brand-copy,
.top-actions,
.panel-heading,
.editor-meta,
.meta-actions {
  display: flex;
  align-items: center;
}

.brand-area {
  gap: 8px;
}

.brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  color: #fff;
  background: #1677ff;
  border-radius: 6px;
  font-size: 18px;
}

.brand-copy {
  align-items: baseline;
  gap: 8px;
}

.brand-copy h1 {
  margin: 0;
  color: #1f3045;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: 0;
}

.brand-copy span {
  color: #8a96a8;
  font-size: 11px;
}

.document-title :deep(.ant-input) {
  text-align: center;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.top-actions {
  justify-content: flex-end;
  gap: 8px;
}

.workspace {
  display: grid;
  grid-template-columns: 190px 350px minmax(600px, 1fr);
  gap: 1px;
  height: calc(100vh - 64px);
  min-height: 650px;
  background: #dfe4ea;
}

.category-panel,
.material-panel,
.editing-panel {
  min-width: 0;
  overflow: auto;
  background: #fff;
}

.category-panel {
  padding: 16px 10px;
}

.category-menu {
  margin-top: 14px;
  border-inline-end: 0 !important;
}

.category-menu :deep(.ant-menu-item) {
  height: 40px;
  margin: 3px 0;
  line-height: 40px;
  border-radius: 6px;
}

.material-panel {
  padding: 18px;
}

.panel-heading {
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-heading strong,
.panel-heading span {
  display: block;
}

.panel-heading strong {
  color: #2b3d52;
  font-size: 16px;
  font-weight: 650;
}

.panel-heading span {
  margin-top: 1px;
  color: #8a96a8;
  font-size: 12px;
}

.material-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.material-card {
  width: 100%;
  padding: 12px;
  overflow: hidden;
  text-align: left;
  background: #fff;
  border: 1px solid #e1e7ee;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.material-card:hover,
.material-card:focus-visible {
  outline: none;
  border-color: #1677ff;
  box-shadow: 0 3px 12px rgba(22, 119, 255, 0.12);
}

.material-name {
  display: block;
  margin-bottom: 8px;
  color: #34475d;
  font-size: 13px;
  font-weight: 650;
}

.material-preview {
  display: block;
  max-height: 130px;
  overflow: hidden;
  pointer-events: none;
}

.material-preview :deep(*) {
  max-width: 100%;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
}

.tag-row :deep(.ant-tag) {
  margin: 0;
  font-size: 11px;
}

.pagination {
  margin-top: 16px;
  text-align: center;
}

.material-loading {
  display: grid;
  min-height: 260px;
  place-items: center;
}

.material-error {
  padding: 42px 0 0;
}

.material-error :deep(.ant-result-title) {
  font-size: 16px;
}

.material-error :deep(.ant-result-subtitle) {
  font-size: 12px;
}

.empty-state {
  margin-top: 70px;
}

.symbol-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  gap: 6px;
  margin-top: 8px;
}

.symbol-grid button {
  aspect-ratio: 1;
  overflow: hidden;
  color: #34475d;
  background: #f8fafc;
  border: 1px solid #e1e7ee;
  border-radius: 5px;
  cursor: pointer;
  font-size: 18px;
}

.symbol-grid button:hover,
.symbol-grid button:focus-visible {
  outline: none;
  color: #1677ff;
  background: #f0f7ff;
  border-color: #1677ff;
}

.editing-panel {
  display: flex;
  flex-direction: column;
  padding: 18px 22px 24px;
  background: #f6f8fa;
}

.editor-meta {
  flex: 0 0 auto;
  justify-content: space-between;
  min-height: 36px;
  margin-bottom: 8px;
  color: #7a8798;
  font-size: 12px;
}

.editor-state {
  display: flex;
  align-items: center;
  gap: 7px;
}

.state-dot {
  width: 7px;
  height: 7px;
  background: #faad14;
  border-radius: 50%;
}

.state-dot.ready {
  background: #2aae60;
}

.meta-actions {
  gap: 8px;
}

.editor-section {
  flex: 1;
  min-height: 560px;
  padding: 10px;
  overflow: auto;
  background: #fff;
  border: 1px solid #dfe4ea;
  border-radius: 6px;
  box-shadow: 0 5px 20px rgba(31, 45, 61, 0.07);
}

.editor-section :deep(.edui-editor) {
  width: 100% !important;
  border: 0;
  box-shadow: none;
}

.editor-section :deep(.edui-editor-iframeholder) {
  width: 100% !important;
}

.wechat-preview {
  max-width: 677px;
  margin: 0 auto;
  color: #3f3f3f;
}

.wechat-preview > h1 {
  margin: 0 0 10px;
  color: #222;
  font-size: 23px;
  font-weight: 650;
  line-height: 1.4;
  letter-spacing: 0;
}

.preview-meta {
  margin-bottom: 24px;
  color: #8c8c8c;
  font-size: 14px;
}

.preview-content {
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 1.8;
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
}

@media (max-width: 1180px) {
  .topbar {
    grid-template-columns: auto minmax(200px, 1fr) auto;
  }

  .workspace {
    grid-template-columns: 170px 300px minmax(520px, 1fr);
    overflow-x: auto;
  }

  .top-actions :deep(.ant-btn span:not(.anticon)) {
    display: none;
  }

  .top-actions :deep(.ant-btn) {
    width: 36px;
    padding-inline: 0;
  }
}

@media (max-width: 1000px) {
  .topbar {
    position: static;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .document-title {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .brand-copy span {
    display: none;
  }

  .workspace {
    display: flex;
    height: auto;
    min-height: 0;
    overflow: visible;
    flex-direction: column;
    gap: 1px;
  }

  .category-panel,
  .material-panel,
  .editing-panel {
    overflow: visible;
  }

  .category-menu {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .category-menu :deep(.ant-menu-item) {
    width: auto;
  }

  .material-panel {
    max-height: 480px;
    overflow-y: auto;
  }

  .editing-panel {
    padding: 14px 10px 24px;
  }

  .editor-section {
    min-height: 600px;
    padding: 4px;
  }
}
</style>
