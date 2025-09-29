import type { RouteRecordRaw } from 'vue-router'

const routes:RouteRecordRaw[] = [
	{
		path: '/user_create',
		component: () => import("@/views/admin/UserCreate.vue"),
	},
	{
		path: '/reset_password',
		component: () => import("@/views/admin/ResetPassword.vue"),
	},
	{
		path: '/reset_password_confirm',
		component: () => import("@/views/admin/ResetPasswordConfirm.vue"),
	},
	{
		path: '/setting_first',
		component: () => import("@/views/admin/SettingProfileFirst.vue"),
	},
	{
		path: '/setting_profile_icon',
		component: () => import("@/views/admin/SettingProfileIcon.vue"),
	},
] as const

export default routes
