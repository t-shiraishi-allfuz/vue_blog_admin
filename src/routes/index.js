import { createRouter, createWebHistory } from 'vue-router';
import CommonLoginTemplate from '@/components/CommonLoginTemplate.vue';
import CommonTemplate from '@/components/CommonTemplate.vue';
import UserCreate from '@/views/UserCreate.vue'; // ユーザー登録
import UserLogin from '@/views/UserLogin.vue'; // ユーザーログイン
import ResetPassword from '@/views/ResetPassword.vue'; // パスワードリセット
import ResetPasswordConfirm from '@/views/ResetPasswordConfirm.vue'; // パスワードリセット
import HomePage from '@/views/HomePage.vue'; // ホームページ
import SettingProfileFirst from '@/views/SettingProfileFirst.vue'; // 設定ページ
import SettingProfileIcon from '@/views/SettingProfileIcon.vue'; // 設定ページ
import NotFound from '@/views/NotFound.vue'; // 404ページ
import { useAuthStore } from '@/stores/authStore';

const routes = [
	{
		path: '/user_login',
		name: 'UserLogin',
		component: CommonLoginTemplate,
		children: [
			{
				path: '',
				component: UserLogin,
			},
			{
				path: '/user_create',
				component: UserCreate,
			},
			{
				path: '/reset_password',
				component: ResetPassword,
			},
			{
				path: '/reset_password_confirm',
				component: ResetPasswordConfirm,
			},
			{
				path: '/setting_first',
				component: SettingProfileFirst,
			},
			{
				path: '/setting_profile_icon',
				component: SettingProfileIcon,
			},
		]
	},
	{
		path: '/', // ホームページへのルート
		name: 'Home',
		component: CommonTemplate,
		meta: { requiresAuth: true },
		children: [
			{
				path: '',
				component: HomePage,
			},
		]
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: NotFound,
	},
];

// ルーターの作成
const router = createRouter({
	history: createWebHistory(),
	routes,
});

// ナビゲーションガードの設定
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

	// 初期化待ち
	if (authStore.loading) {
		await authStore.initializeAuth();
	}

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
	const isAuthPage = ['UserLogin', 'UserCreate'].includes(to.name);

    if (requiresAuth && !authStore.user) {
        next('/user_login');
	} else if (isAuthPage && authStore.user) {
        next('/');
    } else {
        next();
    }
});

export default router;
