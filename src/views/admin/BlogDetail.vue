<template>
	<div v-if="isLoading">
		<BlogEditTemplate
			:blog="blog"
			:isUpdate="true"
		/>
	</div>
	<v-card-actions>
		<v-btn @click="goToList">一覧に戻る</v-btn>
	</v-card-actions>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blogStore'
import BlogEditTemplate from '@/components/BlogEditTemplate.vue'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const blog_id = route.params.blog_id
const blog = ref(null)
const isLoading = ref(false)

// ブログデータ取得
const getBlog = async () => {
	blog.value = await blogStore.get(blog_id)
	isLoading.value = true
}

// 一覧ページに戻る
const goToList = () => {
	router.push('/admin/1')
}

onMounted(async () => {
	await getBlog()
})
</script>
