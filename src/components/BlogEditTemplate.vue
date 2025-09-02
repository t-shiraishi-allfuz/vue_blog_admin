<template>
	<v-container>
		<v-form ref="blogForm" @submit.prevent="submitPost">
			<v-card class="post-create">
				<v-card-text>
					<v-text-field
						type="text"
						label="タイトルを入力して下さい"
						v-model="blog.title" />
					<BlogCard
						v-if="shareBlog"
						class="mb-5"
						:blog="shareBlog"
						:setting="shareSetting"
					/>
					<VueEditor
						v-model="blog.content"
					/>
					<v-text-field
						type="text"
						label="記事の概要を入力して下さい"
						v-model="blog.summary" />
					<v-select
						v-if="categoryList.length > 0"
						label="カテゴリーを設定する場合は選択して下さい"
						:items="categoryList"
						item-title="name"
						item-value="id"
						v-model="blog.category_id" />
					<v-btn
						color="light-blue-lighten-4"
						label="サムネイル設定"
						variant="flat"
						v-model="selectThumb"
						prepend-icon="mdi-image"
						@click="openImageDialog('thumb')">
						サムネイル設定
					</v-btn>
					<div v-if="blog.thumbUrl" class="preview-thumb">
						<v-img :src="blog.thumbUrl" />
					</div>
					<v-switch
						label="閲覧制限の設定"
						v-model="blog.isAdult"
						hint="ブログに18歳未満の閲覧制限を付ける場合は設定して下さい"
						persistent-hint
					/>
					<v-switch
						label="公開設定"
						v-model="blog.isPublished"
						hint="オフにすると下書き保存されます"
						persistent-hint
					/>
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit">
						{{ isUpdate ? '更新する' : '投稿する' }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>
	<v-dialog v-model="imageSelectDialog" max-width="600px">
		<v-card>
			<v-card-title>アップロード済みの画像を選択</v-card-title>
			<v-card-text>
				<div class="image-gallery">
					<div v-for="image in imageList" :key="image.id" class="image-item">
						<img :src="image.url" @click="selectImage(image.url)" alt="Image" />
					</div>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-btn text @click="imageSelectDialog = false">閉じる</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted} from 'vue'
import { storeToRefs } from "pinia"
import { useBlogStore } from '@/stores/blogStore'
import { useImagesStore } from '@/stores/imagesStore'
import { useBlogCategoryStore } from '@/stores/blogCategoryStore'
import { VueEditor } from "vue3-editor"
import BlogCard from '@/components/BlogCard.vue'

const props = defineProps({
	blog: {
		type: Object,
		required: true,
	},
	shareBlog: {
		type: Object,
		required: true,
	},
	shareSetting: {
		type: Object,
		required: true,
	},
	isUpdate: {
		type: Boolean,
		required: true,
	},
})
const blog = ref(props.blog)
const shareBlog = ref(props.shareBlog)
const shareSetting = ref(props.shareSetting)
const isUpdate = ref(props.isUpdate)

const blogStore = useBlogStore()
const imagesStore = useImagesStore()
const blogCategoryStore = useBlogCategoryStore()

const {
	imageList
} = storeToRefs(imagesStore)

const {
	categoryList
} = storeToRefs(blogCategoryStore)

const imageSelectDialog = ref(false)
const selectThumb = ref(null)
const selectType = ref('content')

// 画像選択ダイアログ表示
const openImageDialog = (type) => {
	selectType.value = type
	imageSelectDialog.value = true
}

// 画像を選択
const selectImage = (imageUrl) => {
	imageSelectDialog.value = false

	if (selectType.value == 'content') {
	} else {
		selectThumb.value = imageUrl
		blog.value.thumbUrl = imageUrl
	}
}

const submitPost = async () => {
	console.log(blog.value)
	if (!blog.value.title || !blog.value.content) {
		alert("タイトルまたは本文が入力されていません");
		return;
	}

	try {
		if (isUpdate.value) {
			await blogStore.update(blog.value)
		} else {
			blog.value.share_blog_id = shareBlog.value ? shareBlog.value.id : null
			await blogStore.create(blog.value)
		}

		if (blog.value.isPublished) {
			if (isUpdate.value) {
				alert("ブログが更新されました")
			} else {
				alert("ブログが投稿されました")
			}
		} else {
			alert("下書き保存されました")
		}
	} catch (error) {
		alert(error)
	}
}

watch(blog.value.category_id, (newValue) => {
	blog.value.category_id = newValue
})

onMounted(async() => {
	await blogCategoryStore.getList()
	await imagesStore.getList(null)
})
</script>

<style scoped lang="scss">
	.image-gallery {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.image-item img {
		width: 100px;
		height: 100px;
		object-fit: cover;
		cursor: pointer;
		border: 2px solid #ccc;
		border-radius: 8px;
		transition: transform 0.3s ease;
	}
	.image-item img:hover {
		transform: scale(1.1);
	}
	.preview-thumb {
		width: 20%;
		height: auto;
		margin: 10px 0;
		object-fit: cover;
	}
</style>
