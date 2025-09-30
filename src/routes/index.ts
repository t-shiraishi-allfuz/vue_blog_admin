import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import admin_router from '@/routes/admin'
import blog_router from '@/routes/blog'
import { useAuthStore } from '@/stores/authStore'
import { useUsersStore } from '@/stores/usersStore'
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
    const usersStore = useUsersStore()
    const {isLogin} = storeToRefs(storeAuth)

	// 初期化待ち
	await storeAuth.initializeAuth()

	const isAuthRequired = to.matched.some(record => record.meta.requiresAuth)
	const isOwnerRequired = to.matched.some(record => record.meta.requiresOwner)
	const isLoginPage = ['UserCreate', 'ResetPassword'].includes(to.name as string)

	// 認証が必要なページでログインしていない場合
	if (isAuthRequired && !isLogin.value) {
		next({ name: 'Home' })
		return
	}

	// ログインページでログイン済みの場合
	if (isLoginPage && isLogin.value) {
		next({ name: 'Home' })
		return
	}

	// オーナー権限が必要なページの場合
	if (isOwnerRequired && isLogin.value && storeAuth.userInfo) {
		try {
			const userInfo = storeAuth.userInfo as any
			const isOwner = await usersStore.isOwner(userInfo.uid)
			if (!isOwner) {
				// オーナー権限がない場合は管理画面のホームにリダイレクト
				next({ path: '/admin' })
				return
			}
		} catch (error) {
			console.error('オーナー権限確認エラー:', error)
			next({ path: '/admin' })
			return
		}
	}

	next()
})

export default router
