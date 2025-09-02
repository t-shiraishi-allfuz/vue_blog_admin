<template>
	<div v-if="isLoading">
		<BlogEditTemplate
			:blog="blogDetail"
			:isUpdate="true"
		/>
	</div>
	<v-card-actions>
		<v-btn @click="goToList">一覧に戻る</v-btn>
	</v-card-actions>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blogStore'
import BlogEditTemplate from '@/components/BlogEditTemplate.vue'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const {
	blogDetail
} = storeToRefs(blogStore)

const blog_id = route.query.blog_id
const isLoading = ref(false)

// ブログデータ取得
const getBlog = async () => {
	await blogStore.getDetail(blog_id)
	isLoading.value = true
}

// 一覧ページに戻る
const goToList = () => {
	router.push({path: "/admin"})
}

onMounted(async () => {
	await getBlog()
	console.log(blogDetail.value)
})
</script>
