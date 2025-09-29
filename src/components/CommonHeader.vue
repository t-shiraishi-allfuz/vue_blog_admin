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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from "pinia"
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useLikeStore } from '@/stores/likeStore'
import { useImagesStore } from '@/stores/imagesStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import CommonUsermenu from '@/components/CommonUsermenu.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import Swal from 'sweetalert2'

const router = useRouter()

const authStore = useAuthStore()
const blogStore = useBlogStore()
const blogSettingStore = useBlogSettingStore()
const likeStore = useLikeStore()
const imagesStore = useImagesStore()
const followUsersStore = useFollowUsersStore()
const {
	blogSetting
} = storeToRefs(blogSettingStore)

const {
	isLogin
} = storeToRefs(authStore)

const search = ref('')
const isLoginDialog = ref(false)

onMounted(async () => {
	// 認証状態に応じてブログ設定を取得
	if (isLogin.value) {
		await blogSettingStore.getDetail()
	}
})

// 認証状態の変化を監視
watch(isLogin, async (newIsLogin) => {
	if (newIsLogin) {
		// ログインした場合、ブログ設定を取得
		await blogSettingStore.getDetail()
	} else {
		// ログアウトした場合、ブログ設定をクリア
		blogSettingStore.clearStore()
	}
})

const logout = async () => {
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
	} catch (error) {
		console.error('ログアウトエラー:', error)
		Swal.fire({
			title: 'エラー',
			text: 'ログアウトに失敗しました',
			icon: 'error'
		})
	}
}

const goToHome = () => {
	blogStore.setSelectType(0)
	router.push({path: '/'})
}

const openLoginDialog = () => {
	isLoginDialog.value = true
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
