<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="アップロード済みの画像を選択"
		v-model:dialog="isImageSelectDialog"
	>
		<template v-slot:contents>
			<v-card-text>
				<v-toolbar flat>
					<v-spacer></v-spacer>
					<v-select
						v-if="extendedFolderList.length > 0"
						label="画像フォルダ選択"
						:items="extendedFolderList"
						item-title="name"
						item-value="id"
						v-model="selectedFolderId"
						hide-details
					/>
				</v-toolbar>
				<div class="fileBox">
					<ul class="image-list" v-if="extendedImageList.length > 0">
						<li class="thumbnail" v-for="(image, index) in extendedImageList" :key="index">
							<div class="image-gallery">
								<span class="image-item">
									<img :src="image.url" @click="selectImage(image.url)" alt="Image" />
								</span>
							</div>
						</li>
					</ul>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-btn
					color="grey-lighten-4"
					variant="elevated"
					@click="closeDialog"
				>
					閉じる
				</v-btn>
			</v-card-actions>
		</template>
	</DialogTemplate>

	<v-container>
		<v-form ref="blogForm" @submit.prevent="submitPost">
			<v-card class="post-create">
				<v-card-text>
					<v-text-field
						type="text"
						label="タイトルを入力して下さい"
						v-model="blog.title" />
					<BlogCard
						v-if="props.shareBlog"
						class="mb-5"
						:blog="props.shareBlog as any"
						:setting="props.shareSetting as any"
					/>
					<VueEditor
						v-model="blog.content"
						:editorOptions="editorOptions"
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
						color="success"
						label="サムネイル設定"
						variant="flat"
						v-model="blog.thumbUrl"
						prepend-icon="mdi-image"
						@click="openImageDialog('thumb')">
						サムネイル設定
					</v-btn>
					<div v-if="blog.thumbUrl" class="preview-thumb">
						<v-img :src="blog.thumbUrl" />
					</div>
					<v-text-field
						class="py-4"
						type="password"
						label="パスワード（任意）"
						v-model="blog.password"
						hint="パスワードを設定すると、このブログを閲覧する際にパスワードが必要になります"
						persistent-hint
						clearable
					/>
					<v-switch
						label="閲覧制限の設定"
						v-model="blog.isAdult"
						hint="ブログに18歳未満の閲覧制限を付ける場合は設定して下さい。閲覧制限ありの場合は、1投稿につき10コイン必要です"
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
					<v-btn color="success" variant="flat" type="submit">
						{{ props.isUpdate ? '更新する' : '投稿する' }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useBlogStore } from '@/stores/blogStore'
import { useImagesStore } from '@/stores/imagesStore'
import { useImagesFolderStore } from '@/stores/imagesFolderStore'
import { useBlogCategoryStore } from '@/stores/blogCategoryStore'
import { useCoinStore } from '@/stores/coinStore'
import { VueEditor } from "vue3-editor"
import Swal from 'sweetalert2'

// 型定義
interface BlogData {
	id?: string
	uid?: string
	title: string
	summary: string
	content: string
	category_id?: string | null
	isAdult: boolean
	isPublished: boolean
	thumbUrl?: string | null
	share_blog_id?: string | null
	viewCount?: number
	createdAt?: Date | null
	updatedAt?: Date | null
	password?: string | null
	[key: string]: any
}

interface SettingData {
	name: string
	profileUrl?: string | null
	[key: string]: any
}

interface Props {
	blog: BlogData
	shareBlog?: BlogData | null
	shareSetting?: SettingData | null
	isUpdate: boolean
}

const props = defineProps<Props>()
const blog = ref<BlogData>(props.blog)

const blogStore = useBlogStore()
const imagesStore = useImagesStore()
const imagesFolderStore = useImagesFolderStore()
const blogCategoryStore = useBlogCategoryStore()
const coinStore = useCoinStore()

const {
	imageList
} = storeToRefs(imagesStore)

const {
	folderList
} = storeToRefs(imagesFolderStore)

const {
	categoryList
} = storeToRefs(blogCategoryStore)

const isImageSelectDialog = ref<boolean>(false)
const selectType = ref<string>('content')
const defaultSelect = ref<{id: string | null, name: string}>({id: null, name: '指定なし'})
const selectedFolderId = ref<string | null>(null)
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

let quillEditor: any = null
let cursorPosition: number | null = null

const editorOptions = ref({
	theme: 'snow',
	modules: {
		toolbar: {
			container: [
				[{ 'header': [1, 2, 3, false] }],
				[{ 'font': [] }, {'size': ['small', false, 'large', 'huge'] }],
				['bold', 'italic', 'underline'],
				['image'],
				[{ 'color': [] }, { 'background': [] }],
			],
			handlers: {
				image: function (this: any) {
					quillEditor = this.quill
					cursorPosition = quillEditor.getSelection().index
					openImageDialog('content')
				}
			}
		},
	}
})

// フォルダリストにデフォルト値を追加
const extendedFolderList = computed(() => {
	return [defaultSelect.value, ...folderList.value]
})

watch(selectedFolderId, async (_newId) => {
	await fetchImageList()
})

const extendedImageList = computed(() => {
	return imageList.value || []
})

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
}

// 画像選択ダイアログ表示
const openImageDialog = (type: string): void => {
	selectType.value = type
	isImageSelectDialog.value = true
}

// 画像を選択
const selectImage = (imageUrl: string): void => {
	closeDialog()

	if (selectType.value == 'content') {
		if (quillEditor && cursorPosition !== null) {
			quillEditor.insertEmbed(cursorPosition, 'image', imageUrl)
			quillEditor.setSelection(cursorPosition + 1)
		}
	} else {
		blog.value.thumbUrl = imageUrl
	}
}

const BLOG_POST_COST = 10

const submitPost = async () => {
	if (!blog.value.title || !blog.value.content) {
		await Swal.fire({
			title: 'エラー',
			text: 'タイトルまたは本文が入力されていません',
			icon: 'error'
		})
		return
	}

	// 閲覧制限付き投稿時のみコインチェック
	if (blog.value.isAdult && !props.isUpdate) {
		if (!coinStore.hasEnoughCoins(BLOG_POST_COST)) {
			await Swal.fire({
				title: 'コインが不足しています',
				text: `閲覧制限付きの投稿には${BLOG_POST_COST}コイン必要です。チャージしてください。`,
				icon: 'warning',
				confirmButtonColor: '#27C1A3'
			})
			return
		}
	}

	try {
		if (props.isUpdate) {
			await blogStore.update(blog.value as any)
		} else {
			blog.value.share_blog_id = props.shareBlog ? props.shareBlog.id : null
			await blogStore.create(blog.value as any)
		}

		// 閲覧制限付きの場合のみコイン消費
		if (blog.value.isAdult && !props.isUpdate) {
			try {
				const consumed = await coinStore.consumeCoins(BLOG_POST_COST)
				if (!consumed) {
					await Swal.fire({
						title: 'コイン消費に失敗しました',
						text: `閲覧制限付きの投稿には${BLOG_POST_COST}コイン必要です。チャージしてください。`,
						icon: 'warning',
						confirmButtonColor: '#27C1A3'
					})
					return
				}
			} catch (err) {
				console.error('コイン消費エラー:', err)
				await Swal.fire({
					title: 'エラー',
					text: 'コインの消費に失敗しました。再度お試しください。',
					icon: 'error',
					confirmButtonColor: '#d33'
				})
				return
			}
		}

		if (blog.value.isPublished) {
			if (props.isUpdate) {
				await Swal.fire({
					title: '成功',
					text: 'ブログが更新されました',
					icon: 'success',
					timer: 1500,
					showConfirmButton: false
				})
			} else {
				await Swal.fire({
					title: '成功',
					text: 'ブログが投稿されました',
					icon: 'success',
					timer: 1500,
					showConfirmButton: false
				})
			}
		} else {
			await Swal.fire({
				title: '成功',
				text: '下書き保存されました',
				icon: 'success',
				timer: 1500,
				showConfirmButton: false
			})
		}
	} catch (error) {
		console.error('ブログ投稿エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: 'ブログの投稿に失敗しました',
			icon: 'error'
		})
	}
}

// データ再取得
const fetchImageList = async () => {
	await imagesStore.getList(selectedFolderId.value)
}

onMounted(async() => {
	await blogCategoryStore.getList()
	await fetchImageList()
	await imagesFolderStore.getList()
	await coinStore.getCoins()
})
</script>

<style scoped lang="scss">
	.fileBox {
		padding-top: 16px;
		clear: both;
	}
	ul.image-list{
		width: 100%;
		overflow: hidden;
		border: 1px solid #ddd;
		background: #f9f9f9;
		margin: 0;
		padding: 5px;
		text-align: center;

		li.thumbnail {
			margin: 4px;
			float: left;
		}
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
