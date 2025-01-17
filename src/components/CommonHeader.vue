<template>
	<v-app-bar color="primary" light>
		<template v-slot:prepend>
			<v-app-bar-nav-icon>
				<v-icon :icon="mdiHomeCircle" @click="goToHome" />
			</v-app-bar-nav-icon>
		</template>
		<v-app-bar-title>
			<v-text-field
				:loading="loading"
				label="キーワードやクリエイターで検索"
				v-model="search"
				:append-inner-icon="mdiMagnify"
				single-line
				hide-details />
		</v-app-bar-title>
		<template v-slot:append>
			<div v-if="setting">
				<v-menu>
					<template v-slot:activator="{ props }">
						<v-avatar v-bind="props" :image="setting.profileUrl" size="48" end />
					</template>
					<CommonUsermenu :setting="setting" />
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useBlogStore } from '@/stores/blogStore';
import { useBlogSettingStore } from '@/stores/blogSettingStore';
import { mdiMagnify, mdiHomeCircle } from '@mdi/js';
import CommonUsermenu from '@/components/CommonUsermenu';

const router = useRouter();
const authStore = useAuthStore();
const blogStore = useBlogStore();
const blogSettingStore = useBlogSettingStore();

const search = ref('');
const setting = computed(() => blogSettingStore.blogSetting); 

const logout = async () => {
	try {
		await authStore.logout();
		router.push('/');
	} catch (error) {
		alert(error);
	}
}

const goToHome = () => {
	blogStore.setSelectType(0);
	router.push('/');
}
</script>

<style scoped>
</style>
