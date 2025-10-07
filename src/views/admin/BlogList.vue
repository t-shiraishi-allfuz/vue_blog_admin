<template>
	<v-tabs v-model="activeTab" color="success">
		<v-tab value="blogs">
			<v-icon start icon="mdi-post" />
			ブログ記事
		</v-tab>
		<v-tab value="tweets">
			<v-icon start icon="mdi-twitter" />
			つぶやき
		</v-tab>
	</v-tabs>

	<v-window v-model="activeTab">
		<v-window-item
			value="blogs"
			transition="none"
			reverse-transition="none"
		>
			<v-container>
				<v-card class="blog-list">
					<v-data-table
						class="blog-list"
						:headers="blogHeaders"
						:items="filteredBlogList"
						:items-per-page="30"
						no-data-text="記事がありません"
					>
						<template v-slot:top>
							<v-toolbar flat>
								<v-toolbar-title>記事一覧</v-toolbar-title>
								<v-divider class="mx-4" inset vertical />
								<v-spacer></v-spacer>
								<v-text-field
									label="検索"
									v-model="blogSearch"
									append-inner-icon="mdi-magnify"
									single-line
									hide-details
								/>
							</v-toolbar>
						</template>
						<template v-slot:[`item.title`]="{ item }">
							<a @click.prevent="goToBlogDetail(item)" class="blog-title" href="#">
								{{ item.title }}
							</a>
						</template>
						<template v-slot:[`item.createdAt`]="{ item }">
							{{ formatDate(item.createdAt) }}
						</template>
						<template v-slot:[`item.isPublished`]="{ item }">
							<v-chip
								:color="item.isPublished ? 'success' : 'warning'"
								size="small"
								variant="outlined"
							>
								{{ item.isPublished ? '公開中' : '下書き' }}
							</v-chip>
						</template>
						<template v-slot:[`item.viewCount`]="{ item }">
							<v-chip
								:color="getViewCountColor(item.viewCount)"
								size="small"
								variant="outlined"
							>
								<v-icon start icon="mdi-eye" />
								{{ item.viewCount || 0 }}
							</v-chip>
						</template>
						<template v-slot:[`item.comment_count`]="{ item }">
							<div v-if="item.comment_count > 0">
								<a href="#" @click.prevent="goToCommentList(item)">
									{{ item.comment_count }}
								</a>
							</div>
							<div v-else>
								<span>{{ item.comment_count }}</span>
							</div>
						</template>
						<template v-slot:[`item.like_count`]="{ item }">
							<div v-if="item.like_count > 0">
								<a href="#" @click.prevent="goToLikeList(item)">
									{{ item.like_count }}
								</a>
							</div>
							<div v-else>
								<span>{{ item.like_count }}</span>
							</div>
						</template>
						<template v-slot:[`item.actions`]="{ item }">
							<v-icon
								color="red"
								icon="mdi-delete"
								aria-label="削除"
								role="button"
								@click="openDeleteDialog(item)"
							/>
						</template>
					</v-data-table>
				</v-card>
			</v-container>
		</v-window-item>

		<v-window-item
			value="tweets"
			transition="none"
			reverse-transition="none"
		>
			<TweetList />
		</v-window-item>
	</v-window>
</template>

<script setup lang="ts">
import { useBlogStore } from '@/stores/blogStore'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import TweetList from '@/components/TweetList.vue'

const router = useRouter()
const blogStore = useBlogStore()
const {
	blogList
} = storeToRefs(blogStore)

const activeTab = ref('blogs')
const blogSearch = ref('')
const blogToDelete = ref(null)

const blogHeaders = [
	{title: "記事タイトル", value: "title" },
	{title: "投稿日時", value: "createdAt", sortable: true },
	{title: "ステータス", value: "isPublished", sortable: true },
	{title: "アクセス数", value: "viewCount", sortable: true },
	{title: "コメント", value: "comment_count", sortable: true },
	{title: "いいね", value: "like_count", sortable: true },
	{title: "削除", value: "actions", sortable: false },
]

// 一覧取得
const fetchBlogList = async () => {
	await blogStore.getList()
}

// 個別削除確認ダイアログを開く
const openDeleteDialog = async (blog: any) => {
	blogToDelete.value = blog
	
	const result = await Swal.fire({
		title: '削除確認',
		text: 'この記事を本当に削除しますか？',
		showCancelButton: true,
		confirmButtonColor: '#27C1A3',
		cancelButtonColor: '#9e9e9e',
		confirmButtonText: '削除',
		cancelButtonText: 'キャンセル',
		reverseButtons: true,
		buttonsStyling: true,
		customClass: {
			confirmButton: 'swal2-confirm-fixed-width',
			cancelButton: 'swal2-cancel-fixed-width'
		},
		didOpen: () => {
			// ダイアログが開いた後にボタンのスタイルを適用
			const confirmBtn = document.querySelector('.swal2-confirm-fixed-width') as HTMLElement
			const cancelBtn = document.querySelector('.swal2-cancel-fixed-width') as HTMLElement
			if (confirmBtn) {
				confirmBtn.style.minWidth = '150px'
				confirmBtn.style.width = '150px'
			}
			if (cancelBtn) {
				cancelBtn.style.minWidth = '150px'
				cancelBtn.style.width = '150px'
			}
		}
	})

	if (result.isConfirmed && blogToDelete.value) {
		await blogStore.deleteItem(blogToDelete.value.id)
		await fetchBlogList()
		
		// 削除完了メッセージ
		Swal.fire({
			title: '削除完了',
			text: '記事を削除しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
	}
}

// 検索条件に基づく投稿フィルタリング
const filteredBlogList = computed(() => {
	if (!blogSearch.value) return blogList.value

	return blogList.value.filter(blog =>
		blog.title.toLowerCase().includes(blogSearch.value.toLowerCase())
	)
})

// 日時フォーマット関数
const formatDate = (date: any) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
}

// アクセス数に応じた色を返す関数
const getViewCountColor = (viewCount: any) => {
	if (!viewCount || viewCount === 0) return 'grey'
	if (viewCount < 10) return 'blue'
	if (viewCount < 50) return 'green'
	if (viewCount < 100) return 'orange'
	return 'red'
}

// 詳細ページに移動
const goToBlogDetail = (blog: any) => {
	router.push({path: "/admin/blog_detail", query: {blog_id: blog.id}});
}

// コメント一覧に移動
const goToCommentList = (blog: any) => {
	router.push({path: "/admin/comment_list", query: {blog_id: blog.id}});
}

// いいね一覧に移動
const goToLikeList = (blog: any) => {
	router.push({path: "/admin/like_list", query: {blog_id: blog.id}});
}

onMounted(async () => {
	await fetchBlogList()
})
</script>

<style scoped>
	.content-list {
		margin-top: 20px;
	}

	/* SweetAlert2ボタンの固定幅スタイル */
	:deep(.swal2-confirm-fixed-width) {
		min-width: 150px !important;
		width: 150px !important;
		box-sizing: border-box !important;
	}

	:deep(.swal2-cancel-fixed-width) {
		min-width: 150px !important;
		width: 150px !important;
		box-sizing: border-box !important;
	}
</style>

<style>
/* グローバルスタイルでSweetAlert2ボタンの幅を固定 */
.swal2-confirm-fixed-width {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}

.swal2-cancel-fixed-width {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}
</style>
