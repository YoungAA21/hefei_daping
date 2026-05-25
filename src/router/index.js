import {createRouter, createWebHashHistory} from 'vue-router'

const routerHistory = createWebHashHistory();
const router = createRouter({
    history: routerHistory,
    routes: [
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
        {
            path: '/',
            title: '大屏',
            meta: { requiresAuth: true },
            component: () => import('../view/home.vue')
        },
        {
            path: '/detail',
            name: 'detail',
            title: '产线详情',
            meta: { requiresAuth: true },
            component: () => import('../view/detail.vue')
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
        next('/')
        return
    }

    next()
})

export default router
