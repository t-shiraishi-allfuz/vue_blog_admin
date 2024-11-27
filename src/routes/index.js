import { createRouter, createWebHistory } from 'vue-router';
import CommonLoginTemplate from '@/components/CommonLoginTemplate.vue';
import CommonTemplate from '@/components/CommonTemplate.vue';
import UserCreate from '@/views/admin/UserCreate.vue'; // ユーザー登録
import UserLogin from '@/views/admin/UserLogin.vue'; // ユーザーログイン
import ResetPassword from '@/views/admin/ResetPassword.vue'; // パスワードリセット
import ResetPasswordConfirm from '@/views/admin/ResetPasswordConfirm.vue'; // パスワードリセット
import HomePage from '@/views/HomePage.vue'; // ホームページ
import AdminHomePage from '@/views/admin/HomePage.vue'; // ホームページ
import BlogDetail from '@/views/admin/BlogDetail.vue'; // ブログ詳細
import CommentList from '@/views/admin/CommentList.vue'; // コメント一覧
import LikeList from '@/views/admin/LikeList.vue'; // いいね一覧
import BlogCategoryList from '@/views/admin/BlogCategoryList.vue'; // いいね一覧
import SettingProfileFirst from '@/views/admin/SettingProfileFirst.vue'; // 設定ページ
import SettingProfileIcon from '@/views/admin/SettingProfileIcon.vue'; // 設定ページ
import NotFound from '@/views/admin/NotFound.vue'; // 404ページ

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
		component: HomePage,
	},
	{
		path: '/admin', // 管理画面へのルート
		name: 'AdminHome',
		component: CommonTemplate,
		meta: { requiresAuth: true },
		children: [
			{
				path: '',
				component: AdminHomePage,
			},
			{
				path: '/admin/:activeTab',
				component: AdminHomePage,
			},
			{
				path: '/admin/blog_detail/:blog_id',
				component: BlogDetail,
			},
			{
				path: '/admin/comment_list/:blog_id',
				component: CommentList,
			},
			{
				path: '/admin/like_list/:blog_id',
				component: LikeList,
			},
			{
				path: '/admin/category_list',
				component: BlogCategoryList,
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
