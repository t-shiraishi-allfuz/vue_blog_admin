<template>
	<v-container v-if="currentPage === 'list'">
		<v-card class="post-list">
			<v-data-table class="post-list" :headers="headers" :items="filteredPosts" :items-per-page="30" no-data-text="記事がありません">
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>記事一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-text-field :loading="loading" v-model="search" label="検索" :append-inner-icon="mdiMagnify" single-line hide-details />
					</v-toolbar>
				</template>
				<template v-slot:[`item.title`]="{ item }">
					<a @click.prevent="goToDetail(item)" class="post-title" href="#">
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
					<v-icon class="delete-icon" :icon="mdiDelete" aria-label="削除" role="button" @click="confirmDelete(item)" />
				</template>
			</v-data-table>
		</v-card>
	</v-container>
	<v-container v-if="currentPage === 'detail'">
		<PostDetail :blog="selectedPost" />
		<v-card-actions>
			<v-btn @click="goToList">一覧に戻る</v-btn>
		</v-card-actions>
	</v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { db } from '@/setting/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { mdiMagnify, mdiDelete } from '@mdi/js';
import PostDetail from '@/views/PostDetail.vue';

const posts = ref([]);
const currentPage = ref('list'); // 現在のページ ('list' または 'detail')
const selectedPost = ref(null);  // 選択された記事
const search = ref('');

const headers = [
	{title: "記事タイトル", value: "title" },
	{title: "投稿日時", value: "createdAt" },
	{title: "ステータス", value: "isPublished" },
	{title: "削除", value: "actions", sortable: false },
];

const fetchBlogList = async () => {
	posts.value = [];
	const blogCollectionRef = collection(db, "blog");
	const snapshot = await getDocs(blogCollectionRef);

	if (!snapshot.empty) {
		snapshot.forEach(doc => {
			const data = { id: doc.id, ...doc.data() };
			if (data.createdAt && data.createdAt.toDate) {
				data.createdAt = data.createdAt.toDate();
			}
			posts.value.push(data);
		});
	}
}

const confirmDelete = async (blog) => {
	if (confirm("本当にこの記事を削除しますか？")) {
		await deleteItem(blog);
	}
}

const deleteItem = async (blog) => {
	try {
		const docRef = doc(db, "blog", blog.id);
		await deleteDoc(docRef);
		alert('記事が削除されました');
		posts.value = posts.value.filter(post => post.id !== blog.id);
	} catch (error) {
		alert('記事の削除に失敗しました');
	}
}

// 検索条件に基づく投稿フィルタリング
const filteredPosts = computed(() => {
	if (!search.value) return posts.value;
	return posts.value.filter(post =>
		post.title.toLowerCase().includes(search.value.toLowerCase())
	);
});

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

// 詳細ページに移動
const goToDetail = (post) => {
	selectedPost.value = post;
	currentPage.value = 'detail';
};

// 一覧ページに戻る
const goToList = () => {
	selectedPost.value = null;
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
