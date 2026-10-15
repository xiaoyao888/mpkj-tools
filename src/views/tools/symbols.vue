<template>
  <div class="symbols-page">
    <h1 style="font-size:18px;text-align:center;">特殊符号大全</h1>
    <p class="tips" style="text-align:center;">提示：点击符号即可复制到剪贴板。</p>

    <div class="symbols-body">
      <aside class="cat-side">
        <div
          v-for="g in groups"
          :key="g.title"
          class="cat-item"
          :class="{ active: activeTitle === g.title }"
          @click="scrollTo(g.title)"
        >
          <span>{{ g.title }}</span>
          <span class="cat-count">{{ g.symbols.length }}</span>
        </div>
      </aside>

      <div class="sym-content">
        <div v-for="g in groups" :id="g.title" :key="g.title" class="sym-section">
          <h3 class="sym-title">{{ g.title }}</h3>
          <div class="sym-grid">
            <button
              v-for="(s, i) in g.symbols"
              :key="i"
              type="button"
              class="sym-item"
              :title="s"
              @click="copy(s)"
            >{{ s }}</button>
          </div>
        </div>
      </div>
    </div>

    <a-back-top />
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { message } from 'ant-design-vue';
import { SYMBOL_GROUPS } from '@/config/symbols';

const groups = SYMBOL_GROUPS;
const activeTitle = ref(groups[0].title);

const scrollTo = (title) => {
  activeTitle.value = title;
  const el = document.getElementById(title);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// 滚动时同步左侧菜单高亮
const onScroll = () => {
  let current = groups[0].title;
  for (const g of groups) {
    const el = document.getElementById(g.title);
    if (el && el.getBoundingClientRect().top <= 90) current = g.title;
  }
  activeTitle.value = current;
};

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));

const copy = (s) => {
  const done = () => message.success(`已复制 ${s}`);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(s).then(done).catch(() => fallbackCopy(s, done));
  } else {
    fallbackCopy(s, done);
  }
};

const fallbackCopy = (s, done) => {
  const ta = document.createElement('textarea');
  ta.value = s;
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
</script>
<style scoped>
.symbols-page {
  max-width: 1400px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.symbols-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.cat-side {
  width: 150px;
  flex-shrink: 0;
  position: sticky;
  top: 70px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 8px 0;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.cat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  font-size: 13px;
  color: #34495e;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}

.cat-item:hover {
  background: #f0f7ff;
  color: #1677ff;
}

.cat-item.active {
  background: #e6f4ff;
  color: #1677ff;
  font-weight: bold;
}

.cat-count {
  font-size: 11px;
  color: #999;
  font-weight: normal;
}

.sym-content {
  flex: 1;
  min-width: 0;
}

.sym-section {
  margin-bottom: 20px;
}

.sym-title {
  font-size: 15px;
  font-weight: bold;
  color: #34495e;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.sym-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 6px;
}

.sym-item {
  height: 48px;
  font-size: 22px;
  line-height: 1;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.15s;
}

.sym-item:hover {
  border-color: #1677ff;
  color: #1677ff;
  background: #f0f7ff;
}

.sym-item:active {
  transform: scale(0.92);
}

@media (max-width: 768px) {
  .symbols-body {
    flex-direction: column;
  }

  .cat-side {
    position: sticky;
    top: 50px;
    z-index: 10;
    width: 100%;
    max-height: none;
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px;
    gap: 4px;
  }

  .cat-item {
    white-space: nowrap;
    padding: 6px 10px;
    border-radius: 6px;
    background: #fafafa;
  }

  .cat-item.active {
    border-right: none;
  }
}
</style>
