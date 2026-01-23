<template>
	<v-app-bar color="primary" light>
		<template v-slot:prepend>
			<v-app-bar-nav-icon>
				<v-icon icon="mdi-home-circle" @click="goToHome" />
			</v-app-bar-nav-icon>
		</template>
		<v-app-bar-title>
			<v-text-field
				v-if="!isAdminPage"
				label="キーワードやクリエイターで検索"
				v-model="search"
				append-inner-icon="mdi-magnify"
				single-line
				hide-details
				@keyup.enter="executeSearch"
				@click:append-inner="executeSearch"
			/>
		</v-app-bar-title>
		<template v-slot:append>
			<div v-if="isLogin && blogSetting">
				<v-chip
					color="amber"
					variant="flat"
					class="mx-2"
					prepend-icon="mdi-coin"
				>
					{{ coins }}
				</v-chip>
				<v-btn
					icon="mdi-bell"
					variant="text"
					@click="openNotificationDialog"
					class="mx-2"
				>
					<v-badge
						:content="totalUnreadCount"
						:model-value="totalUnreadCount > 0"
						color="error"
						dot
					>
						<v-icon>mdi-bell</v-icon>
					</v-badge>
				</v-btn>
				
				<v-menu>
					<template v-slot:activator="{ props }">
						<v-avatar v-bind="props" :image="(blogSetting as any)?.profileUrl" size="48" end />
					</template>
					<CommonUsermenu :setting="blogSetting as any" @openTweetDialog="openTweetDialog" />
				</v-menu>
				<v-btn text @click="logout">ログアウト</v-btn>
			</div>
			<div v-else-if="isLogin && !blogSetting">
				<v-progress-circular indeterminate size="24" class="mx-2" />
				<v-btn text @click="logout">ログアウト</v-btn>
			</div>
			<div v-else>
				<v-btn text @click="openLoginDialog">ログイン</v-btn>
				<v-btn text @click="openUserCreateDialog">登録</v-btn>
			</div>
		</template>
	</v-app-bar>
	
	<LoginDialog 
		v-model:dialog="isLoginDialog"
		@open-user-create="isUserCreateDialog = true"
		@open-reset-password="isResetPasswordDialog = true"
	/>
	<UserCreateDialog 
		v-model:dialog="isUserCreateDialog"
		@open-login="isLoginDialog = true"
	/>
	<ResetPasswordDialog 
		v-model:dialog="isResetPasswordDialog"
		@open-login="isLoginDialog = true"
	/>
	<NotificationDialog v-model:dialog="isNotificationDialogOpen" />
	<TweetCreateDialog v-model:dialog="isTweetDialogOpen" @saved="onTweetSaved" />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useImagesStore } from '@/stores/imagesStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useDmStore } from '@/stores/dmStore'
import { useCoinStore } from '@/stores/coinStore'
import { AppSwal } from '@/utils/swal'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const blogStore = useBlogStore()
const blogSettingStore = useBlogSettingStore()
const imagesStore = useImagesStore()
const followUsersStore = useFollowUsersStore()
const notificationStore = useNotificationStore()
const announcementStore = useAnnouncementStore()
const dmStore = useDmStore()
const coinStore = useCoinStore()
const {
	blogSetting
} = storeToRefs(blogSettingStore)

const {
	isLogin
} = storeToRefs(authStore)

const {
	coins
} = storeToRefs(coinStore)

// 管理画面かどうかを判定
const isAdminPage = computed((): boolean => {
	return route.path.startsWith('/admin')
})

// 未読通知数とお知らせ数とDM未読数を取得
const totalUnreadCount = computed((): number => 
	notificationStore.unreadNotificationCount + (announcementStore.unreadAnnouncementCount || 0) + dmStore.unreadDmCount
)

const search = ref<string>('')
const isLoginDialog = ref<boolean>(false)
const isUserCreateDialog = ref<boolean>(false)
const isResetPasswordDialog = ref<boolean>(false)
const isNotificationDialogOpen = ref<boolean>(false)
const isTweetDialogOpen = ref<boolean>(false)

onMounted(async (): Promise<void> => {
	// 認証状態に応じてブログ設定を取得
	if (isLogin.value) {
		await blogSettingStore.getDetail()
		await coinStore.getCoins()
		await notificationStore.initialize()
		await announcementStore.getList()
		await dmStore.getConversations()
	}
})

// 認証状態の変化を監視
watch(isLogin, async (newIsLogin: boolean): Promise<void> => {
	if (newIsLogin) {
		// ログインした場合、ブログ設定を取得
		await blogSettingStore.getDetail()
		await coinStore.getCoins()
		await notificationStore.initialize()
		await announcementStore.getList()
		await dmStore.getConversations()
	} else {
		// ログアウトした場合、ブログ設定をクリア
		blogSettingStore.clearStore()
		coinStore.clearStore()
		dmStore.clearStore()
	}
})

const logout = async (): Promise<void> => {
	try {
		const result = await AppSwal.fire({
			title: '確認',
			text: 'ログアウトしますか？',
			showConfirmButton: true,
			confirmButtonText: 'ログアウト',
		})

		if (result.isConfirmed) {
			await authStore.logout()
			// 各ストアをクリア
			blogSettingStore.clearStore()
			imagesStore.clearStore()
			followUsersStore.clearStore()
			coinStore.clearStore()
			dmStore.clearStore()
			router.push({path: '/'})
		}
	} catch (error: any) {
		console.error('ログアウトエラー:', error)
		AppSwal.fire({
			title: 'エラー',
			text: 'ログアウトに失敗しました',
			icon: 'error'
		})
	}
}

const goToHome = (): void => {
	blogStore.setSelectType(0)
	router.push({path: '/'})
}

const openLoginDialog = (): void => {
	isLoginDialog.value = true
}

const openUserCreateDialog = (): void => {
	isUserCreateDialog.value = true
}

// 通知ダイアログを開く
const openNotificationDialog = async (): Promise<void> => {
	isNotificationDialogOpen.value = true
	
	// 通知データとお知らせデータを取得して既読にする
	await notificationStore.fetchNotifications()
	await announcementStore.getList()
	await notificationStore.markAllNotificationsAsRead()
	await announcementStore.markAllAnnouncementsAsRead()
}

// つぶやきダイアログを開く
const openTweetDialog = (): void => {
	isTweetDialogOpen.value = true
}

// つぶやき保存後の処理
const onTweetSaved = (): void => {
	// TODO 保存後の処理
}

// 検索実行
const executeSearch = (): void => {
	if (search.value.trim()) {
		router.push({ path: '/', query: { q: search.value.trim() } })
	} else {
		// 検索クエリが空の場合はクエリパラメータを削除
		router.push({ path: '/' })
	}
}
</script>