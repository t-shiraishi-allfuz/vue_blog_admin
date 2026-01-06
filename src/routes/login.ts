import type { RouteRecordRaw } from 'vue-router'

const routes:RouteRecordRaw[] = [
	{
		path: '/user_create',
		name: 'UserCreate',
		component: () => import("@/views/admin/UserCreate.vue"),
	},
	{
		path: '/reset_password',
		name: 'ResetPassword',
		component: () => import("@/views/admin/ResetPassword.vue"),
	},
	{
		path: '/reset_password_confirm',
		name: 'ResetPasswordConfirm',
		component: () => import("@/views/admin/ResetPasswordConfirm.vue"),
	},
	{
		path: '/setting_first',
		name: 'SettingFirst',
		component: () => import("@/views/admin/SettingProfileFirst.vue"),
	},
	{
		path: '/setting_profile_icon',
		name: 'SettingProfileIcon',
		component: () => import("@/views/admin/SettingProfileIcon.vue"),
	},
] as const

export default routes
