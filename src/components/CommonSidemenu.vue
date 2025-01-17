<template>
	<v-list-item
		v-for="item in menuItems"
		:key="item.value"
		:title="item.title"
		:class="{ 'selected-item': blogStore.selectType === item.value }"
		:append-icon="mdiChevronRight"
		@click="onSelectType(item.value)"
	/>
	<v-divider />
</template>

<script setup>
import { useBlogStore } from '@/stores/blogStore';
import { mdiChevronRight } from '@mdi/js';

const menuItems = [
	{ title: 'すべて', value: 0 },
	{ title: 'フォロー中', value: 1 },
	{ title: 'お気に入り', value: 2 },
	{ title: 'おすすめ', value: 3 },
];

const blogStore = useBlogStore();

const onSelectType = async (type) => {
	blogStore.setSelectType(type);
}
</script>

<style scoped>
.selected-item {
	background-color: rgba(0, 0, 255, 0.1); /* 青のハイライト */
	border-left: 4px solid blue;
}
</style>
