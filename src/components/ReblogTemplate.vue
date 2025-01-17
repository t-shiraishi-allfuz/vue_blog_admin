<template>
	<v-dialog v-model="openDialog" max-width="800px" scrollable>
		<v-card class="post-create">
			<v-card-text style="height: 400px">
				<BlogEditTemplate
					:blog="reblog"
					:shareBlog="blog"
					:shareSetting="setting"
					:isUpdate="false"
				/>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue';
import { useBlogStore } from '@/stores/blogStore';
import BlogEditTemplate from '@/components/BlogEditTemplate';

const props = defineProps({
	blog: {
		type: Object,
		required: true,
	},
	setting: {
		type: Object,
		required: true,
	}
});
const blog = ref(props.blog);
const setting = ref(props.setting);

const blogStore = useBlogStore();
const reblog = blogStore.tempBlog;

const openDialog = ref(false);

onMounted(() => {
	openDialog.value = true;
})
</script>

<style scoped lang="scss">
</style>
