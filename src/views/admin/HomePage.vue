<template>
	<v-tabs v-model="activeTab">
		<v-tab v-for="(tab, index) in tabs" :key="index">{{ tab }}</v-tab>
	</v-tabs>
	<v-window v-model="activeTab">
		<v-window-item
			v-for="(component, index) in tabComponents"
			:key="index"
			transition="none"
			reverse-transition="none"
		>
			<component :is="component" />
		</v-window-item>
	</v-window>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useUsersStore } from '@/stores/usersStore'
import BlogCreate from '@/views/admin/BlogCreate.vue'
import BlogList from '@/views/admin/BlogList.vue'
import PostImageList from '@/views/admin/PostImageList.vue'
import SettingList from '@/views/admin/SettingList.vue'
import AccessStats from '@/views/admin/AccessStats.vue'
import AnnouncementList from '@/views/admin/AnnouncementList.vue'

const route = useRoute()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const activeTab = ref(0)
const isOwner = ref(false)

const baseTabs = ['記事を書く', '記事一覧', '画像一覧', 'アクセス統計', '設定']
const baseTabComponents = [
	BlogCreate,
	BlogList,
	PostImageList,
	AccessStats,
	SettingList
]

// オーナーユーザーの場合のみお知らせ管理タブを追加
const tabs = computed(() => {
	if (isOwner.value) {
		return [...baseTabs, 'お知らせ管理']
	}
	return baseTabs
})

const tabComponents = computed(() => {
	if (isOwner.value) {
		return [...baseTabComponents, AnnouncementList]
	}
	return baseTabComponents
})

const checkOwnerStatus = async () => {
	if (authStore.isLogin && authStore.userInfo) {
		try {
			isOwner.value = await usersStore.isOwner(authStore.userInfo.uid)
			console.log(isOwner.value)
		} catch (error) {
			console.error('オーナー権限確認エラー:', error)
			isOwner.value = false
		}
	}
}

onMounted(async () => {
	await checkOwnerStatus()
	
	const tab = route.query.tab
	if (tab !== undefined) {
		activeTab.value = parseInt(tab)
	}
})
</script>
