import {createRouter, createWebHashHistory} from 'vue-router'

const routerHistory = createWebHashHistory();
const router = createRouter({
    history: routerHistory,
    routes: [
        {
            path: '/workspace',
            component: () => import('../workspace/WorkspaceLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                { path: '', redirect: '/workspace/production' },
                { path: 'production', name: 'workspace-production', meta: { title: '产线状态' }, component: () => import('../workspace/ProductionPage.vue') },
                { path: 'datasets', name: 'workspace-datasets', meta: { title: '缺陷数据采集' }, component: () => import('../workspace/DatasetsPage.vue') },
                { path: 'basesets', name: 'workspace-basesets', meta: { title: '基础缺陷集' }, component: () => import('../workspace/DatasetsPage.vue') },
                { path: 'models', name: 'workspace-models', meta: { title: '模型管理' }, component: () => import('../workspace/ModelsPage.vue') },
                { path: 'defects', name: 'workspace-defects', meta: { title: '标准缺陷' }, component: () => import('../workspace/DefectsPage.vue') },
                { path: 'labels', name: 'workspace-labels', meta: { title: '打标缺陷' }, component: () => import('../workspace/DefectsPage.vue') },
                { path: 'quality', name: 'workspace-quality', meta: { title: '质量分析' }, component: () => import('../workspace/ValidationPage.vue') },
                { path: 'images/:kind/:id', name: 'workspace-images', meta: { title: '图片工作台' }, component: () => import('../workspace/ImagesPage.vue') }
            ]
        },
        {
            path: '/login',
            name: 'login',
            title: '登录',
            component: () => import('../view/login.vue')
        },
        {
            path: '/register',
            name: 'register',
            title: '注册',
            component: () => import('../view/register.vue')
        },
        { path: '/', redirect: '/workspace/production', meta: { requiresAuth: true } },
        {
            path: '/detail',
            component: () => import('../workspace/WorkspaceLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                { path: '', name: 'detail', meta: { title: '产线详情' }, component: () => import('../workspace/DetailPage.vue') }
            ]
        },
        {
            path: '/3DModel',
            name: '3DModel',
            title: '3D产线',
            meta: { requiresAuth: true },
            component: () => import('../view/3DModel.vue')
        }
    ]
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')

    if (to.meta.requiresAuth && !token) {
        next('/login')
        return
    }

    if ((to.path === '/login' || to.path === '/register') && token) {
        next('/workspace/production')
        return
    }

    next()
})

export default router
