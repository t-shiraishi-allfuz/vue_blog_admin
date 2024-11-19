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
					<v-switch
						label="公開設定"
						v-model="blog.isPublished"
						hide-details />
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit">投稿する</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useBlogStore } from '@/stores/blogStore';
import { useImagesStore } from '@/stores/imagesStore';

const imagesStore = useImagesStore();
const blogStore = useBlogStore();

const blog = ref({
	uid: null,
	title: "",
	summary: "",
	content: "",
	isPublished: false,
	createdAt: null,
	updatedAt: null
});

const editorOptions = ref({
	theme: 'snow',
	modules: {
		toolbar: {
			container: [
				[{ 'header': [1, 2, 3, false] }],
				[{ 'font': [] }, {'size': ['small', false, 'large', 'huge'] }],
				['bold', 'italic', 'underline'],
				['link', 'image', 'video'],
				[{ 'color': [] }, { 'background': [] }],
			],
			handlers: {
				image: async function () {
					const fileInput = document.createElement('input');
					fileInput.setAttribute('type', 'file');
					fileInput.setAttribute('accept', 'image/*');
					fileInput.click();

					fileInput.onchange = async () => {
						const file = fileInput.files[0];
						if (file) {
							const url = await submitImage(file);
							if (url) {
								const range = this.quill.getSelection();
								this.quill.insertEmbed(range.index, 'image', url);
								this.quill.setSelection(range.index + 1);
							}
						}
					}
				}
			}
		},
	}
});

// 画像をサーバーにアップロードする処理
const submitImage = async (file) => {
	try {
		const url = await imagesStore.create(file);
		return url;
	} catch (error) {
		alert(error);
	}
};

const submitPost = async () => {
	if (!blog.value.title || !blog.value.content) {
		alert("タイトルまたは本文が入力されていません");
		return;
	}

	try {
		await blogStore.create(blog.value);

		if (blog.value.isPublished) {
			alert("ブログが投稿されました");
		} else {
			alert("下書き保存されました");
		}
	} catch (error) {
		alert("ブログ投稿に失敗しました");
	}
};
</script>

<style scoped lang="scss">
	.custom-quill-editor {
		margin: 10px 0;
	}
</style>
