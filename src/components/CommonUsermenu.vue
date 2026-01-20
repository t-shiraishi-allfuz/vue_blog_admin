<template>
	<v-list>
		<v-list-item
			v-if="setting"
			:prepend-avatar="setting.profileUrl"
			:title="setting.title"
			:subtitle="setting.description" />
		<v-divider></v-divider>
		<v-list-item prepend-icon="mdi-note" title="つぶやき投稿" value="tweet" @click="openTweetDialog" />
		<v-list-item prepend-icon="mdi-note-multiple" title="モーメント作成" value="moment_create" @click="goToMomentCreate" />
		<v-list-item prepend-icon="mdi-message-text" title="メッセージ" value="dm" @click="goToDmPage">
			<template #append>
				<v-badge
					:content="dmUnreadCount"
					:model-value="dmUnreadCount > 0"
					color="error"
					dot
				/>
			</template>
		</v-list-item>
		<v-list-item prepend-icon="mdi-robot" title="AIトーク" value="ai_talk" @click="goToAiTalk" />
		<v-list-item prepend-icon="mdi-bulletin-board" title="掲示板" value="board" @click="goToBoard" />
		<v-list-item title="チャージ" value="charge" @click="goToCharge">
			<template #prepend>
				<img
					src="@/assets/images/img_coin.png"
					alt="コイン"
					class="img-coin"
				/>
			</template>
		</v-list-item>
		<v-list-item prepend-icon="mdi-account" title="プロフィール" value="profile" @click="goToUserProfile" />
		<v-list-item prepend-icon="mdi-email" title="お問い合わせ" value="contact" @click="goToContact" />
		<v-list-item prepend-icon="mdi-cog" title="設定" value="setting" @click="goToProfile" />
	</v-list>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useDmStore } from '@/stores/dmStore'

// 型定義
interface SettingData {
	title: string
	description: string
	profileUrl: string
	[key: string]: any
}

// Props定義
interface Props {
	setting: SettingData
}

defineProps<Props>()

// Emits定義
interface Emits {
	openTweetDialog: []
}

const emit = defineEmits<Emits>()

const router = useRouter()
const authStore = useAuthStore()
const dmStore = useDmStore()

// DM未読数を取得
const dmUnreadCount = computed(() => dmStore.unreadDmCount)

const openTweetDialog = (): void => {
	emit('openTweetDialog')
}

const goToUserProfile = (): void => {
	if (authStore.userInfo?.uid) {
		router.push({path: '/user_profile', query: { uid: authStore.userInfo.uid }})
	}
}

const goToProfile = (): void => {
	router.push({path: '/admin'})
}

const goToMomentCreate = (): void => {
	router.push({path: '/admin/moment_create'})
}

const goToDmPage = (): void => {
	router.push({path: '/dm'})
}

const goToAiTalk = (): void => {
	router.push({ path: '/ai-talk' })
}

const goToCharge = (): void => {
	router.push({ path: '/charge' })
}

const goToBoard = (): void => {
	router.push({ path: '/board' })
}

const goToContact = (): void => {
	router.push({ path: '/contact' })
}
</script>

<style scoped>
.img-coin {
	width: 20px;
	height: 20px;
	object-fit: contain;
	margin-right: 32px; /* 他のメニューのアイコン余白に合わせる */
}
</style>
