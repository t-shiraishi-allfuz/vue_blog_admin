<template>
	<v-app-bar color="primary" light>
		<template v-slot:prepend>
			<v-app-bar-nav-icon>
				<v-icon icon="mdi-home-circle" @click="goToHome" />
			</v-app-bar-nav-icon>
		</template>
		<v-app-bar-title>
			<v-text-field
				label="キーワードやクリエイターで検索"
				v-model="search"
				append-inner-icon="mdi-magnify"
				single-line
				hide-details
			/>
		</v-app-bar-title>
		<template v-slot:append>
			<div v-if="isLogin && blogSetting">
				<v-btn
					icon="mdi-bell"
					variant="text"
					@click="openNotificationDialog"
					class="mr-2"
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
						<v-avatar v-bind="props" :image="blogSetting.profileUrl" size="48" end />
					</template>
					<CommonUsermenu :setting="blogSetting" />
				</v-menu>
				<v-btn text @click="logout">ログアウト</v-btn>
			</div>
			<div v-else-if="isLogin && !blogSetting">
				<v-progress-circular indeterminate size="24" class="mr-2" />
				<v-btn text @click="logout">ログアウト</v-btn>
			</div>
			<div v-else>
				<v-btn text @click="openLoginDialog">ログイン</v-btn>
				<v-btn text to="/user_create">登録</v-btn>
			</div>
		</template>
	</v-app-bar>
	
	<LoginDialog v-model:dialog="isLoginDialog" />
	<NotificationDialog v-model="isNotificationDialogOpen" />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useLikeStore } from '@/stores/likeStore'
import { useImagesStore } from '@/stores/imagesStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAnnouncementStore } from '@/stores/announcementStore'
import CommonUsermenu from '@/components/CommonUsermenu.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import NotificationDialog from '@/components/NotificationDialog.vue'
import Swal from 'sweetalert2'

const router = useRouter()

const authStore = useAuthStore()
const blogStore = useBlogStore()
const blogSettingStore = useBlogSettingStore()
const likeStore = useLikeStore()
const imagesStore = useImagesStore()
const followUsersStore = useFollowUsersStore()
const notificationStore = useNotificationStore()
const announcementStore = useAnnouncementStore()
const {
	blogSetting
} = storeToRefs(blogSettingStore)

const {
	isLogin
} = storeToRefs(authStore)

// 未読通知数とお知らせ数を取得
const totalUnreadCount = computed((): number => 
	notificationStore.unreadNotificationCount + (announcementStore.unreadAnnouncementCount || 0)
)

const search = ref<string>('')
const isLoginDialog = ref<boolean>(false)
const isNotificationDialogOpen = ref<boolean>(false)

onMounted(async (): Promise<void> => {
	// 認証状態に応じてブログ設定を取得
	if (isLogin.value) {
		await blogSettingStore.getDetail()
		await notificationStore.initialize()
		await announcementStore.getList()
	}
})

// 認証状態の変化を監視
watch(isLogin, async (newIsLogin: boolean): Promise<void> => {
	if (newIsLogin) {
		// ログインした場合、ブログ設定を取得
		await blogSettingStore.getDetail()
		await notificationStore.initialize()
		await announcementStore.getList()
	} else {
		// ログアウトした場合、ブログ設定をクリア
		blogSettingStore.clearStore()
	}
})

const logout = async (): Promise<void> => {
	try {
		const result = await Swal.fire({
			title: '確認',
			text: 'ログアウトしますか？',
			showCancelButton: true,
			confirmButtonColor: '#27C1A3',
			cancelButtonColor: '#9e9e9e',
			confirmButtonText: 'ログアウト',
			cancelButtonText: 'キャンセル',
			reverseButtons: true,
			buttonsStyling: true,
			customClass: {
				confirmButton: 'swal2-confirm-fixed-width',
				cancelButton: 'swal2-cancel-fixed-width'
			},
			didOpen: () => {
				// ダイアログが開いた後にボタンのスタイルを適用
				const confirmBtn = document.querySelector('.swal2-confirm-fixed-width')
				const cancelBtn = document.querySelector('.swal2-cancel-fixed-width')
				if (confirmBtn) {
					confirmBtn.style.minWidth = '150px'
					confirmBtn.style.width = '150px'
				}
				if (cancelBtn) {
					cancelBtn.style.minWidth = '150px'
					cancelBtn.style.width = '150px'
				}
			}
		})

		if (result.isConfirmed) {
			await authStore.logout()
			// 各ストアをクリア
			blogSettingStore.clearStore()
			imagesStore.clearStore()
			followUsersStore.clearStore()
			router.push({path: '/'})
		}
	} catch (error: any) {
		console.error('ログアウトエラー:', error)
		Swal.fire({
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

// 通知ダイアログを開く
const openNotificationDialog = async (): Promise<void> => {
	isNotificationDialogOpen.value = true
	
	// 通知データとお知らせデータを取得して既読にする
	await notificationStore.fetchNotifications()
	await announcementStore.getList()
	await notificationStore.markAllNotificationsAsRead()
	await announcementStore.markAllAnnouncementsAsRead()
}
</script>

<style scoped>
/* SweetAlert2ボタンの固定幅スタイル */
:deep(.swal2-confirm-fixed-width) {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}

:deep(.swal2-cancel-fixed-width) {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}
</style>

<style>
/* グローバルスタイルでSweetAlert2ボタンの幅を固定 */
.swal2-confirm-fixed-width {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}

.swal2-cancel-fixed-width {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}
</style>
