<template>
	<v-tabs v-model="activeTab">
		<v-tab v-for="(tab, index) in tabs" :key="index">{{ tab }}</v-tab>
	</v-tabs>
	<v-window v-model="activeTab">
		<v-window-item
			v-for="(component, index) in tabComponents"
			:key="index"
			transition="none"
			reverse-transition="none"
		>
			<component :is="component" />
		</v-window-item>
	</v-window>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BlogCreate from '@/views/admin/BlogCreate.vue'
import BlogList from '@/views/admin/BlogList.vue'
import PostImageList from '@/views/admin/PostImageList.vue'
import SettingList from '@/views/admin/SettingList.vue'

const route = useRoute()
const activeTab = ref(0)

const tabs = ['記事を書く', '記事一覧', '画像一覧', '設定']
const tabComponents = [
	BlogCreate,
	BlogList,
	PostImageList,
	SettingList
]

onMounted(() => {
	const tab = route.query.tab
	if (tab !== undefined) {
		activeTab.value = parseInt(tab)
	}
})
</script>
