<template>
	<BlogEditTemplate
		v-if="isLoading"
		:blog="blog"
		:shareBlog="shareBlog"
		:shareSetting="shareSetting"
		:isUpdate="false"
	/>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBlogStore } from '@/stores/blogStore'
import BlogEditTemplate from '@/components/BlogEditTemplate'

const blogStore = useBlogStore()
const blog = blogStore.tempBlog

const shareBlog = ref(null);
const shareSetting = ref(null);
const isLoading = ref(false);

onMounted(() => {
	const storageItem1 = localStorage.getItem("shareBlog")
	const storageItem2 = localStorage.getItem("shareSetting")

	console.log(storageItem1)
	console.log(storageItem2)

	shareBlog.value = storageItem1 ? JSON.parse(storageItem1) : null
	shareSetting.value = storageItem2 ? JSON.parse(storageItem2) : null

	isLoading.value = true
})
</script>
