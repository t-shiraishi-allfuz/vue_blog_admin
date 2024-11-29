<template>
	<v-container fluid>
		<v-row class="horizontal-scroll" no-gutters>
			<v-infinite-scroll
				width="1000"
				mode="manual"
				side="end"
				direction="horizontal"
				@load="fetchBlogList"
			>
				<template v-for="(item, index) in blogList" :key="index">
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
				</template>
				<template v-slot:load-more="{ props }">
					<v-btn
						:icon="mdiArrowRight"
						v-bind="props"
						variant="text"
					/>
				</template>
				<template v-slot:empty>
					<v-alert type="warning">ブログがありません</v-alert>
				</template>
			</v-infinite-scroll>
		</v-row>
	</v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBlogStore } from '@/stores/blogStore';
import {
	mdiArrowRight,
	mdiHeart,
	mdiHeartOutline
} from '@mdi/js';

const router = useRouter();
const blogStore = useBlogStore();
const blogList = ref([]);

// 無限スクロールの管理
const page = ref(1);
const isEnd = ref(false);

// 一覧取得
const fetchBlogList = async ({ done } = {}) => {
	if (isEnd.value) {
		done?.();
		return;
	}

	try {
		const newBlogList = await blogStore.getListForAll({
			page: page.value,
			pageSize: 5,
		});
		if (newBlogList.length > 0) {
			blogList.value.push(...newBlogList);
			page.value++;
		} else {
			isEnd.value = true;
		}
	} catch (error) {
		alert(error);
	} finally {
		done?.();
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
await fetchBlogList();
</script>

<style scoped>
.horizontal-scroll {
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
