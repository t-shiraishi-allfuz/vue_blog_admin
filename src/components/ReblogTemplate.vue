<template>
	<v-dialog v-model="openDialog" max-width="800px" scrollable>
		<v-card class="post-create">
			<v-card-text style="height: 400px">
				<BlogEditTemplate
					:blog="reblog as any"
					:shareBlog="blog as any"
					:shareSetting="setting as any"
					:isUpdate="false"
				/>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { useBlogStore } from '@/stores/blogStore'

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
	setting: SettingData
}

const props = defineProps<Props>()
const blog = ref<BlogData>(props.blog)
const setting = ref<SettingData>(props.setting)

const blogStore = useBlogStore()
const reblog = blogStore.tempBlog

const openDialog = ref<boolean>(false)

onMounted((): void => {
	openDialog.value = true
})
</script>

<style scoped lang="scss">
</style>
