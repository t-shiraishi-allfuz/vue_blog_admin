<template>
	<v-list-item
		v-for="item in menuItems"
		:key="item.value"
		:title="item.title"
		:class="{ 'selected-item': blogStore.selectType === item.value }"
		append-icon="mdi-chevron-right"
		@click="onSelectType(item.value)"
	/>
	<v-divider />
</template>

<script setup lang="ts">
import { useBlogStore } from '@/stores/blogStore'
import { useAuthStore } from '@/stores/authStore'

// 型定義
interface MenuItem {
	title: string
	value: number
}

const blogStore = useBlogStore()
const authStore = useAuthStore()

// ログイン状態に応じてメニューアイテムを動的に生成
const menuItems = computed((): MenuItem[] => {
	const allMenuItems: MenuItem[] = [
		{ title: 'すべて', value: 0 },
		{ title: 'フォロー中', value: 1 },
		{ title: 'お気に入り', value: 2 },
		{ title: 'おすすめ', value: 3 },
	]
	
	// ログアウト時は「すべて」と「おすすめ」のみ表示
	if (!authStore.isLogin) {
		return allMenuItems.filter(item => item.value === 0 || item.value === 3)
	}
	
	// ログイン時は全メニューを表示
	return allMenuItems
})

const onSelectType = (type: number): void => {
	blogStore.setSelectType(type)
}
</script>

<style scoped>
.selected-item {
	background-color: rgba(39, 193, 163, 0.1); /* 青のハイライト */
	border-left: 4px solid #27C1A3;
}
</style>
