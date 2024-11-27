<template>
	<v-list>
		<v-list-item
			:prepend-avatar="blogSettingStore.blogSetting.profileUrl"
			:title="blogSettingStore.blogSetting.title"
			:subtitle="blogSettingStore.blogSetting.description">
		</v-list-item>
		<v-divider></v-divider>
		<v-list-item :prepend-icon="mdiInformationOutline" title="お知らせ" value="news"></v-list-item>
	</v-list>
</template>

<script setup>
import { useBlogSettingStore } from '@/stores/blogSettingStore';
import { mdiInformationOutline } from '@mdi/js';

// ブログ設定
const blogSettingStore = useBlogSettingStore();
</script>
