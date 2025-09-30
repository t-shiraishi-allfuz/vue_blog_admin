<template>
	<v-sheet
		v-if="isLoading"
		class="pa-6 mx-auto"
		border="md"
		max-width="800"
	>
		<div class="header-image mb-4">
			<img :src="blogDetail.thumbUrl" />
		</div>
		<h4 class="text-h5 font-weight-bold mb-4">{{ blogDetail.title }}</h4>
		<div class="mb-4 text-body-3">{{ blogDetail.summary }}</div>
		<div class="mb-4 d-flex">
			<v-row>
				<v-avatar
					class="mt-2"
					size="48"
					:image="blogDetail.setting.profileUrl"
					end
				/>
				<v-col cols="3">
					<div class="ml-1 mb-1">
						{{ blogDetail.setting.name }}
					</div>
					<div class="ml-1 mb-1">
						<v-icon icon="mdi-clock" start />
						{{ formatDate(blogDetail.createdAt) }}
					</div>
				</v-col>
				<div v-if="userInfo.uid !== blogDetail.uid">
					<v-col>
						<div v-if="blogDetail.setting.is_follower === true">
							<v-btn @click="deleteFollowUser">フォロー中</v-btn>
						</div>
						<div v-else-if="blogDetail.setting.is_following === true">
							<v-btn @click="followUser">フォローバック</v-btn>
						</div>
						<div v-else>
							<v-btn @click="followUser">フォロー</v-btn>
						</div>
					</v-col>
				</div>
			</v-row>
		</div>
		<BlogCard
			v-if="blogDetail.shareBlog"
			class="mb-5"
			:blog="blogDetail.shareBlog"
			:setting="blogDetail.shareBlog.setting"
		/>
		<div class="mb-4 text-body-1" v-html="blogDetail.content"></div>
		<div class="d-flex">
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatLike"
					:color="colorIconPink('like')"
					variant="text"
					@click="addLike"
				/>
				<div class="text-truncate">{{ blogDetail.like_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					icon="mdi-eye"
					color="grey"
					variant="text"
				/>
				<div class="text-truncate">{{ blogDetail.view_count || 0 }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					icon="mdi-share-outline"
					color="black"
					variant="text"
					@click="addShare"
				/>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatComment"
					:color="colorIconPink('comment')"
					variant="text"
					@click="addComment"
				/>
				<div class="text-truncate">{{ blogDetail.comment_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatBookmark"
					:color="colorIconPrimary"
					variant="text"
					@click="addBookmark"
				/>
			</div>
		</div>
		<v-divider />
		<div class="my-4">
			<div class="pa-4">
				コメント数&nbsp;{{ blogDetail.comment_count }}
			</div>
			<div v-if="commentList.length > 0">
				<div v-for="(comment, index) in commentList" :key="index">
					<div class="pa-4 mb-4">
						<v-row class="d-flex">
							<v-avatar
								class="mt-2"
								size="48"
								:image="comment.setting.profileUrl"
								end
							/>
							<v-col>
								<div class="ml-1 mb-1">
									{{ comment.setting.name }}
								</div>
								<div class="ml-1 mb-1">
									<v-icon icon="mdi-clock" start />
									{{ formatDate(comment.createdAt) }}
								</div>
								<div class="ml-1 mb-1">
									<div v-if="comment.reply_id">
										<div class="pa-4 mb-2 bg-pink-lighten-5 rounded">
											<v-icon icon="mdi-message-reply-text" start />
											<div v-html="comment.reply.body.replace(/\n/g, '<br>')"></div>
										</div>
									</div>
									<div v-html="comment.body.replace(/\n/g, '<br>')"></div>
								</div>
							</v-col>
							<v-col>
								<v-row class="d-flex justify-end ma-2">
									<div class="mx-2">
										<v-icon
											icon="mdi-reply-outline"
											start
											@click="replyComment(comment)"
										/>
									</div>
									<div class="mx-2">
										<v-icon
											icon="mdi-delete"
											start
											@click="deleteComment(comment)"
										/>
									</div>
								</v-row>
							</v-col>
						</v-row>
					</div>
				</div>
			</div>
			<div v-else>
				<div class="pa-4">
					コメントはありません
				</div>
			</div>
		</div>
		<v-divider />
		<v-card-actions>
			<v-btn @click="goBack">{{ backButtonText }}</v-btn>
		</v-card-actions>
	</v-sheet>
	<v-sheet v-if="!isLoading" class="pa-6 mx-auto text-center">
		<v-progress-circular indeterminate />
	</v-sheet>
	<v-dialog v-model="shareDialog" max-width="400px">
		<v-list>
			<v-list-item
				:prepend-icon="mdi-link-variant"
				title="リンクをコピー"
				value="copy"
				@click="copyUrl"
			/>
			<v-divider />
			<v-list-item
				:prepend-icon="mdi-note-edit"
				title="リブログ"
				@click="reblog"
			/>
			<v-divider />
			<div class="d-flex justify-end my-2">
				<v-btn
					class="mx-2"
					color="grey-lighten-2"
					@click="shareDialog = false"
				>
					閉じる
				</v-btn>
			</div>
		</v-list>
	</v-dialog>
	<v-dialog v-model="commentDialog" max-width="400px">
		<v-list>
			<v-list-item>
				<v-textarea
					label="コメント"
					type="string"
					v-model="comment.body"
					solo
				/>
			</v-list-item>
			<v-divider />
			<div class="d-flex justify-end my-2">
				<v-btn
					class="mx-2"
					color="success"
					@click="executeComment"
				>
					コメント
				</v-btn>
				<v-btn
					class="mx-2"
					color="grey-lighten-2"
					@click="commentDialog = false"
				>
					閉じる
				</v-btn>
			</div>
		</v-list>
	</v-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useLikeStore } from '@/stores/likeStore'
import { useCommentStore } from '@/stores/commentStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { format } from 'date-fns'
import BlogCard from '@/components/BlogCard.vue'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()

const blog_id = route.query.blog_id

const authStore = useAuthStore()
const blogStore = useBlogStore()
const likeStore = useLikeStore()
const commentStore = useCommentStore()
const bookmarkStore = useBookmarkStore()
const followUsersStore = useFollowUsersStore()

const {
	userInfo
} = storeToRefs(authStore)

const {
	blogDetail
} = storeToRefs(blogStore)

const {
	commentList
} = storeToRefs(commentStore)

const isLoading = ref(false)
const shareDialog = ref(false)

const reply_id = ref(null)
const commentDialog = ref(false)
const comment = ref({
	uid: '',
	body: '',
	blog_id: '',
	reply_id: '',
	createdAt: '',
	updatedAt: '',
})

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// アイコン設定
const formatLike = computed(() => {
	return blogDetail.value.is_like ? "mdi-heart" : "mdi-heart-outline"
})

const formatComment = computed(() => {
	return blogDetail.value.comment_count > 0 ? "mdi-comment" : "mdi-comment-outline"
})

const formatBookmark = computed(() => {
	return blogDetail.value.is_bookmark ? "mdi-bookmark-plus" : "mdi-bookmark-plus-outline"
})

// アイコン設定（カラー）
const colorIconPink = computed(() => (type) => {
	if (type === "like") {
		return blogDetail.value.is_like ? "pink" : "black"
	} else if (type === "comment") {
		return blogDetail.value.comment_count > 0 ? "pink" : "black"
	} else {
		return "black"
	}
})

const colorIconPrimary = computed(() => {
	return blogDetail.value.is_bookmark ? "blue" : "black"
})

// いいね
const addLike = async () => {
	if (blogDetail.value.is_like) {
		await likeStore.deleteItem(blogDetail.value.id)
		blogDetail.value.is_like = false
		blogDetail.value.like_count--
	} else {
		await likeStore.create(
			blogDetail.value.id,
			blogDetail.value.title,
			blogDetail.value.uid
		)
		blogDetail.value.is_like = true
		blogDetail.value.like_count++
	}
}

// シェア
const addShare = () => {
	shareDialog.value = true
}

// リンクをコピー
const copyUrl = async () => {
	shareDialog.value = false

	try {
		await navigator.clipboard.writeText(window.location.href)
		await Swal.fire({
			title: '成功',
			text: 'リンクをコピーしました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
	} catch (error) {
		await Swal.fire({
			title: 'エラー',
			text: 'リンクのコピーに失敗しました',
			icon: 'error'
		})
	}
}

// リブログ
const reblog = async () => {
	// キャッシュしておく
	localStorage.setItem("shareBlog", JSON.stringify(blogDetail.value))
	localStorage.setItem("shareSetting", JSON.stringify(blogDetail.value.setting))

	router.push('/admin/0')
}

// コメント
const addComment = () => {
	commentDialog.value = true
}

const replyComment = (comment) => {
	reply_id.value = comment.id
	commentDialog.value = true
}

const deleteComment = async (comment) => {
	await commentStore.deleteItem(comment.id)
	await fetchCommentList()
	blogDetail.value.comment_count--
}

const executeComment = async () => {
	if (!comment.value.body) return

	comment.value.uid = userInfo.value.uid
	comment.value.blog_id = blogDetail.value.id
	comment.value.createdAt = new Date()
	comment.value.updatedAt = new Date()

	if (reply_id.value) {
		comment.value.reply_id = reply_id.value
		reply_id.value = ''
	}

	await commentStore.create(
		comment.value,
		blogDetail.value.title,
		blogDetail.value.uid
	)
	await fetchCommentList()
	blogDetail.value.comment_count++

	commentDialog.value = false
}

const fetchCommentList = async () => {
	await commentStore.getList(blogDetail.value.id)
}

// お気に入り登録
const addBookmark = async () => {
	if (blogDetail.value.is_bookmark) {
		await bookmarkStore.deleteItem(blogDetail.value.id)
		blogDetail.value.is_bookmark = false
	} else {
		await bookmarkStore.create(blogDetail.value.id)
		blogDetail.value.is_bookmark = true
	}
}

// フォロー
const followUser = async () => {
	await followUsersStore.create(blogDetail.value.uid)
}

// フォロー外す
const deleteFollowUser = async () => {
	await followUsersStore.deleteItem(blogDetail.value.uid)
}

// ブログデータ取得
onMounted(async () => {
	await blogStore.getDetailWithAccessCount(blog_id)
	await fetchCommentList()

	isLoading.value = true
})

// 戻るボタンのテキストを計算
const backButtonText = computed(() => {
	const from = route.query.from
	if (from === 'profile') {
		return 'プロフィールに戻る'
	}
	return '一覧に戻る'
})

// 戻る処理
const goBack = () => {
	const from = route.query.from
	if (from === 'profile') {
		const profileUid = route.query.profile_uid
		router.push({ 
			path: '/user_profile', 
			query: { uid: profileUid } 
		})
	} else {
		router.push({ path: '/' })
	}
}
</script>

<style scoped>
	figure img {
		max-width: 100%;
		height: auto;
		vertical-align: top;
		object-fit: cover;
	}
</style>
