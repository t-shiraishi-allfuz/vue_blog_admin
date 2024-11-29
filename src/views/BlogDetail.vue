<template>
	<CommonTemplate>
		<div v-if="isDataLoaded">
			<v-card class="blog-detail">
				<v-card-item class="header-image">
					<img :src="blog.thumbUrl" />
				</v-card-item>
				<v-card-title>{{ blog.title }}</v-card-title>
				<v-card-subtitle>{{ blog.summary }}</v-card-subtitle>
				<v-card-text v-html="blog.content"></v-card-text>
				<v-card-actions>
					<div class="d-flex justify-space-between px-4">
						<div class="d-flex align-center text-caption text-medium-emphasis me-1">
							<v-icon :icon="mdiClock" start />
							<div class="text-truncate">{{ formatDate(blog.createdAt) }}</div>
						</div>
						<div class="d-flex align-center text-caption text-medium-emphasis me-1">
							<v-icon :icon="formatReply(blog.reply_count)" start />
							<div class="text-truncate">{{ blog.reply_count }}</div>
						</div>
						<div class="d-flex align-center text-caption text-medium-emphasis me-1">
							<v-icon :icon="formatComment(blog.comment_count)" start />
							<div class="text-truncate">{{ blog.comment_count }}</div>
						</div>
						<div class="d-flex align-center text-caption text-medium-emphasis me-1">
							<v-icon :icon="formatLike(blog.like_count)" start />
							<div class="text-truncate">{{ blog.like_count }}</div>
						</div>
					</div>
				</v-card-actions>
			</v-card>
		</div>
	</CommonTemplate>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBlogStore } from '@/stores/blogStore';
import { format } from 'date-fns';
import {
	mdiClock,
	mdiReply,
	mdiReplyOutline,
	mdiComment,
	mdiCommentOutline,
	mdiHeart,
	mdiHeartOutline
} from '@mdi/js';

const route = useRoute();
const blogStore = useBlogStore();
const blog_id = route.params.blog_id;
const blog = ref(null);
const isDataLoaded = ref(false);

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

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

// ブログデータ取得
onMounted(async () => {
	try {
		blog.value = await blogStore.get(blog_id);
		isDataLoaded.value = true;
	} catch (error) {
		alert(error);
	}
})
</script>

<style scoped>
	figure img {
		max-width: 100%;
		height: auto;
		vertical-align: top;
		object-fit: cover;
	}
</style>
