<template>
	<v-app v-if="isLoading">
		<CommonHeader />
		<v-main>
			<v-container>
				<router-view />
			</v-container>
		</v-main>
	</v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import CommonHeader from '@/components/CommonHeader.vue'

const blogSettingStore = useBlogSettingStore()

const isLoading = ref(false)

onMounted(async () => {
	await blogSettingStore.getDetail()
	isLoading.value = true
})
</script>
