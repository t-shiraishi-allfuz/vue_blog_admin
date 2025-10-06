<template>
	<v-container fluid>
		<v-row>
			<v-col cols="12">
				<h1 class="text-h4 mb-6 d-flex align-center">
					<v-icon class="mr-3">mdi-twitter</v-icon>
					つぶやき一覧
				</h1>
			</v-col>
		</v-row>
		
		<v-row>
			<v-col cols="12">
				<v-tabs v-model="selectType" @update:model-value="onTabChange">
					<v-tab value="0">
						<v-icon class="mr-2">mdi-earth</v-icon>
						すべて
					</v-tab>
					<v-tab value="1">
						<v-icon class="mr-2">mdi-bookmark</v-icon>
						お気に入り
					</v-tab>
					<v-tab value="2">
						<v-icon class="mr-2">mdi-account</v-icon>
						マイつぶやき
					</v-tab>
				</v-tabs>
			</v-col>
		</v-row>
		
		<v-row v-if="loading" class="justify-center">
			<v-col cols="12" class="text-center">
				<v-progress-circular
					indeterminate
					color="primary"
					size="64"
				></v-progress-circular>
				<p class="mt-4">読み込み中...</p>
			</v-col>
		</v-row>
		
		<v-row v-else-if="tweetList.length > 0">
			<v-col
				v-for="tweet in tweetList"
				:key="tweet.id"
				cols="12"
				sm="6"
				md="4"
				lg="3"
			>
				<TweetCard
					:tweet="tweet"
					:setting="tweet.setting"
				/>
			</v-col>
		</v-row>
		
		<v-row v-else>
			<v-col cols="12" class="text-center">
				<v-alert type="info" variant="tonal">
					<v-icon class="mr-2">mdi-information</v-icon>
					つぶやきがありません
				</v-alert>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup lang="ts">
import { useTweetStore } from '@/stores/tweetStore'
import TweetCard from '@/components/TweetCard.vue'

const tweetStore = useTweetStore()
const {
	tweetList,
	selectType
} = storeToRefs(tweetStore)

const loading = ref<boolean>(false)

// タブ変更時の処理
const onTabChange = async (type: number): Promise<void> => {
	loading.value = true
	try {
		await fetchTweetList(type)
	} catch (error) {
		console.error('つぶやき一覧取得エラー:', error)
		alert('つぶやき一覧の取得に失敗しました')
	} finally {
		loading.value = false
	}
}

// つぶやき一覧取得
const fetchTweetList = async (type: number): Promise<void> => {
	switch (type) {
		case 1:
			await tweetStore.getListForBookmark()
			break
		case 2:
			await tweetStore.getList()
			break
		default:
			await tweetStore.getListForAll()
			break
	}
}

// 初回ロード
onMounted(async (): Promise<void> => {
	loading.value = true
	try {
		await fetchTweetList(selectType.value)
	} catch (error) {
		console.error('つぶやき一覧取得エラー:', error)
		alert('つぶやき一覧の取得に失敗しました')
	} finally {
		loading.value = false
	}
})
</script>

<style scoped>
.v-tabs {
	border-bottom: 1px solid #e0e0e0;
}
</style>
