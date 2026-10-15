<template>
  <a-menu
    style="width: 100%; z-index: 1000; background-color: #fff; border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);"
    v-model:selectedKeys="current"
    v-model:openKeys="openKeys"
    mode="horizontal"
    :items="items"
    @click="handleClick"
    @open-change="onOpenChange"
  />
  <router-view></router-view>
</template>
<script setup>
import { h, ref } from 'vue';
import { useRouter } from 'vue-router';
import { MENU_GROUPS } from '@/config/menus';

const router = useRouter();
const current = ref(['']);
const openKeys = ref([]);

const handleClick = (key) => {
  router.push(key.key);
};

// 同一时间只展开一个子菜单
const onOpenChange = (keys) => {
  const latest = keys.find((k) => !openKeys.value.includes(k));
  openKeys.value = latest ? [latest] : [];
};

// 图标需以 VNode 传入：ant-design-vue 会把函数式图标当普通函数调用，
// 导致 @ant-design/icons-vue 7.x 访问 context.attrs 时报错
const iconNode = (comp) => h(comp);

// 首页 + 各分类子菜单
const items = [
  { key: '/', label: '首页', title: '首页' },
  ...MENU_GROUPS.map((group) => ({
    key: group.key,
    label: group.title,
    title: group.title,
    icon: iconNode(group.icon),
    children: group.children.map((t) => ({
      key: t.path,
      label: t.name,
      title: t.desc || t.name
    }))
  }))
];
</script>
