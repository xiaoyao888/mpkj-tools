<template>
  <a-menu style="position: absolute; top: 0; left: 0; width: 100%; z-index: 1000; background-color: #fff; border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);" v-model:selectedKeys="current" mode="horizontal" :items="items" @click="handleClick"/>
  <router-view></router-view>
</template>
<script setup>
import { h, ref } from 'vue';
import { MailOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const current = ref(['rateCalc']);
const handleClick = (key) => {
  router.push("/"+key.key);
}
const items = ref([
  {
    key: 'rateCalc',
    label: '小微企业税负计算器',
    title: '小微企业税负计算器',
  },
  {
    key: 'pwdGen',
    label: '密码生成器',
    title: '密码生成器',
  },
]);

</script>
<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
