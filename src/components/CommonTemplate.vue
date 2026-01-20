<template>
	<v-app>
		<CommonHeader />
		<v-main>
			<v-container fluid>
				<v-row>
					<v-col v-if="showSidebar" cols="2" class="sidebar-wrapper">
						<CommonSidemenu />
					</v-col>
					<v-col :class="showSidebar ? 'main-content' : 'main-content-full'">
						<router-view />
					</v-col>
				</v-row>
			</v-container>
		</v-main>
	</v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// サイドメニューを非表示にするルート
const hideSidebarRoutes = ['/dm', '/ai-talk', '/board', '/charge', '/contact', '/user_profile']

// サイドメニューの表示/非表示を判定
const showSidebar = computed(() => {
	// お知らせ画面（/announcements/:id）をチェック
	if (route.path.startsWith('/announcements')) {
		return false
	}
	return !hideSidebarRoutes.includes(route.path)
})
</script>

<style scoped>
	.sidebar-wrapper {
		position: fixed;
		top: 64px;
		left: 0;
		width: 25%;
		height: calc(100vh - 64px);
		overflow-y: auto;
		box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
	}
	.main-content {
		margin-left: 18%;
		padding: 16px;
	}
	.main-content-full {
		margin-left: 0;
		padding: 16px;
	}
</style>
