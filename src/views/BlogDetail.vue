<template>
	<v-sheet
		v-if="isLoading"
		class="pa-6 mx-auto"
		border="md"
		max-width="800"
	>
		<div class="header-image mb-4">
			<img :src="blog.thumbUrl" />
		</div>
		<h4 class="text-h5 font-weight-bold mb-4">{{ blog.title }}</h4>
		<div class="mb-4 text-body-3">{{ blog.summary }}</div>
		<div class="mb-4 d-flex">
			<v-row>
				<v-avatar
					class="mt-2"
					size="48"
					:image="setting.profileUrl"
					end
				/>
				<v-col cols="3">
					<div class="ml-1 mb-1">
						{{ setting.name }}
					</div>
					<div class="ml-1 mb-1">
						<v-icon icon="mdi-clock" start />
						{{ formatDate(blog.createdAt) }}
					</div>
				</v-col>
				<div v-if="userInfo.uid !== blog.uid">
					<v-col>
						<div v-if="setting.is_follower === true">
							<v-btn @click="deleteFollowUser">フォロー中</v-btn>
						</div>
						<div v-else-if="setting.is_following === true">
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
			v-if="shareBlog"
			class="mb-5"
			:blog="shareBlog"
			:setting="shareSetting"
		/>
		<div class="mb-4 text-body-1" v-html="blog.content"></div>
		<div class="d-flex">
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatLike(blog)"
					:color="colorIconPink(blog.is_like)"
					variant="text"
					@click="addLike(blog)"
				/>
				<div class="text-truncate">{{ blog.like_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					icon="mdi-share-outline"
					:color="colorIconPink(false)"
					variant="text"
					@click="addShare()"
				/>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatComment(blog.comment_count)"
					:color="colorIconPink(blog.comment_count)"
					variant="text"
					@click="addComment(blog)"
				/>
				<div class="text-truncate">{{ blog.comment_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatBookmark(blog)"
					:color="colorIconPrimary(blog.is_bookmark)"
					variant="text"
					@click="addBookmark(blog)"
				/>
			</div>
		</div>
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
				@click="copyUrl()"
			/>
			<v-divider></v-divider>
			<v-list-item
				:prepend-icon="mdi-note-edit"
				title="リブログ"
				@click="reblog()"
			/>
			<v-divider></v-divider>
			<v-list-item>
				<v-list-item-action class="align-center">
					<v-spacer></v-spacer>
					<v-btn
						color="grey-lighten-2"
						variant="flat"
						@click="shareDialog = false"
					>
						閉じる
					</v-btn>
					<v-spacer></v-spacer>
				</v-list-item-action>
			</v-list-item>
		</v-list>
	</v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { format } from 'date-fns'
import BlogCard from '@/components/BlogCard.vue'

const route = useRoute()
const router = useRouter()

const blog_id = route.query.blog_id

const authStore = useAuthStore()
const blogStore = useBlogStore()
const blogSettingStore = useBlogSettingStore()
const likeStore = useLikeStore()
const bookmarkStore = useBookmarkStore()
const followUsersStore = useFollowUsersStore()

const {
	userInfo
} = storeToRefs(authStore)

const setting = ref(null)
const blog = ref(null)
const shareBlog = ref(null)
const shareSetting = ref(null)
const isLoading = ref(false)
const shareDialog = ref(false)

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// アイコン設定
const formatLike = (blog) => {
	return blog.is_like ? "mdi-heart" : "mdi-heart-outline"
}
const formatComment = (count) => {
	return count > 0 ? "mdi-comment" : "mdi-comment-outline"
}
const formatBookmark = (blog) => {
	return blog.is_bookmark ? "mdi-bookmark-plus" : "mdi-bookmark-plus-outline"
}

// アイコン設定（カラー）
const colorIconPink = (flag) => {
	return flag ? "pink" : "black"
}
const colorIconPrimary = (flag) => {
	return flag ? "blue" : "black"
}

// いいね
const addLike = async (blog) => {
	if (blog.is_like) {
		await likeStore.deleteItem(blog.id)
		blog.is_like = false
		blog.like_count--
	} else {
		await likeStore.create(blog.id)
		blog.is_like = true
		blog.like_count++
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
		alert('リンクをコピーしました')
	} catch (error) {
		alert('リンクのコピーに失敗しました')
	}
}

// リブログ
const reblog = async () => {
	// キャッシュしておく
	localStorage.setItem("shareBlog", JSON.stringify(blog.value))
	localStorage.setItem("shareSetting", JSON.stringify(setting.value))

	router.push('/admin/0')
}

// コメント
const addComment = (blog) => {
}

// お気に入り登録
const addBookmark = async (blog) => {
	if (blog.is_bookmark) {
		await bookmarkStore.deleteItem(blog.id)
		blog.is_bookmark = false
	} else {
		await bookmarkStore.create(blog.id)
		blog.is_bookmark = true
	}
}

// フォロー
const followUser = async () => {
	await followUsersStore.create(blog.value.uid)
}

// フォロー外す
const deleteFollowUser = async () => {
	await followUsersStore.deleteItem(blog.value.uid)
}

// ブログデータ取得
onMounted(async () => {
	blog.value = await blogStore.getDetail(blog_id)
	setting.value = await blogSettingStore.getForUid(blog.value.uid)

	if (blog.value.share_blog_id) {
		shareBlog.value = await blogStore.getDetail(blog.value.share_blog_id)
		shareSetting.value = await blogSettingStore.getForUid(shareBlog.value.uid)
	}
	isLoading.value = true
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
