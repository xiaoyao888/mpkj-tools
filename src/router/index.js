import { createRouter, createWebHashHistory } from 'vue-router'

import rateCalc from '../views/tools/rateCalc.vue'
import pwdGen from '../views/tools/pwdGen.vue'
import rmbConverter from '../views/tools/RMBConverter.vue'
import daxiaoxie from "@/views/tools/daxiaoxie.vue"
import gobang from "@/views/games/gobang.vue";
import chineseToPinyin from "@/views/tools/chineseToPinyin.vue";
import BlankLayout from "@/components/layouts/BlankLayout.vue";
import PageLayout from "@/components/layouts/PageLayout.vue";

const routes = [
    {
        path: '/',
        name: '首页',
        component: PageLayout,
        children:[{
            path: '/rateCalc',
            meta:{title:'小微企业税负计算器'},
            component: () => import(/* webpackChunkName: "user" */ '@/views/tools/rateCalc.vue')
        }]
    },
    {
        path: '/rateCalc',
        name: '小微企业税负计算器',
        component: PageLayout,
        children:[{
            path: '/rateCalc',
            meta:{title:'小微企业税负计算器'},
            component: () => import(/* webpackChunkName: "user" */ '@/views/tools/rateCalc.vue')
        }]
    },
    {
        path: '/pwdGen',
        name: '密码生成器',
        component: PageLayout,
        children:[{
            path: '/pwdGen',
            meta:{title:'密码生成器'},
            component: () => import(/* webpackChunkName: "user" */ '@/views/tools/pwdGen.vue')
        }]
    },
    {
        path: '/rmbConverter',
        name: '人民币大写转换器',
        component: PageLayout,
        children:[{
            path: '/rmbConverter',
            meta:{title:'人民币大写转换器'},
            component: () => import(/* webpackChunkName: "user" */ '@/views/tools/RMBConverter.vue')
        }]
    },
    {
        path: '/daxiaoxie',
        name: '字母大小写转化',
        component: PageLayout,
        children:[{
            path: '/daxiaoxie',
            meta:{title:'人民币大写字母大小写转化转换器'},
            component: () => import(/* webpackChunkName: "user" */ '@/views/tools/daxiaoxie.vue')
        }]
    },
    {
        path: '/chineseToPinyin',
        name: '汉字批量转拼音',
        component: PageLayout,
        children:[{
            path: '/chineseToPinyin',
            meta:{title:'汉字批量转拼音'},
            component: () => import(/* webpackChunkName: "user" */ '@/views/tools/chineseToPinyin.vue')
        }]
    },
    {
        path: '/gobang',
        name: '五子棋游戏',
        component: BlankLayout,
        children: [{
            path: '/gobang',
            meta:{title:'五子棋游戏'},
            component: () => import(/* webpackChunkName: "user" */ '@/views/games/gobang.vue')
        }]
    },
    // 在路由数组中添加
    {
      path: '/fileToBase64',
      name: '文件转Base64',
      component: PageLayout,
      children:[{
        path: '/fileToBase64',
        meta:{title:'文件转Base64'},
        component: () => import('@/views/tools/fileToBase64.vue')
      }]
    },
    {
      path: '/imageToPdf',
      name: '图片合并PDF',
      component: PageLayout,
      children:[{
        path: '/imageToPdf',
        meta:{title:'图片合并PDF'},
        component: () => import('@/views/tools/imageToPdf.vue')
      }]
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router