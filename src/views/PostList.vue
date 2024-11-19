<template>
	<v-container v-if="currentPage === 'list'">
		<v-card class="blog-list">
			<v-data-table class="blog-list" :headers="headers" :items="filteredBlogList" :items-per-page="30" no-data-text="記事がありません">
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>記事一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-text-field :loading="loading" v-model="search" label="検索" :append-inner-icon="mdiMagnify" single-line hide-details />
					</v-toolbar>
				</template>
				<template v-slot:[`item.title`]="{ item }">
					<a @click.prevent="goToDetail(item)" class="blog-title" href="#">
						{{ item.title }}
					</a>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.isPublished`]="{ item }">
					{{ item.isPublished ? '公開' : '下書き' }}
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<v-icon class="delete-icon" :icon="mdiDelete" aria-label="削除" role="button" @click="openDeleteDialog(item)" />
				</template>
			</v-data-table>
		</v-card>
		<v-dialog v-model="deleteDialog" max-width="400px">
			<v-card>
				<v-card-title>削除確認</v-card-title>
				<v-card-text>この記事を本当に削除しますか？</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="deleteDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="confirmDelete">削除</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
	<v-container v-if="currentPage === 'detail'">
		<PostDetail :blog="selectedBlog" />
		<v-card-actions>
			<v-btn @click="goToList">一覧に戻る</v-btn>
		</v-card-actions>
	</v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBlogStore } from '@/stores/blogStore';
import { format } from 'date-fns';
import { mdiMagnify, mdiDelete } from '@mdi/js';
import PostDetail from '@/views/PostDetail.vue';

const blogStore = useBlogStore();
const blogList = ref([]);
const currentPage = ref('list'); // 現在のページ ('list' または 'detail')
const selectedBlog = ref(null);  // 選択された記事
const search = ref('');
const deleteDialog = ref(false);
const blogToDelete = ref(null);

const headers = [
	{title: "記事タイトル", value: "title" },
	{title: "投稿日時", value: "createdAt" },
	{title: "ステータス", value: "isPublished" },
	{title: "削除", value: "actions", sortable: false },
];

// 一覧取得
const fetchBlogList = async () => {
	try {
		blogList.value = await blogStore.getList();
	} catch (error) {
		alert(error);
	}
}

// 個別削除確認ダイアログを開く
const openDeleteDialog = (blog) => {
	blogToDelete.value = blog;
	deleteDialog.value = true;
};

// 個別削除を確定する
const confirmDelete = async () => {
	deleteDialog.value = false;

	try {
		await blogStore.delete(blogToDelete.value.id);
		blogList.value = blogList.value.filter(blog => blog.id !== blogToDelete.value.id);
	} catch (error) {
		alert(error);
	}
};

// 検索条件に基づく投稿フィルタリング
const filteredBlogList = computed(() => {
	if (!search.value) return blogList.value;
	return blogList.value.filter(blog =>
		blog.title.toLowerCase().includes(search.value.toLowerCase())
	);
});

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

// 詳細ページに移動
const goToDetail = (post) => {
	selectedBlog.value = post;
	currentPage.value = 'detail';
};

// 一覧ページに戻る
const goToList = () => {
	selectedBlog.value = null;
	currentPage.value = 'list';
};

onMounted(() => {
	fetchBlogList();
})
</script>

<style scoped>
	.delete-icon {
		color: red;
	}
</style>
