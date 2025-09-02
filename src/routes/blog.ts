import type { RouteRecordRaw } from 'vue-router'

const routes:RouteRecordRaw[] = [
	{
		path: '/',
		component: () => import("@/views/HomePage.vue"),
	},
	{
		path: '/blog_detail',
		component: () => import("@/views/BlogDetail.vue"),
	},
] as const

export default routes
