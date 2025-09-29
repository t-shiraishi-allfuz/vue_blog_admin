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

<script setup>
import { computed } from 'vue'
import { useBlogStore } from '@/stores/blogStore'
import { useAuthStore } from '@/stores/authStore'

const blogStore = useBlogStore()
const authStore = useAuthStore()

// ログイン状態に応じてメニューアイテムを動的に生成
const menuItems = computed(() => {
	const allMenuItems = [
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

const onSelectType = (type) => {
	blogStore.setSelectType(type)
}
</script>

<style scoped>
.selected-item {
	background-color: rgba(0, 0, 255, 0.1); /* 青のハイライト */
	border-left: 4px solid blue;
}
</style>
