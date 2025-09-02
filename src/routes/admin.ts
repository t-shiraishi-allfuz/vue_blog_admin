import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
	{
		path: '/admin',
		component: () => import("@/views/admin/HomePage.vue"),
	},
	{
		path: '/admin/blog_detail',
		component: () => import("@/views/admin/BlogDetail.vue"),
	},
	{
		path: '/admin/comment_list',
		component: () => import("@/views/admin/CommentList.vue"),
	},
	{
		path: '/admin/like_list',
		component: () => import("@/views/admin/LikeList.vue"),
	},
	{
		path: '/admin/category_list',
		component: () => import("@/views/admin/BlogCategoryList.vue"),
	},
] as const

export default routes
