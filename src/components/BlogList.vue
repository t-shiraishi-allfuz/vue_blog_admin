<template>
	<v-card class="blog-list">
		<v-data-iterator
			class="blog-list"
			:items="blogList"
			:items-per-page="10"
		>
			<template v-slot:default="{ items }">
				<v-container class="pa-2" fluid>
					<v-row dense>
						<v-col v-for="item in items" :key="item.title" cols="auto" md="4">
							<v-card class="pb-3" border flat @click="goToDetail(item)">
								<v-list-item :subtitle="item.raw.summary" class="mb-2">
									<template v-slot:title>
										<strong class="text-h6 mb-2">{{ item.raw.title }}</strong>
									</template>
								</v-list-item>
								<div class="d-flex justify-space-between px-4">
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-icon :icon="mdiClock" start />
										<div class="text-truncate">{{ formatDate(item.raw.createdAt) }}</div>
									</div>
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-icon :icon="mdiMessageReply" start />
										<div class="text-truncate">{{ item.raw.comment_count }}</div>
									</div>
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-icon :icon="mdiHeart" start />
										<div class="text-truncate">{{ item.raw.like_count }}</div>
									</div>
								</div>
							</v-card>
						</v-col>
					</v-row>
				</v-container>
			</template>
			<template v-slot:no-data>
				<v-container class="pa-2" fluid>
					<div class="d-flex align-center justify-center pa-4">
						ブログがありません
					</div>
				</v-container>
			</template>
			<template v-slot:footer="{ page, pageCount, prevPage, nextPage }">
				<div class="d-flex align-center justify-center pa-4">
					<v-btn
						:disabled="page === 1"
						density="comfortable"
						:icon="mdiArrowLeft"
						variant="tonal"
						rounded
						@click="prevPage"
					></v-btn>
					<div class="mx-2 text-caption">Page {{ page }} of {{ pageCount }}</div>
					<v-btn
						:disabled="page >= pageCount"
						density="comfortable"
						:icon="mdiArrowRight"
						variant="tonal"
						rounded
						@click="nextPage"
					></v-btn>				
				</div>
			</template>
		</v-data-iterator>
	</v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBlogStore } from '@/stores/blogStore';
import { format } from 'date-fns';
import {
	mdiClock,
	mdiMessageReply,
	mdiHeart,
	mdiArrowLeft,
	mdiArrowRight
} from '@mdi/js';

const router = useRouter();
const blogStore = useBlogStore();
const blogList = ref([]);

// 一覧取得
const fetchBlogList = async () => {
	try {
		blogList.value = await blogStore.getListForAll();
	} catch (error) {
		alert(error);
	}
}

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

// 詳細ページに移動
const goToDetail = (blog) => {
	router.push(`/blog_detail/${blog.id}`);
};

onMounted(async () => {
	await fetchBlogList();
})
</script>

<style scoped>
</style>
