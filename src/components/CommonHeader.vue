<template>
	<v-app-bar color="primary" light>
		<template v-slot:prepend>
			<v-app-bar-nav-icon>
				<v-icon icon="mdi-home-circle" @click="goToHome" />
			</v-app-bar-nav-icon>
		</template>
		<v-app-bar-title>
			<v-text-field
				label="キーワードやクリエイターで検索"
				v-model="search"
				append-inner-icon="mdi-magnify"
				single-line
				hide-details
			/>
		</v-app-bar-title>
		<template v-slot:append>
			<div v-if="blogSetting">
				<v-menu>
					<template v-slot:activator="{ props }">
						<v-avatar v-bind="props" :image="blogSetting.profileUrl" size="48" end />
					</template>
					<CommonUsermenu :setting="blogSetting" />
				</v-menu>
				<v-btn text @click="logout">ログアウト</v-btn>
			</div>
			<div v-else>
				<v-btn text to="/user_login">ログイン</v-btn>
				<v-btn text to="/user_create">登録</v-btn>
			</div>
		</template>
	</v-app-bar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import CommonUsermenu from '@/components/CommonUsermenu.vue'

const router = useRouter()

const authStore = useAuthStore()
const blogStore = useBlogStore()
const blogSettingStore = useBlogSettingStore()
const {
	blogSetting
} = storeToRefs(blogSettingStore)

const search = ref('')

onMounted(async () => {
	await blogSettingStore.getDetail()
})

const logout = async () => {
	await authStore.logout()
	router.push({path: '/'})
}

const goToHome = () => {
	blogStore.setSelectType(0)
	router.push({path: '/'})
}
</script>

<style scoped>
</style>
