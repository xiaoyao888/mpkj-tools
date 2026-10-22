import Dexie from 'dexie';
import DOMPurify from 'dompurify';
import materialDataUrl from '@/assets/editor_material.json?url';

const DATABASE_NAME = 'mpkj-editor-materials';
const DATASET_VERSION = 'editor-material-2026-10-22-v2-local-images';
const VERSION_KEY = 'datasetVersion';

const db = new Dexie(DATABASE_NAME);

db.version(1).stores({
  materials: '&id, tid, type, time, [type+tid], *lids',
  materialIndex: '&id, tid, type, time, [type+tid], *lids, *keywordTokens',
  metadata: '&key'
});

const sanitizeOptions = {
  USE_PROFILES: { html: true, svg: true, svgFilters: true },
  ADD_TAGS: ['foreignObject', 'animate', 'animateTransform', 'set'],
  ADD_ATTR: [
    'attributeName', 'begin', 'calcMode', 'dur', 'fill', 'from', 'keySplines',
    'keyTimes', 'repeatCount', 'restart', 'to', 'transform', 'values', 'viewBox'
  ]
};

function splitWords(value) {
  return String(value || '')
    .split(/[\s,，、;；]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function normalizeHtml(value) {
  return String(value || '')
    .replace(/\b(src|href)=(['"])\/\//gi, '$1=$2https://')
    .replace(/url\((['"]?)\/\//gi, 'url($1https://');
}

function sanitizeMaterial(material) {
  if (!material) return null;
  return {
    ...material,
    content: DOMPurify.sanitize(material.content, sanitizeOptions)
  };
}

function normalizeMaterial(source) {
  const keywords = splitWords(source.keywords);
  const lids = String(source.lid || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter(Number.isFinite);
  const title = String(source.name || '').trim() || `素材 ${source.id}`;
  const searchText = `${title} ${keywords.join(' ')}`.toLocaleLowerCase('zh-CN');

  return {
    id: Number(source.id),
    title,
    content: normalizeHtml(source.content),
    keywords,
    lids,
    tid: Number(source.tid) || 0,
    type: Number(source.type) || 0,
    time: Number(source.time) || 0,
    searchText
  };
}

async function importDataset() {
  const response = await fetch(materialDataUrl);
  if (!response.ok) throw new Error(`素材文件加载失败 (${response.status})`);

  const sourceRows = await response.json();
  if (!Array.isArray(sourceRows)) throw new Error('素材文件格式无效');

  const materials = sourceRows.map(normalizeMaterial);
  const materialIndex = materials.map(({ id, title, keywords, lids, tid, type, time, searchText }) => ({
    id,
    title,
    keywords,
    lids,
    tid,
    type,
    time,
    searchText,
    keywordTokens: [...new Set(splitWords(searchText))]
  }));

  await db.transaction('rw', db.materials, db.materialIndex, db.metadata, async () => {
    await Promise.all([db.materials.clear(), db.materialIndex.clear()]);
    await db.materials.bulkPut(materials);
    await db.materialIndex.bulkPut(materialIndex);
    await db.metadata.put({
      key: VERSION_KEY,
      value: DATASET_VERSION,
      count: materials.length,
      importedAt: Date.now()
    });
  });
}

async function ensureCurrentDataset() {
  const metadata = await db.metadata.get(VERSION_KEY);
  if (metadata?.value === DATASET_VERSION) return metadata;

  await importDataset();
  return db.metadata.get(VERSION_KEY);
}

export async function initializeEditorMaterials() {
  try {
    if (navigator.locks?.request) {
      return await navigator.locks.request(`${DATABASE_NAME}-initialize`, ensureCurrentDataset);
    }
    return await ensureCurrentDataset();
  } catch (error) {
    console.error('Failed to initialize editor material database:', error);
    throw new Error('素材库初始化失败，请刷新页面重试', { cause: error });
  }
}

function matchesCategory(row, type, tids) {
  if (row.type !== type) return false;
  return !tids?.length || tids.includes(row.tid);
}

export async function queryEditorMaterials({ type, tids = [], keyword = '', page = 1, pageSize = 6 }) {
  const normalizedType = Number(type) || 0;
  const normalizedTids = tids.map(Number).filter(Number.isFinite);
  const term = keyword.trim().toLocaleLowerCase('zh-CN');

  let indexRows;
  if (normalizedTids.length) {
    indexRows = await db.materialIndex
      .where('[type+tid]')
      .anyOf(normalizedTids.map((tid) => [normalizedType, tid]))
      .toArray();
  } else {
    indexRows = await db.materialIndex.where('type').equals(normalizedType).toArray();
  }

  const matchedRows = indexRows
    .filter((row) => matchesCategory(row, normalizedType, normalizedTids))
    .filter((row) => !term || row.searchText.includes(term))
    .sort((left, right) => right.time - left.time || right.id - left.id);

  const total = matchedRows.length;
  const safePage = Math.max(1, Number(page) || 1);
  const start = (safePage - 1) * pageSize;
  const pageRows = matchedRows.slice(start, start + pageSize);
  const records = await db.materials.bulkGet(pageRows.map((row) => row.id));

  return {
    items: records.map(sanitizeMaterial).filter(Boolean),
    total
  };
}

export { db as editorMaterialDb };
