<template>
	<v-dialog v-model="dialog" max-width="600" scrollable>
		<v-card>
			<v-card-title class="d-flex align-center">
				<v-icon class="mr-2">
					{{ dialogType === 'followers' ? 'mdi-account-group' : 'mdi-account-heart' }}
				</v-icon>
				{{ dialogType === 'followers' ? 'フォロワー' : 'フォロー中' }}
				<v-spacer />
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
			</v-card-title>
			
			<v-divider />
			
			<v-card-text class="pa-0" style="height: 400px;">
				<div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
					<v-progress-circular indeterminate color="primary" />
				</div>
				
				<div v-else-if="userList.length === 0" class="text-center pa-8">
					<v-icon size="64" color="grey-lighten-1">
						{{ dialogType === 'followers' ? 'mdi-account-group-outline' : 'mdi-account-heart-outline' }}
					</v-icon>
					<p class="text-grey mt-4">
						{{ dialogType === 'followers' ? 'フォロワーがいません' : 'フォロー中のユーザーがいません' }}
					</p>
				</div>
				
				<v-list v-else>
					<v-list-item
						v-for="user in userList"
						:key="user.uid"
						@click="goToUserProfile(user.uid)"
						class="cursor-pointer"
					>
						<template #prepend>
							<v-avatar
								:image="user.profileUrl"
								size="50"
								class="mr-3"
							/>
						</template>
						
						<v-list-item-title class="font-weight-medium">
							{{ user.title || 'ユーザー' }}
						</v-list-item-title>
						
						<v-list-item-subtitle v-if="user.description" class="text-caption">
							{{ user.description }}
						</v-list-item-subtitle>
						
						<template #append>
							<div v-if="!isOwnProfile && user.uid !== authStore.userInfo?.uid" class="d-flex align-center">
								<v-btn
									color="success"
									size="small"
									variant="outlined"
									@click.stop="openDmDialog(user.uid)"
								>
									<v-icon size="16" class="mr-1">mdi-message-text</v-icon>
									DM
								</v-btn>
								<v-btn
									v-if="!user.isFollowing"
									color="success"
									size="small"
									variant="outlined"
									@click.stop="followUser(user.uid)"
									:loading="user.followLoading"
									:disabled="user.followLoading"
								>
									<v-icon size="16" class="mr-1">mdi-account-plus</v-icon>
									フォロー
								</v-btn>
								<v-btn
									v-else
									color="grey-lighten-4"
									size="small"
									variant="outlined"
									@click.stop="unfollowUser(user.uid)"
									:loading="user.followLoading"
									:disabled="user.followLoading"
								>
									<v-icon size="16" class="mr-1">mdi-account-minus</v-icon>
									解除
								</v-btn>
							</div>
						</template>
					</v-list-item>
				</v-list>
			</v-card-text>
		</v-card>
		
		<!-- DMダイアログ -->
		<DmDialog
			v-model="dmDialog"
			:target-user-id="dmTargetUserId"
			@message-sent="onMessageSent"
		/>
	</v-dialog>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import DmDialog from '@/components/DmDialog.vue'
import Swal from 'sweetalert2'

// 型定義
interface UserData {
	uid: string
	title: string
	description: string
	profileUrl: string
	isFollowing?: boolean
	followLoading?: boolean
}

interface Props {
	modelValue: boolean
	dialogType: 'followers' | 'following'
	targetUserId: string
}

interface Emits {
	(e: 'update:modelValue', value: boolean): void
}

// Props & Emits
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Router
const router = useRouter()

// ストア
const authStore = useAuthStore()
const followUsersStore = useFollowUsersStore()
const blogSettingStore = useBlogSettingStore()

// 状態管理
const dialog = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value)
})

const userList = ref<UserData[]>([])
const loading = ref<boolean>(false)
const dmDialog = ref<boolean>(false)
const dmTargetUserId = ref<string>('')

// 自分のプロフィールかどうか
const isOwnProfile = computed((): boolean => {
	return authStore.userInfo?.uid === props.targetUserId
})

// ダイアログを閉じる
const closeDialog = (): void => {
	dialog.value = false
}

// ユーザーリストを取得
const fetchUserList = async (): Promise<void> => {
	try {
		loading.value = true
		userList.value = []
		
		let userIds: string[] = []
		
		if (props.dialogType === 'followers') {
			// フォロワーリストを取得
			await followUsersStore.getListFollowers(props.targetUserId)
			userIds = [...followUsersStore.followersList]
		} else {
			// フォロー中リストを取得
			await followUsersStore.getListFollowing(props.targetUserId)
			userIds = [...followUsersStore.followingList]
		}
		
		// ユーザー情報を取得
		const userPromises = userIds.map(async (uid) => {
			try {
				const userSetting = await blogSettingStore.getForUid(uid)
				if (userSetting) {
					const userData: UserData = {
						uid,
						title: userSetting.title || 'ユーザー',
						description: userSetting.description || '',
						profileUrl: userSetting.profileUrl || '',
						isFollowing: false,
						followLoading: false
					}
					
					// フォロー状態を確認（自分のプロフィールでない場合）
					if (!isOwnProfile.value && uid !== authStore.userInfo?.uid) {
						userData.isFollowing = await followUsersStore.isFollower(uid)
					}
					
					return userData
				}
				return null
			} catch (error) {
				console.error(`ユーザー情報の取得に失敗しました (${uid}):`, error)
				return null
			}
		})
		
		const users = await Promise.all(userPromises)
		userList.value = users.filter((user): user is UserData => user !== null)
		
	} catch (error) {
		console.error('ユーザーリストの取得に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'ユーザーリストの取得に失敗しました',
			icon: 'error'
		})
	} finally {
		loading.value = false
	}
}

// ユーザーをフォロー
const followUser = async (uid: string): Promise<void> => {
	try {
		const user = userList.value.find(u => u.uid === uid)
		if (user) {
			user.followLoading = true
		}
		
		await followUsersStore.create(uid)
		
		if (user) {
			user.isFollowing = true
		}
		
		Swal.fire({
			title: '成功',
			text: 'フォローしました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
	} catch (error) {
		console.error('フォローに失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'フォローに失敗しました',
			icon: 'error'
		})
	} finally {
		const user = userList.value.find(u => u.uid === uid)
		if (user) {
			user.followLoading = false
		}
	}
}

// ユーザーのフォローを解除
const unfollowUser = async (uid: string): Promise<void> => {
	try {
		const user = userList.value.find(u => u.uid === uid)
		if (user) {
			user.followLoading = true
		}
		
		await followUsersStore.deleteItem(uid)
		
		if (user) {
			user.isFollowing = false
		}
		
		Swal.fire({
			title: '成功',
			text: 'フォローを解除しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
	} catch (error) {
		console.error('フォロー解除に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'フォロー解除に失敗しました',
			icon: 'error'
		})
	} finally {
		const user = userList.value.find(u => u.uid === uid)
		if (user) {
			user.followLoading = false
		}
	}
}

// ユーザープロフィールに遷移
const goToUserProfile = (uid: string): void => {
	if (uid !== authStore.userInfo?.uid) {
		router.push({
			path: '/user_profile',
			query: { uid }
		})
	}
}

// DMダイアログを開く
const openDmDialog = (uid: string): void => {
	dmTargetUserId.value = uid
	dmDialog.value = true
}

// メッセージ送信完了時の処理
const onMessageSent = (): void => {
	// 必要に応じて追加の処理を実装
}

// ダイアログが開かれた時にデータを取得
watch(() => props.modelValue, (newValue) => {
	if (newValue) {
		fetchUserList()
	}
})

// ターゲットユーザーIDが変更された時もデータを再取得
watch(() => props.targetUserId, () => {
	if (props.modelValue) {
		fetchUserList()
	}
})
</script>

<style scoped>
.cursor-pointer {
	cursor: pointer;
}

.cursor-pointer:hover {
	background-color: rgba(0, 0, 0, 0.04);
}
</style>
