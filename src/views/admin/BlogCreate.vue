<template>
	<BlogEditTemplate
		v-if="isLoading"
		:blog="tempBlog as any"
		:shareBlog="shareBlog as any"
		:shareSetting="shareSetting as any"
		:isUpdate="false"
	/>
</template>

<script setup lang="ts">
import { useBlogStore } from '@/stores/blogStore'

const blogStore = useBlogStore()
const {
	tempBlog
} = storeToRefs(blogStore)

const shareBlog = ref(null)
const shareSetting = ref(null)
const isLoading = ref(false)

onMounted(() => {
	const storageItem1 = localStorage.getItem("shareBlog")
	const storageItem2 = localStorage.getItem("shareSetting")

	shareBlog.value = storageItem1 ? JSON.parse(storageItem1) : null
	shareSetting.value = storageItem2 ? JSON.parse(storageItem2) : null

	isLoading.value = true
})
</script>
