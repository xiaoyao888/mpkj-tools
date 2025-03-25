import { createRouter, createWebHashHistory } from 'vue-router'

import rateCalc from '../views/tools/rateCalc.vue'
import pwdGen from '../views/tools/pwdGen.vue'
const routes = [
    {
        path: '/',
        name: '小微企业税负计算器',
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
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router