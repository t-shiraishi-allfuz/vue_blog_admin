<template>
	<v-container fluid>
		<v-row class="horizontal-scroll" no-gutters>
			<v-slide-group v-if="blogList.length > 0" show-arrows>
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
							<div class="d-flex">
								<div class="d-flex align-center text-caption text-medium-emphasis me-1">
									<v-btn
										:icon="formatLike(item)"
										:color="colorIconPink(item)"
										variant="text"
										@click.stop="addLike(item)"
									/>
									<div class="text-truncate">{{ item.like_count }}</div>
								</div>
								<div class="d-flex align-center text-caption text-medium-emphasis me-1">
									<v-btn
										:icon="formatBookmark(item)"
										:color="colorIconPrimary(item)"
										variant="text"
										@click.stop="addBookmark(item)"
									/>
								</div>
							</div>
						</v-card-actions>
					</v-card>
				</v-slide-group-item>
			</v-slide-group>
			<v-alert type="info" v-else>
				ブログがありません
			</v-alert>
		</v-row>
	</v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBlogStore } from '@/stores/blogStore';
import { useLikeStore } from '@/stores/likeStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import {
	mdiHeart,
	mdiHeartOutline,
	mdiBookmarkPlus,
	mdiBookmarkPlusOutline
} from '@mdi/js';

const router = useRouter();
const blogStore = useBlogStore();
const likeStore = useLikeStore();
const bookmarkStore = useBookmarkStore();

const blogList = ref([]);

// 一覧取得
const fetchBlogList = async (type) => {
	switch (+type) {
		case 2:
			blogList.value = await blogStore.getListForBookmark();
			break;
		default:
			blogList.value = await blogStore.getListForAll();
			break;
	}
}

// アイコン設定
const formatLike = (blog) => {
	return blog.is_like ? mdiHeart : mdiHeartOutline;
}
const formatBookmark = (blog) => {
	return blog.is_bookmark ? mdiBookmarkPlus : mdiBookmarkPlusOutline;
}

// アイコン設定（カラー）
const colorIconPink = (blog) => {
	return blog.is_like ? "pink" : "black";
}
const colorIconPrimary = (blog) => {
	return blog.is_bookmark ? "blue" : "black";
}

// 詳細ページに移動
const goToDetail = (blog) => {
	router.push(`/blog_detail/${blog.id}`);
}

// いいね
const addLike = async (blog) => {
	if (blog.is_like) {
		await likeStore.deleteLike(blog.id);
		blog.is_like = false;
		blog.like_count--;
	} else {
		await likeStore.create(blog.id);
		blog.is_like = true;
		blog.like_count++;
	}
}

// お気に入り登録
const addBookmark = async (blog) => {
	if (blog.is_bookmark) {
		await bookmarkStore.deleteBookmark(blog.id);
		blog.is_bookmark = false;
	} else {
		await bookmarkStore.create(blog.id);
		blog.is_bookmark = true;
	}
}

watch(() => blogStore.selectType, async (newType) => {
	await fetchBlogList(newType);
})

// 初回ロード
onMounted(async () => {
	await fetchBlogList(0);
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
