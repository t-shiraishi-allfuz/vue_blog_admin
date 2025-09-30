<template>
	<v-list>
		<v-list-item
			v-if="setting"
			:prepend-avatar="setting.profileUrl"
			:title="setting.title"
			:subtitle="setting.description" />
		<v-divider></v-divider>
		<v-list-item prepend-icon="mdi-account" title="プロフィール" value="profile" @click="goToUserProfile" />
		<v-list-item prepend-icon="mdi-cog" title="設定" value="setting" @click="goToProfile" />
	</v-list>
</template>

<script setup lang="ts">

import { useAuthStore } from '@/stores/authStore'

// 型定義
interface SettingData {
	title: string
	description: string
	profileUrl: string
	[key: string]: any
}

// Props定義
interface Props {
	setting: SettingData
}

const props = defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()

const goToUserProfile = (): void => {
	if (authStore.userInfo?.uid) {
		router.push({path: '/user_profile', query: { uid: authStore.userInfo.uid }})
	}
}

const goToProfile = (): void => {
	router.push({path: '/admin'})
}

</script>
