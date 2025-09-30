<template>
	<v-list>
		<v-list-item
			v-if="setting"
			:prepend-avatar="setting.profileUrl"
			:title="setting.title"
			:subtitle="setting.description" />
		<v-divider></v-divider>
		<v-list-item prepend-icon="mdi-account" title="プロフィール" value="profile" @click="goToUserProfile" />
		<v-list-item prepend-icon="mdi-cog" title="設定" value="setting" @click="goToProfile" />
	</v-list>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const props = defineProps({
	setting: {
		type: Object,
		required: true,
	}
})
const setting = ref(props.setting)

const goToUserProfile = () => {
	if (authStore.userInfo?.uid) {
		router.push({path: '/user_profile', query: { uid: authStore.userInfo.uid }})
	}
}

const goToProfile = () => {
	router.push({path: '/admin'})
}

</script>
