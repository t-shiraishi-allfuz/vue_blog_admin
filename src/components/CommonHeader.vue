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
			<div v-if="blogSetting">
				<v-menu>
					<template v-slot:activator="{ props }">
						<v-avatar v-bind="props" :image="blogSetting.profileUrl" size="48" end />
					</template>
					<CommonUsermenu :setting="blogSetting" />
				</v-menu>
				<v-btn text @click="logout">ログアウト</v-btn>
			</div>
			<div v-else>
				<v-btn text to="/user_login">ログイン</v-btn>
				<v-btn text to="/user_create">登録</v-btn>
			</div>
		</template>
	</v-app-bar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useLikeStore } from '@/stores/likeStore'
import { useImagesStore } from '@/stores/imagesStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import CommonUsermenu from '@/components/CommonUsermenu.vue'
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

const search = ref('')

onMounted(async () => {
	await blogSettingStore.getDetail()
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
