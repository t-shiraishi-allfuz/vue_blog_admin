<template>
	<v-container fluid>
		<v-row class="horizontal-scroll" no-gutters>
			<v-slide-group show-arrows>
				<v-slide-group-item
					v-for="(item, index) in blogList"
					:key="index"
				>
					<v-card
						class="blog-card d-inline-block"
						@click="goToDetail(item)"
						outlined
					>
						<v-img :src="item.thumbUrl" aspect-ratio="16/9" cover></v-img>
						<v-card-text>
							<strong class="text-h6">{{ item.title }}</strong>
						</v-card-text>
						<v-card-actions>
							<div class="d-flex justify-space-between w-100">
								<div class="d-flex align-center text-caption text-medium-emphasis me-1">
									<v-icon :icon="formatLike(item.like_count)" />
									<div class="text-truncate">{{ item.like_count }}</div>
								</div>
							</div>
						</v-card-actions>
					</v-card>
				</v-slide-group-item>
			</v-slide-group>
		</v-row>
	</v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBlogStore } from '@/stores/blogStore';
import {
	mdiHeart,
	mdiHeartOutline
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

// アイコン設定
const formatLike = (count) => {
	return count > 0 ? mdiHeart : mdiHeartOutline;
}

// 詳細ページに移動
const goToDetail = (blog) => {
	router.push(`/blog_detail/${blog.id}`);
}

// 初回ロード
onMounted(async () => {
	await fetchBlogList();
})
</script>

<style scoped>
.horizontal-scroll {
	max-width: 1100px;
	overflow-x: auto;
	white-space: nowrap;
}
.blog-card {
	min-width: 200px;
	min-height: 250px;
	margin: 10px;

	.v-responsive {
		min-width: 100%;
		min-height: 150px;
		max-height: 150px;
	}
}
</style>
