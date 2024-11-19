<template>
	<v-app-bar color="primary" light>
		<v-app-bar-title>{{ blogSettingStore.blogSetting.title }}</v-app-bar-title>
		<template v-slot:prepend>
			<v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
		</template>
		<template v-slot:append>
			<div v-if="authStore.user">
				<v-btn text @click="logout">ログアウト</v-btn>
			</div>
			<div v-else>
				<v-btn text to="/user_login">ログイン</v-btn>
				<v-btn text to="/user_create">登録</v-btn>
			</div>
		</template>
	</v-app-bar>
	<CommonSidemenu :drawer="drawer" @update:drawer="drawer = $event" />
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useBlogSettingStore } from '@/stores/blogSettingStore';
import CommonSidemenu from '@/components/CommonSidemenu';

const drawer = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const blogSettingStore = useBlogSettingStore();

const logout = async () => {
	try {
		await authStore.logout();
		router.push('/user_login');
	} catch (error) {
		alert(error);
	}
}
</script>
