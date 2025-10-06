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
		path: '/announcements/:id',
		name: 'AnnouncementDetail',
		component: () => import("@/views/AnnouncementDetail.vue"),
	},
	{
		path: '/tweets',
		name: 'TweetList',
		component: () => import("@/views/TweetList.vue"),
	},
	{
		path: '/tweet_detail',
		name: 'TweetDetail',
		component: () => import("@/views/TweetDetail.vue"),
	},
] as const

export default routes
