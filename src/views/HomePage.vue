<template>
	<v-app>
		<CommonHeader />
		<v-main>
			<v-container>
				<BlogList />
			</v-container>
		</v-main>
	</v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import { useBlogSettingStore } from '@/stores/blogSettingStore';
import CommonHeader from '@/components/CommonHeader.vue';
import BlogList from '@/components/BlogList.vue';

const blogSettingStore = useBlogSettingStore();

onMounted(async() => {
	try {
		await blogSettingStore.fetchSettingFromFirestore();
	} catch (error) {
		alert(error);
	}
})
</script>
