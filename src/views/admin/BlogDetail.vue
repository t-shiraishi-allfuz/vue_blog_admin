<template>
	<div v-if="isDataLoaded">
		<BlogEditTemplate :id="blog_id" :blog="blog" :isUpdate="true" />
	</div>
	<v-card-actions>
		<v-btn @click="goToList">一覧に戻る</v-btn>
	</v-card-actions>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBlogStore } from '@/stores/blogStore';
import BlogEditTemplate from '@/components/BlogEditTemplate';

const route = useRoute();
const router = useRouter();
const blogStore = useBlogStore();
const blog_id = route.params.blog_id;
const blog = ref(null);
const isDataLoaded = ref(false);

// ブログデータ取得
const getBlog = async () => {
	try {
		blog.value = await blogStore.get(blog_id);
		isDataLoaded.value = true;
	} catch (error) {
		alert(error);
	}
}

// 一覧ページに戻る
const goToList = () => {
	router.push('/admin/1');
};

onMounted(async () => {
	await getBlog();
})
</script>
