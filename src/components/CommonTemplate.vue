<template>
	<v-app>
		<CommonHeader />
		<v-main>
			<v-container>
				<router-view />
			</v-container>
		</v-main>
	</v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import CommonHeader from '@/components/CommonHeader.vue';
import { useBlogSettingStore } from '@/stores/blogSettingStore';

const blogSettingStore = useBlogSettingStore();

onMounted(() => {
	blogSettingStore.fetchSettingFromFirestore();
});
</script>
