<template>
	<v-container>
		<v-card class="folder-list">
			<v-data-table class="folder-list" :headers="headers" :items="folderList" :items-per-page="30" no-data-text="画像フォルダがありません">
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>画像フォルダ一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-btn color="primary" variant="flat" @click="openCreateDialog">新しい画像フォルダを作る</v-btn>
					</v-toolbar>
				</template>
				<template v-slot:[`item.name`]="{ item }">
					<a @click.prevent="openUpdateDialog(item)" class="folder-title" href="#">
						{{ item.name }}（{{ item.image_count }}）
					</a>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<v-icon class="delete-icon" :icon="mdiDelete" aria-label="削除" role="button" @click="openDeleteDialog(item)" />
				</template>
			</v-data-table>
		</v-card>
		<v-dialog v-model="createDialog" max-width="400px">
			<v-card>
				<v-card-title>画像フォルダ作成</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="フォルダ名を入力して下さい"
						v-model="folder.name" />
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="createDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="createFolder">作成</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog v-model="updateDialog" max-width="400px">
			<v-card>
				<v-card-title>画像フォルダ編集</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="フォルダ名を入力して下さい"
						v-model="folder.name" />
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="updateDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="updateFolder">更新</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog v-model="deleteDialog" max-width="400px">
			<v-card>
				<v-card-title>削除確認</v-card-title>
				<v-card-text>この画像フォルダを本当に削除しますか？</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="deleteDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="deleteFolder">削除</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import { useImagesFolderStore } from '@/stores/imagesFolderStore';
import { format } from 'date-fns';
import { mdiDelete } from '@mdi/js';

const imagesFolderStore = useImagesFolderStore();
const folderList = computed(() => imagesFolderStore.folderList);

const emit = defineEmits(["reFetchFolderList"]);

const createDialog = ref(false);
const folder = ref({
	name: ""
});

const updateDialog = ref(false);
const folderToUpdate = ref(null);

const deleteDialog = ref(false);
const folderToDelete = ref(null);

const headers = [
	{title: "フォルダ名", value: "name" },
	{title: "作成日時", value: "createdAt" },
	{title: "削除", value: "actions", sortable: false },
];

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

// フォルダ作成確認ダイアログを開く
const openCreateDialog = () => {
	createDialog.value = true;
};

// フォルダ更新確認ダイアログを開く
const openUpdateDialog = (folder) => {
	folderToUpdate.value = folder;
	updateDialog.value = true;
};

// フォルダ削除確認ダイアログを開く
const openDeleteDialog = (image) => {
	folderToDelete.value = image;
	deleteDialog.value = true;
};

// 新規フォルダ作成
const createFolder = async () => {
	createDialog.value = false;

	try {
		await imagesFolderStore.create(folder.value);
		emit("reFetchFolderList");
		alert('画像フォルダが作成されました');
	} catch (error) {
		alert(error);
	}
}

const updateFolder = async () => {
	updateDialog.value = false;

	try {
		await imagesFolderStore.update(folderToUpdate.value);
		folderToUpdate.value = null;
		emit("reFetchFolderList");
		alert('画像フォルダを更新しました');
	} catch (error) {
		alert(error);
	}
}

// フォルダ削除
const deleteFolder = async () => {
	deleteDialog.value = false;

	try {
		await imagesFolderStore.delete(folderToDelete.value.id);
		folderToDelete.value = null;
		emit("reFetchFolderList");
		alert('画像フォルダが削除されました');
	} catch (error) {
		alert(error);
	}
};
</script>

<style scoped>
	.delete-icon {
		color: red;
	}
</style>
