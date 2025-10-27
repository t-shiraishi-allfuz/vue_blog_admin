<template>
	<v-container>
		<v-row v-if="loading">
			<v-col cols="12" class="text-center">
				<v-progress-circular
					indeterminate
					color="success"
					size="64"
				/>
				<p class="mt-4 text-body-1">お知らせを読み込み中...</p>
			</v-col>
		</v-row>

		<v-row v-else-if="!announcement">
			<v-col cols="12">
				<v-card>
					<v-card-text class="text-center py-8">
						<v-icon size="64" color="error">mdi-alert-circle</v-icon>
						<p class="text-h6 mt-4 text-grey">お知らせが見つかりません</p>
						<p class="text-body-2 text-grey">指定されたお知らせは存在しないか、削除された可能性があります。</p>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<v-row v-else>
			<v-col cols="12" md="8" offset-md="2">
				<v-card>
					<v-card-title class="d-flex align-center">
						<v-chip
							:color="getPriorityColor(announcement.priority)"
							size="small"
							variant="tonal"
							class="mr-3"
						>
							{{ getPriorityText(announcement.priority) }}
						</v-chip>
						<span class="text-h4">{{ announcement.title }}</span>
					</v-card-title>

					<v-card-subtitle class="d-flex align-center">
						<v-icon size="16" class="mr-1">mdi-calendar</v-icon>
						{{ formatDate(announcement.createdAt) }}
						<v-spacer />
						<v-chip
							v-if="!announcement.isRead"
							size="small"
							color="red"
							variant="tonal"
						>
							<v-icon size="12" class="mr-1">mdi-circle</v-icon>
							未読
						</v-chip>
					</v-card-subtitle>

					<v-divider />

					<v-card-text class="py-6">
						<div class="announcement-content">
							{{ announcement.content }}
						</div>
					</v-card-text>

					<v-card-actions>
						<v-spacer />
						<v-btn
							v-if="!announcement.isRead"
							color="success"
							variant="elevated"
							prepend-icon="mdi-check"
							@click="markAsRead"
							:loading="markingAsRead"
						>
							既読にする
						</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup lang="ts">
import { useAnnouncementStore } from '@/stores/announcementStore'

const route = useRoute()
const announcementStore = useAnnouncementStore()
const { announcements } = storeToRefs(announcementStore)

const loading = ref<boolean>(false)
const markingAsRead = ref<boolean>(false)

// 現在のお知らせを取得
const announcement = computed(() => {
	const announcementId = route.params.id as string
	return announcements.value.find(a => a.id === announcementId)
})

// お知らせ一覧を読み込み
const loadAnnouncements = async (): Promise<void> => {
	loading.value = true
	try {
		await announcementStore.getPublicList()
	} catch (error) {
		console.error('お知らせ一覧取得エラー:', error)
		alert('お知らせの取得に失敗しました')
	} finally {
		loading.value = false
	}
}

// 既読にする
const markAsRead = async (): Promise<void> => {
	if (!announcement.value) return
	
	markingAsRead.value = true
	try {
		await announcementStore.markAnnouncementAsRead(announcement.value.id)
	} catch (error) {
		console.error('既読更新エラー:', error)
		alert('既読の更新に失敗しました')
	} finally {
		markingAsRead.value = false
	}
}

// 優先度の色を取得
const getPriorityColor = (priority: string): string => {
	const colors = {
		low: 'grey',
		normal: 'blue',
		high: 'orange',
		urgent: 'red'
	}
	return colors[priority as keyof typeof colors] || 'grey'
}

// 優先度のテキストを取得
const getPriorityText = (priority: string): string => {
	const texts = {
		low: '低',
		normal: '通常',
		high: '高',
		urgent: '緊急'
	}
	return texts[priority as keyof typeof texts] || '通常'
}

// 日付をフォーマット
const formatDate = (date: any): string => {
	if (!date) return ''
	const d = date.toDate ? date.toDate() : new Date(date)
	return d.toLocaleString('ja-JP', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
}

onMounted(async (): Promise<void> => {
	await loadAnnouncements()
})
</script>

<style scoped>
.announcement-content {
	font-size: 1.1rem;
	line-height: 1.8;
	white-space: pre-wrap;
	word-wrap: break-word;
}

.v-card {
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.v-progress-circular {
	margin: 0 auto;
}
</style>
