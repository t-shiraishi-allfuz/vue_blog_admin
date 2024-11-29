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
							<v-card class="blog-card" outlined @click="goToDetail(item.raw)">
								<v-img :src="item.raw.thumbUrl" cover class="blog-image"></v-img>
								<v-card-text>
									<strong class="text-h6">{{ item.raw.title }}</strong>
									<p class="text-caption text-truncate">{{ item.raw.summary }}</p>
								</v-card-text>
								<v-card-actions>
									<div class="d-flex justify-space-between w-100">
										<div class="d-flex align-center text-caption text-medium-emphasis me-1">
											<v-icon :icon="mdiClock" start />
											<div class="text-truncate">{{ formatDate(item.raw.createdAt) }}</div>
										</div>
										<v-tooltip top>
											<template v-slot:activator="{ props }">
												<v-icon
													:icon="formatReply(item.raw.reply_count)"
													v-bind="props"
													color="grey"
												/>
											</template>
											<span>{{ item.raw.reply_count }}</span>
										</v-tooltip>
										<v-tooltip top>
											<template v-slot:activator="{ props }">
												<v-icon
													:icon="formatComment(item.raw.comment_count)"
													v-bind="props"
													color="grey"
												/>
											</template>
											<span>{{ item.raw.comment_count }}</span>
										</v-tooltip>
										<v-tooltip top>
											<template v-slot:activator="{ props }">
												<v-icon
													:icon="formatLike(item.raw.like_count)"
													v-bind="props"
													color="grey"
												/>
											</template>
											<span>{{ item.raw.like_count }}</span>
										</v-tooltip>
									</div>
								</v-card-actions>
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
import { ja } from 'date-fns/locale';
import {
	mdiClock,
	mdiReply,
	mdiReplyOutline,
	mdiComment,
	mdiCommentOutline,
	mdiHeart,
	mdiHeartOutline,
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
	return format(new Date(date), 'yyyy年MM月dd日 HH:mm:ss', { locale: ja });
}

// アイコン設定
const formatReply = (count) => {
	return count > 0 ? mdiReply : mdiReplyOutline;
}
const formatComment = (count) => {
	return count > 0 ? mdiComment : mdiCommentOutline;
}
const formatLike = (count) => {
	return count > 0 ? mdiHeart : mdiHeartOutline;
}

// 詳細ページに移動
const goToDetail = (blog) => {
	router.push(`/blog_detail/${blog.id}`);
}

onMounted(async () => {
	await fetchBlogList();
})
</script>

<style scoped>
	.blog-card {
		.v-responsive {
			min-width: 100px;
			min-height: 200px;
			max-height: 200px;
		}
	}
</style>
