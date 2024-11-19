<template>
	<CommonTemplate>
		<v-tabs v-model="activeTab">
			<v-tab v-for="(tab, index) in tabs" :key="index">{{ tab }}</v-tab>
		</v-tabs>
		<v-window v-model="activeTab">
			<v-window-item v-for="(component, index) in tabComponents" :key="index" transition="none" reverse-transition="none">
				<component :is="component" />
			</v-window-item>
		</v-window>
	</CommonTemplate>
</template>

<script setup>
import { ref } from 'vue';
import PostCreate from '@/views/PostCreate.vue';
import PostList from '@/views/PostList.vue';
import PostImageList from '@/views/PostImageList.vue';
import SettingList from '@/views/SettingList.vue';

const activeTab = ref(0);
const tabs = ['記事を書く', '記事一覧', '画像一覧', '設定'];
const tabComponents = [
	PostCreate,
	PostList,
	PostImageList,
	SettingList
];
</script>
