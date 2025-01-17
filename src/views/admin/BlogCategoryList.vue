<template>
	<v-container>
		<v-card class="category-list">
			<v-data-table
				v-if="isLoading"
				class="category-list"
				:headers="headers"
				:items="categoryList"
				:items-per-page="30"
				no-data-text="カテゴリーがありません"
			>
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>カテゴリー一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-btn color="primary" variant="flat" @click="openCreateDialog">新しいカテゴリーを作る</v-btn>
					</v-toolbar>
				</template>
				<template v-slot:[`item.name`]="{ item }">
					<v-icon
						v-if="item.pre_category_id"
						:icon="mdiSubdirectoryArrowRight"
						:style="{ marginLeft: '20px' }"
					/>
					<a @click.prevent="openUpdateDialog(item)" class="folder-title" href="#">
						{{ item.name }}（{{ item.blog_count }}）
					</a>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<v-icon
						class="delete-icon"
						:icon="mdiDelete"
						aria-label="削除"
						role="button"
						@click="openDeleteDialog(item)"
					/>
				</template>
			</v-data-table>
		</v-card>
		<v-dialog v-model="createDialog" max-width="400px">
			<v-card>
				<v-card-title>カテゴリー作成</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="カテゴリー名を入力して下さい"
						v-model="category.name" />
				</v-card-text>
				<v-card-text v-if="categoryList.length > 0">
					<v-select
						label="親カテゴリーを設定する場合は選択して下さい"
						:items="categoryList"
						item-title="name"
						item-value="id"
						v-model="selectedPreCategoryID"
						hide-details />
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="createDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="createCategory">作成</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog v-model="updateDialog" max-width="400px">
			<v-card>
				<v-card-title>カテゴリー編集</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="カテゴリー名を入力して下さい"
						v-model="categoryToUpdate.name" />
				</v-card-text>
				<v-card-text v-if="categoryList.length > 0">
					<v-select
						label="親カテゴリーを設定する場合は選択して下さい"
						:items="categoryList"
						item-title="name"
						item-value="id"
						v-model="categoryToUpdate.pre_category_id"
						hide-details />
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="updateDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="updateCategory">更新</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog v-model="deleteDialog" max-width="400px">
			<v-card>
				<v-card-title>削除確認</v-card-title>
				<v-card-text>このカテゴリーを本当に削除しますか？</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="deleteDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="deleteCategory">削除</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBlogCategoryStore } from '@/stores/blogCategoryStore';
import { format } from 'date-fns';
import { mdiDelete, mdiSubdirectoryArrowRight } from '@mdi/js';

const blogCategoryStore = useBlogCategoryStore();
const categoryList = computed(() => blogCategoryStore.categoryList);

const isLoading = ref(false);

const createDialog = ref(false);
const category = ref({
	pre_category_id: null,
	name: ""
});
const selectedPreCategoryID = ref(null);

const updateDialog = ref(false);
const categoryToUpdate = ref(null);

const deleteDialog = ref(false);
const categoryToDelete = ref(null);

const headers = [
	{title: "カテゴリー名", value: "name" },
	{title: "作成日時", value: "createdAt" },
	{title: "削除", value: "actions", sortable: false },
];

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
};

// カテゴリー作成確認ダイアログを開く
const openCreateDialog = () => {
	createDialog.value = true;
};

// カテゴリー更新確認ダイアログを開く
const openUpdateDialog = (category) => {
	categoryToUpdate.value = category;
	updateDialog.value = true;
};

// カテゴリー削除確認ダイアログを開く
const openDeleteDialog = (category) => {
	categoryToDelete.value = category;
	deleteDialog.value = true;
};

// 新規カテゴリー作成
const createCategory = async () => {
	createDialog.value = false;
	category.value.pre_category_id = selectedPreCategoryID.value;

	await blogCategoryStore.create(category.value);
	await reFetch();
	selectedPreCategoryID.value = null;
	category.value = { pre_category_id: null, name: "" };
	alert('カテゴリーが作成されました');
}

// カテゴリー更新
const updateCategory = async () => {
	updateDialog.value = false;

	// 親と同一IDはNG
	if (categoryToUpdate.value.pre_category_id == categoryToUpdate.value.id) {
		alert('同じカテゴリーは選択出来ません');
		return;
	}

	await blogCategoryStore.update(categoryToUpdate.value);
	await reFetch();
	categoryToUpdate.value = null;
	alert('カテゴリーを更新しました');
}

// カテゴリー削除
const deleteCategory = async () => {
	deleteDialog.value = false;

	await blogCategoryStore.delete(categoryToDelete.value);
	await reFetch();
	categoryToDelete.value = null;
	alert('カテゴリーが削除されました');
};

// 再取得
const reFetch = async () => {
	await blogCategoryStore.getList();
}

onMounted(async() => {
	await blogCategoryStore.getList();
	isLoading.value = true;
})
</script>

<style scoped>
	.delete-icon {
		color: red;
	}
</style>
