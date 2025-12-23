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
	{
		path: '/user_profile',
		component: () => import("@/views/UserProfile.vue"),
	},
	{
		path: '/dm',
		name: 'DmPage',
		component: () => import("@/views/DmPage.vue"),
		meta: { requiresAuth: true },
	},
	{
		path: '/ai-talk',
		name: 'AiTalk',
		component: () => import("@/views/AiTalk.vue"),
	},
	{
		path: '/announcements/:id',
		name: 'AnnouncementDetail',
		component: () => import("@/views/AnnouncementDetail.vue"),
	},
] as const

export default routes
