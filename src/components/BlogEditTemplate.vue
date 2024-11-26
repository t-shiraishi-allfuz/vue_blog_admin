<template>
	<v-container>
		<v-form ref="blogForm" @submit.prevent="submitPost">
			<v-card class="post-create">
				<v-card-text>
					<v-text-field
						type="text"
						label="タイトルを入力して下さい"
						v-model="blog.title" />
					<quill-editor
						class="custom-quill-editor"
						v-model:value="blog.content"
						:options="editorOptions"
						ref="quillEditor" />
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
						v-model="blog.category_id"
						hide-details />
					<v-switch
						label="公開設定"
						v-model="blog.isPublished"
						hide-details />
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
import { ref, defineProps, computed, watch, onMounted } from 'vue';
import { useBlogStore } from '@/stores/blogStore';
import { useImagesStore } from '@/stores/imagesStore';
import { useBlogCategoryStore } from '@/stores/blogCategoryStore';

const props = defineProps({
	id: {
		type: String,
		required: true,
	},
	blog: {
		type: Object,
		required: true,
	},
	isUpdate: {
		type: Boolean,
		required: true,
	},
});
const blog_id = ref(props.id);
const blog = ref(props.blog);
const isUpdate = ref(props.isUpdate);
console.log(blog.value);

const blogStore = useBlogStore();
const imagesStore = useImagesStore();
const blogCategoryStore = useBlogCategoryStore();
const categoryList = computed(() => blogCategoryStore.categoryList);

const imageList = ref([]);
const imageSelectDialog = ref(false);
const quill = ref(null);

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
				image: async function () {
					quill.value = this.quill;
					await fetchImageList();
				}
			}
		},
	}
});

// 画像一覧取得
const fetchImageList = async () => {
	try {
		imageList.value = await imagesStore.getList(null);
		imageSelectDialog.value = true;
	} catch (error) {
		alert(error);
	}
}

// 画像を選択
const selectImage = (imageUrl) => {
	const range = quill.value.getSelection();
	quill.value.insertEmbed(range.index, 'image', imageUrl);
	quill.value.setSelection(range.index + 1);
	imageSelectDialog.value = false;
}

const submitPost = async () => {
	if (!blog.value.title || !blog.value.content) {
		alert("タイトルまたは本文が入力されていません");
		return;
	}

	try {
		if (isUpdate.value) {
			await blogStore.update(blog.value, blog_id.value);
		} else {
			await blogStore.create(blog.value);
		}

		if (blog.value.isPublished) {
			if (isUpdate.value) {
				alert("ブログが更新されました");
			} else {
				alert("ブログが投稿されました");
			}
		} else {
			alert("下書き保存されました");
		}
	} catch (error) {
		alert(error);
	}
};

watch(blog.value.category_id, (newValue) => {
	blog.value.category_id = newValue;
});

onMounted(async() => {
	try {
		categoryList.value = await blogCategoryStore.getList();
	} catch (error) {
		alert(error);
	}
})
</script>

<style scoped lang="scss">
	.custom-quill-editor {
		margin-bottom: 10px;
	}
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
</style>
