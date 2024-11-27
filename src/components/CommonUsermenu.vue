<template>
	<v-list>
		<v-list-item
			:prepend-avatar="blogSettingStore.blogSetting.profileUrl"
			:title="blogSettingStore.blogSetting.title"
			:subtitle="blogSettingStore.blogSetting.description" />
		<v-divider></v-divider>
		<v-list-item :prepend-icon="mdiInformationOutline" title="お知らせ" value="news" />
		<v-list-item :prepend-icon="mdiCog" title="設定" value="setting" @click="goToProfile" />
	</v-list>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useBlogSettingStore } from '@/stores/blogSettingStore';
import {
	mdiInformationOutline,
	mdiCog
} from '@mdi/js';

const router = useRouter();
const blogSettingStore = useBlogSettingStore();

// ブログ設定へ
const goToProfile = () => {
	router.push('/admin/3');
}
</script>
