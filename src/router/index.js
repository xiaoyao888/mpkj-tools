import { createRouter, createWebHashHistory } from 'vue-router'

import rateCalc from '../views/tools/rateCalc.vue'
import pwdGen from '../views/tools/pwdGen.vue'
import rmbConverter from '../views/tools/RMBConverter.vue'
import daxiaoxie from "@/views/tools/daxiaoxie.vue";
const routes = [
    {
        path: '/',
        name: '首页',
        component: rateCalc
    },
    {
        path: '/rateCalc',
        name: '小微企业税负计算器',
        component: rateCalc
    },
    {
        path: '/pwdGen',
        name: '密码生成器',
        component: pwdGen
    },
    {
        path: '/rmbConverter',
        name: '人民币大写转换器',
        component: rmbConverter
    },
    {
        path: '/daxiaoxie',
        name: '字母大小写转化',
        component: daxiaoxie
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router