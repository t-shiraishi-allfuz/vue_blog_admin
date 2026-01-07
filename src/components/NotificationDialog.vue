<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="インフォメーション"
		v-model:dialog="dialog"
	>
		<template v-slot:contents>	
			<v-card-text class="pa-0">
				<v-tabs v-model="activeTab" color="primary" align-tabs="center">
					<v-tab value="notifications">
						<v-badge
							:content="unreadNotificationCount"
							:model-value="unreadNotificationCount > 0"
							color="error"
							inline
						>
							通知
						</v-badge>
					</v-tab>
					<v-tab value="announcements">
						<v-badge
							:content="unreadAnnouncementCount"
							:model-value="unreadAnnouncementCount > 0"
							color="error"
							inline
						>
							お知らせ
						</v-badge>
					</v-tab>
				</v-tabs>
				<v-tabs-window v-model="activeTab">
					<v-tabs-window-item value="notifications">
						<div class="notification-content">
							<div v-if="notifications.length === 0" class="text-center pa-8">
								<p class="text-grey mt-4">通知はありません</p>
							</div>
							<div v-else>
								<v-list>
								<v-list-item
									v-for="notification in notifications"
									:key="notification.id"
									:class="{ 'bg-grey-lighten-5': !notification.isRead }"
									@click="goToUserProfile(notification.relatedData?.actorUserId)"
									class="cursor-pointer"
								>
										<template #prepend>
											<v-avatar size="40" color="primary" class="mr-3">
												<v-icon :color="getNotificationIconColor(notification.type)">
													{{ getNotificationIcon(notification.type) }}
												</v-icon>
											</v-avatar>
										</template>
										
										<v-list-item-title class="font-weight-medium">
											{{ notification.title }}
										</v-list-item-title>
										
										<v-list-item-subtitle class="mt-1">
											{{ notification.message }}
										</v-list-item-subtitle>
										
										<template #append>
											<div class="text-caption text-grey">
												{{ formatDate(notification.createdAt) }}
											</div>
										</template>
									</v-list-item>
								</v-list>
							</div>
						</div>
					</v-tabs-window-item>
					
					<v-tabs-window-item value="announcements">
						<div class="notification-content">
							<div v-if="announcements.length === 0" class="text-center pa-8">
								<p class="text-grey mt-4">お知らせはありません</p>
							</div>
							<div v-else>
								<v-list>
									<v-list-item
										v-for="announcement in announcements"
										:key="announcement.id"
										:class="{ 'bg-grey-lighten-5': !announcement.isRead }"
										@click="goToAnnouncementDetail(announcement)"
										class="cursor-pointer"
									>
										<template #prepend>
											<v-avatar size="40" color="info" class="mr-3">
												<v-icon color="white">mdi-information</v-icon>
											</v-avatar>
										</template>
										
										<v-list-item-title class="font-weight-medium">
											{{ announcement.title }}
										</v-list-item-title>
										
										<v-list-item-subtitle class="mt-1">
											{{ announcement.content }}
										</v-list-item-subtitle>
										
										<template #append>
											<div class="text-caption text-grey">
												{{ formatDate(announcement.createdAt) }}
											</div>
										</template>
									</v-list-item>
								</v-list>
							</div>
						</div>
					</v-tabs-window-item>
				</v-tabs-window>
			</v-card-text>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notificationStore'
import { useAnnouncementStore } from '@/stores/announcementStore'

// 型定義
interface NotificationData {
	id: string
	type: string
	title: string
	message: string
	isRead: boolean
	createdAt: Date
	relatedData?: any
	[key: string]: any
}

interface AnnouncementData {
	id: string
	title: string
	content: string
	isRead: boolean
	createdAt: Date
	[key: string]: any
}

const dialog = defineModel<boolean>('dialog')

const notificationStore = useNotificationStore()
const announcementStore = useAnnouncementStore()
const router = useRouter()

const activeTab = computed({
	get: (): string => notificationStore.activeTab,
	set: (value: string): void => notificationStore.setActiveTab(value)
})

const notifications = computed((): NotificationData[] => notificationStore.notifications)
const announcements = computed((): AnnouncementData[] => announcementStore.announcements)
const unreadNotificationCount = computed((): number => notificationStore.unreadNotificationCount)
const unreadAnnouncementCount = computed((): number => announcementStore.unreadAnnouncementCount || 0)
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
}

// ユーザープロフィールに遷移
const goToUserProfile = (userId: string): void => {
	if (userId) {
		router.push({ path: '/user_profile', query: { uid: userId } })
		closeDialog()
	}
}

// お知らせ詳細ページに遷移
const goToAnnouncementDetail = async (announcement: AnnouncementData): Promise<void> => {
	// 未読の場合は既読にする
	if (!announcement.isRead) {
		try {
			await announcementStore.markAnnouncementAsRead(announcement.id)
		} catch (error: any) {
			console.error('お知らせ既読エラー:', error)
		}
	}
	
	// お知らせ詳細ページに遷移
	router.push({ name: 'AnnouncementDetail', params: { id: announcement.id } })
	closeDialog()
}

const getNotificationIcon = (type: string): string => {
	switch (type) {
		case 'like':
			return 'mdi-heart'
		case 'comment':
			return 'mdi-comment'
		case 'follow':
			return 'mdi-account-plus'
		default:
			return 'mdi-bell'
	}
}

const getNotificationIconColor = (type: string): string => {
	switch (type) {
		case 'like':
			return 'red'
		case 'comment':
			return 'blue'
		case 'follow':
			return 'green'
		default:
			return 'primary'
	}
}

const formatDate = (date: Date): string => {
	if (!date) return ''
	
	const now = new Date()
	const notificationDate = (date as any).toDate ? (date as any).toDate() : new Date(date)
	const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60))
	
	if (diffInMinutes < 1) {
		return 'たった今'
	} else if (diffInMinutes < 60) {
		return `${diffInMinutes}分前`
	} else if (diffInMinutes < 1440) {
		const hours = Math.floor(diffInMinutes / 60)
		return `${hours}時間前`
	} else {
		const days = Math.floor(diffInMinutes / 1440)
		return `${days}日前`
	}
}
</script>

<style scoped>
.notification-content {
	max-height: 400px;
	overflow-y: auto;
}

.v-list-item {
	border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item:last-child {
	border-bottom: none;
}

.cursor-pointer {
	cursor: pointer;
}

.cursor-pointer:hover {
	background-color: rgba(0, 0, 0, 0.04);
}
</style>
