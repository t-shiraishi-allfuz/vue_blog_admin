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
import { defineProps, onMounted } from 'vue';
import CommonHeader from '@/components/CommonHeader.vue';
import { useBlogSettingStore } from '@/stores/blogSettingStore';

const blogSettingStore = useBlogSettingStore();

defineProps({
	title: {
		type: String,
		required: true,
	},
});

onMounted(() => {
	blogSettingStore.fetchSettingFromFirestore();
});
</script>
