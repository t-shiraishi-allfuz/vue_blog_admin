import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import admin_router from '@/routes/admin'
import blog_router from '@/routes/blog'
import login_router from '@/routes/login'
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'

const routes: RouteRecordRaw[] = [
	{path: '/:pathMatch(.*)*', redirect: '/'},
	{
		path: '/',
		name: 'Home',
		component: () => import("@/components/CommonTemplate.vue"),
		children: [
			...blog_router
		]
	},
	{
		path: '/admin', // 管理画面へのルート
		name: 'AdminHome',
		component: () => import("@/components/CommonAdminTemplate.vue"),
		meta: { requiresAuth: true },
		children: [
			...admin_router
		]
	},
]

// ルーターの作成
const router = createRouter({
	history: createWebHistory(),
	routes,
})

// ナビゲーションガードの設定
router.beforeEach(async (to, _, next) => {
    const storeAuth = useAuthStore()
    const {isLogin} = storeToRefs(storeAuth)

	// 初期化待ち
	await storeAuth.initializeAuth()

	const isAuthRequired = to.matched.some(record => record.meta.requiresAuth)
	const isLoginPage = ['UserCreate', 'ResetPassword'].includes(to.name as string)

	if (isAuthRequired && !isLogin.value) {
		next({ name: 'Home' })
	} else if (isLoginPage && isLogin.value) {
		next({ name: 'Home' })
	} else {
		next()
	}
})

export default router
