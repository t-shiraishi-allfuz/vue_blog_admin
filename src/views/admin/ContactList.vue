<template>
	<v-container>
		<v-card class="contact-list">
			<v-data-table
				class="contact-list"
				:headers="headers"
				:items="contactList"
				:items-per-page="30"
				no-data-text="お問い合わせがありません"
			>
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>お問い合わせ一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
					</v-toolbar>
				</template>
				<template v-slot:[`item.name`]="{ item }">
					<div>
						<div class="font-weight-bold">
							{{ item.setting?.name || '名無し' }}
						</div>
						<div v-if="item.uid && item.setting?.name" class="text-caption text-grey">
							UID: {{ item.uid }}
						</div>
					</div>
				</template>
				<template v-slot:[`item.email`]="{ item }">
					{{ item.email }}
				</template>
				<template v-slot:[`item.subject`]="{ item }">
					{{ item.subject }}
				</template>
				<template v-slot:[`item.message`]="{ item }">
					<div class="text-truncate" style="max-width: 300px;">
						{{ item.message }}
					</div>
				</template>
				<template v-slot:[`item.status`]="{ item }">
					<v-chip
						:color="getStatusColor(item.status)"
						size="small"
						variant="flat"
					>
						{{ getStatusText(item.status) }}
					</v-chip>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<div class="d-flex gap-2">
						<v-icon
							class="view-icon"
							icon="mdi-eye"
							aria-label="詳細"
							role="button"
							@click="viewDetail(item)"
						/>
						<v-icon
							v-if="canReply(item)"
							class="reply-icon"
							icon="mdi-reply"
							aria-label="返信"
							role="button"
							@click="openReplyDialog(item)"
						/>
						<v-icon
							v-if="isOwner || (authStore.userInfo && item.uid === authStore.userInfo.uid)"
							class="delete-icon"
							icon="mdi-delete"
							aria-label="削除"
							role="button"
							@click="openDeleteDialog(item)"
						/>
					</div>
				</template>
			</v-data-table>
		</v-card>

		<!-- 詳細ダイアログ -->
		<DialogTemplate
			ref="detailDialogRef"
			label="お問い合わせ詳細"
			v-model:dialog="isDetailDialog"
			:scrollable="true"
		>
			<template v-slot:contents>
				<v-card-text v-if="selectedContact">
					<v-row class="mb-3">
						<v-col cols="3" class="font-weight-bold">ニックネーム:</v-col>
						<v-col cols="9">
							{{ selectedContact.setting?.name || '名無し' }}
						</v-col>
					</v-row>
					<v-row class="mb-3" v-if="selectedContact.uid">
						<v-col cols="3" class="font-weight-bold">UID:</v-col>
						<v-col cols="9">{{ selectedContact.uid }}</v-col>
					</v-row>
					<v-row class="mb-3">
						<v-col cols="3" class="font-weight-bold">メールアドレス:</v-col>
						<v-col cols="9">{{ selectedContact.email }}</v-col>
					</v-row>
					<v-row class="mb-3">
						<v-col cols="3" class="font-weight-bold">件名:</v-col>
						<v-col cols="9">{{ selectedContact.subject }}</v-col>
					</v-row>
					<v-row class="mb-3">
						<v-col cols="3" class="font-weight-bold">お問い合わせ内容:</v-col>
						<v-col cols="9">
							<div style="white-space: pre-wrap;">{{ selectedContact.message }}</div>
						</v-col>
					</v-row>
					<v-row class="mb-3">
						<v-col cols="3" class="font-weight-bold">送信日時:</v-col>
						<v-col cols="9">{{ formatDate(selectedContact.createdAt) }}</v-col>
					</v-row>
					<v-row class="mb-3">
						<v-col cols="3" class="font-weight-bold">ステータス:</v-col>
						<v-col cols="9">
							<v-chip
								:color="getStatusColor(selectedContact.status)"
								size="small"
								variant="flat"
							>
								{{ getStatusText(selectedContact.status) }}
							</v-chip>
						</v-col>
					</v-row>
					<v-row class="mb-3" v-if="selectedContact.replyMessage">
						<v-col cols="3" class="font-weight-bold">返信内容:</v-col>
						<v-col cols="9">
							<div style="white-space: pre-wrap; background-color: #f5f5f5; padding: 12px; border-radius: 4px;">
								{{ selectedContact.replyMessage }}
							</div>
						</v-col>
					</v-row>
					<v-row class="mb-3" v-if="selectedContact.replyAt">
						<v-col cols="3" class="font-weight-bold">返信日時:</v-col>
						<v-col cols="9">{{ formatDate(selectedContact.replyAt) }}</v-col>
					</v-row>
					<v-divider class="my-4" />
					<div v-if="isOwner" class="d-flex gap-2 justify-end">
						<v-btn
							v-if="selectedContact.status !== 'read'"
							color="primary"
							class="mr-2"
							variant="flat"
							@click="markAsRead"
						>
							既読にする
						</v-btn>
						<v-btn
							v-if="canReply(selectedContact)"
							color="success"
							class="mr-2"
							variant="flat"
							@click="openReplyDialog(selectedContact)"
						>
							返信する
						</v-btn>
					</div>
				</v-card-text>
			</template>
		</DialogTemplate>

		<!-- 返信ダイアログ -->
		<DialogTemplate
			ref="replyDialogRef"
			label="返信"
			v-model:dialog="isReplyDialog"
			:scrollable="true"
		>
			<template v-slot:contents>
				<v-card-text v-if="selectedContact">
					<v-row class="mb-3">
						<v-col cols="12" class="font-weight-bold">お問い合わせ内容:</v-col>
						<v-col cols="12">
							<div style="white-space: pre-wrap; background-color: #f5f5f5; padding: 12px; border-radius: 4px;">
								{{ selectedContact.message }}
							</div>
						</v-col>
					</v-row>
					<v-row class="mb-3" v-if="selectedContact.replyMessage">
						<v-col cols="12" class="font-weight-bold">既存の返信:</v-col>
						<v-col cols="12">
							<div style="white-space: pre-wrap; background-color: #e3f2fd; padding: 12px; border-radius: 4px;">
								{{ selectedContact.replyMessage }}
							</div>
						</v-col>
					</v-row>
					<v-divider class="my-4" />
					<v-row class="mb-3">
						<v-col cols="12">
							<v-textarea
								v-model="replyMessage"
								label="返信内容"
								:rules="replyRules"
								required
								variant="outlined"
								rows="10"
								placeholder="返信内容を入力してください"
							/>
						</v-col>
					</v-row>
					<div class="d-flex gap-2 justify-end">
						<v-btn
							color="grey-lighten-2"
							class="mr-2"
							variant="flat"
							@click="closeReplyDialog"
							:disabled="isSubmittingReply"
						>
							キャンセル
						</v-btn>
						<v-btn
							color="success"
							class="mr-2"
							variant="flat"
							@click="submitReply"
							:loading="isSubmittingReply"
							:disabled="isSubmittingReply"
						>
							送信
						</v-btn>
					</div>
				</v-card-text>
			</template>
		</DialogTemplate>
	</v-container>
</template>

<script setup lang="ts">
import { useContactStore } from '@/stores/contactStore'
import { useAuthStore } from '@/stores/authStore'
import { useUsersStore } from '@/stores/usersStore'
import { format } from 'date-fns'
import Swal from 'sweetalert2'

// 型定義
interface ContactData {
	id: string
	uid: string | null
	name?: string | null
	email: string
	subject: string
	message: string
	createdAt: Date | null
	updatedAt: Date | null
	status: 'pending' | 'read' | 'replied'
	replyMessage?: string | null
	replyAt?: Date | null
	replyBy?: string | null
	setting?: any
}

interface HeaderItem {
	title: string
	value: string
	sortable?: boolean
}

const contactStore = useContactStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const {
	contactList
} = storeToRefs(contactStore)

const isOwner = ref<boolean>(false)

const selectedContact = ref<ContactData | null>(null)
const contactToDelete = ref<ContactData | null>(null)
const contactToReply = ref<ContactData | null>(null)
const isDetailDialog = ref<boolean>(false)
const isReplyDialog = ref<boolean>(false)
const detailDialogRef = ref<any>(null)
const replyDialogRef = ref<any>(null)
const replyMessage = ref<string>('')
const isSubmittingReply = ref<boolean>(false)

const headers: HeaderItem[] = [
	{ title: "お名前", value: "name" },
	{ title: "メールアドレス", value: "email" },
	{ title: "件名", value: "subject" },
	{ title: "お問い合わせ内容", value: "message" },
	{ title: "ステータス", value: "status" },
	{ title: "送信日時", value: "createdAt" },
	{ title: "操作", value: "actions", sortable: false },
]

// 返信可能かチェック
const canReply = (contact: ContactData): boolean => {
	if (isOwner.value) {
		// 管理者：未返信（pendingまたはread）の場合
		return contact.status === 'pending' || contact.status === 'read'
	} else {
		// 一般ユーザー：返信済み（replied）の場合
		return contact.status === 'replied'
	}
}

// 返信ダイアログを開く
const openReplyDialog = (contact: ContactData): void => {
	contactToReply.value = contact
	replyMessage.value = contact.replyMessage || ''
	isReplyDialog.value = true
}

// 返信ダイアログを閉じる
const closeReplyDialog = (): void => {
	contactToReply.value = null
	replyMessage.value = ''
	isReplyDialog.value = false
}

// 返信を送信
const submitReply = async (): Promise<void> => {
	if (!contactToReply.value || !replyMessage.value.trim()) return
	
	isSubmittingReply.value = true
	
	try {
		await contactStore.sendReply(contactToReply.value.id, replyMessage.value)
		
		// 一覧を更新
		await fetchContactList()
		
		// 詳細ダイアログが開いていれば更新
		if (selectedContact.value && selectedContact.value.id === contactToReply.value.id) {
			selectedContact.value.replyMessage = replyMessage.value
			selectedContact.value.replyAt = new Date()
			selectedContact.value.status = 'replied'
		}
		
		await Swal.fire({
			title: '送信完了',
			text: '返信を送信しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false,
		})
		
		closeReplyDialog()
		
		// 詳細ダイアログを閉じる
		if (isDetailDialog.value) {
			isDetailDialog.value = false
		}
	} catch (error: any) {
		console.error('返信送信エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: '返信の送信に失敗しました',
			icon: 'error',
			confirmButtonColor: '#27C1A3',
		})
	} finally {
		isSubmittingReply.value = false
	}
}

// 返信バリデーションルール
const replyRules = [
	(v: string) => !!v || '返信内容を入力してください',
	(v: string) => v.length <= 5000 || '返信内容は5000文字以内で入力してください'
]

// ステータスの色を取得
const getStatusColor = (status: string): string => {
	switch (status) {
		case 'pending':
			return 'orange'
		case 'read':
			return 'blue'
		case 'replied':
			return 'green'
		default:
			return 'grey'
	}
}

// ステータスのテキストを取得
const getStatusText = (status: string): string => {
	switch (status) {
		case 'pending':
			return '未読'
		case 'read':
			return '既読'
		case 'replied':
			return '返信済み'
		default:
			return '不明'
	}
}

// オーナー権限を確認
const checkOwnerStatus = async (): Promise<void> => {
	if (authStore.isLogin && authStore.userInfo) {
		try {
			isOwner.value = await usersStore.isOwner(authStore.userInfo.uid)
		} catch (error) {
			console.error('オーナー権限確認エラー:', error)
			isOwner.value = false
		}
	}
}

// 一覧取得
const fetchContactList = async (): Promise<void> => {
	try {
		if (isOwner.value) {
			// 管理者：全てのお問い合わせを取得
			await contactStore.getList()
		} else if (authStore.isLogin && authStore.userInfo) {
			// 一般ユーザー：自分のお問い合わせのみを取得
			await contactStore.getListForUser(authStore.userInfo.uid)
		}
	} catch (error: any) {
		console.error('お問い合わせ一覧の取得に失敗しました:', error)
		await Swal.fire({
			title: 'エラー',
			text: 'お問い合わせ一覧の取得に失敗しました',
			icon: 'error',
			confirmButtonColor: '#27C1A3',
		})
	}
}

// 詳細を表示
const viewDetail = async (contact: ContactData): Promise<void> => {
	try {
		selectedContact.value = contact
		isDetailDialog.value = true
		
		// 未読の場合は既読に更新
		if (contact.status === 'pending') {
			await contactStore.updateStatus(contact.id, 'read')
			contact.status = 'read'
		}
	} catch (error: any) {
		console.error('お問い合わせ詳細の取得に失敗しました:', error)
		await Swal.fire({
			title: 'エラー',
			text: 'お問い合わせ詳細の取得に失敗しました',
			icon: 'error',
			confirmButtonColor: '#27C1A3',
		})
	}
}

// 既読にする
const markAsRead = async (): Promise<void> => {
	if (!selectedContact.value) return
	
	try {
		await contactStore.updateStatus(selectedContact.value.id, 'read')
		selectedContact.value.status = 'read'
		
		// 一覧も更新
		const contact = contactList.value.find(c => c.id === selectedContact.value!.id)
		if (contact) {
			contact.status = 'read'
		}
		
		await Swal.fire({
			title: '更新完了',
			text: 'ステータスを既読に更新しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false,
		})
	} catch (error: any) {
		console.error('ステータス更新エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: 'ステータスの更新に失敗しました',
			icon: 'error',
			confirmButtonColor: '#27C1A3',
		})
	}
}


// 削除確認ダイアログを開く
const openDeleteDialog = async (contact: ContactData): Promise<void> => {
	contactToDelete.value = contact

	const result = await Swal.fire({
		title: '削除確認',
		text: 'このお問い合わせを本当に削除しますか？',
		showCancelButton: true,
		confirmButtonColor: '#27C1A3',
		cancelButtonColor: '#9e9e9e',
		confirmButtonText: '削除',
		cancelButtonText: 'キャンセル',
		reverseButtons: true,
		buttonsStyling: true,
		customClass: {
			confirmButton: 'swal2-confirm-fixed-width',
			cancelButton: 'swal2-cancel-fixed-width'
		},
		didOpen: () => {
			// ダイアログが開いた後にボタンのスタイルを適用
			const confirmBtn = document.querySelector('.swal2-confirm-fixed-width') as HTMLElement
			const cancelBtn = document.querySelector('.swal2-cancel-fixed-width') as HTMLElement
			if (confirmBtn) {
				confirmBtn.style.minWidth = '150px'
				confirmBtn.style.width = '150px'
			}
			if (cancelBtn) {
				cancelBtn.style.minWidth = '150px'
				cancelBtn.style.width = '150px'
			}
		}
	})

	if (result.isConfirmed && contactToDelete.value) {
		try {
			await contactStore.deleteItem(contactToDelete.value)
			await fetchContactList()
			
			await Swal.fire({
				title: '削除完了',
				text: 'お問い合わせを削除しました',
				icon: 'success',
				timer: 1500,
				showConfirmButton: false,
				confirmButtonColor: '#27C1A3',
			})
		} catch (error: any) {
			console.error('削除エラー:', error)
			await Swal.fire({
				title: 'エラー',
				text: 'お問い合わせの削除に失敗しました',
				icon: 'error',
				confirmButtonColor: '#27C1A3',
			})
		}
	}
}

// 日時フォーマット関数
const formatDate = (date: Date | null): string => {
	if (!date) return '日付不明'
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

onMounted(async (): Promise<void> => {
	await checkOwnerStatus()
	await fetchContactList()
})
</script>

<style scoped>
.view-icon {
	color: #2196F3;
	cursor: pointer;
}

.reply-icon {
	color: #4CAF50;
	cursor: pointer;
}

.delete-icon {
	color: red;
	cursor: pointer;
}
</style>

