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
	{
		path: '/admin/announcement_list',
		component: () => import("@/views/admin/AnnouncementList.vue"),
		meta: { requiresAuth: true, requiresOwner: true }
	},
	{
		path: '/admin/moment_list',
		component: () => import("@/views/admin/MomentList.vue"),
		meta: { requiresAuth: true }
	},
	{
		path: '/admin/moment_create',
		component: () => import("@/views/admin/MomentCreate.vue"),
		meta: { requiresAuth: true }
	},
	{
		path: '/admin/moment_edit',
		component: () => import("@/views/admin/MomentEdit.vue"),
		meta: { requiresAuth: true }
	},
	{
		path: '/admin/contact_list',
		component: () => import("@/views/admin/ContactList.vue"),
		meta: { requiresAuth: true }
	},
] as const

export default routes
